import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { useLicenseActions } from '../../hooks/useLicenseActions'
import { Button } from '../../components/ui/button'
import ResellerLayout from '../../components/ResellerLayout'

interface License {
  license_key: string
  user_name: string
  email?: string
  phone?: string
  status: string
  license_type: string
  expires_at: string
  device_id?: string
  lifetime: boolean
  created_at: string
}

export default function ResellerDashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { copyLicenseKey, renewLicense, resetHwid, revokeLicense, deleteLicense, submitMutation } = useLicenseActions()
  const [licenses, setLicenses] = useState<License[]>([])
  const [credits, setCredits] = useState(0)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [creditsPurchased, setCreditsPurchased] = useState(0)
  const [creditsGranted, setCreditsGranted] = useState(0)
  const [selectedType, setSelectedType] = useState<'paid' | 'lifetime'>('paid')
  const [daysValue, setDaysValue] = useState(30)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const PAGE_SIZE_OPTIONS = [10, 15, 25, 50]
  
  // Estados do modal de compra
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [quantity, setQuantity] = useState(10)
  const [buyerName, setBuyerName] = useState('')
  const [buyerCPF, setBuyerCPF] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [pixQRCode, setPixQRCode] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [showPixModal, setShowPixModal] = useState(false)
  const [, setPaymentId] = useState('')
  const [pricingTiers, setPricingTiers] = useState<Array<{min_quantity: number, max_quantity: number | null, unit_price: number}>>([])
  useEffect(() => {
    document.body.classList.add('session-ready')
    loadDashboard()
    loadLicenses()
    loadPricing()
    
    // Subscrever mudanças na tabela resellers para atualizar créditos em tempo real
    const channel = supabase
      .channel('reseller-credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resellers',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          loadDashboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  async function loadPricing() {
    try {
      const { data, error } = await supabase
        .from('product_pricing')
        .select('min_quantity, max_quantity, unit_price')
        .eq('is_active', true)
        .order('min_quantity', { ascending: true })

      if (error) throw error
      setPricingTiers(data || [])
    } catch (error) {
      console.error('Erro ao carregar preços:', error)
      setPricingTiers([
        { min_quantity: 1, max_quantity: 9, unit_price: 30.00 },
        { min_quantity: 10, max_quantity: 19, unit_price: 25.00 },
        { min_quantity: 20, max_quantity: 29, unit_price: 20.00 },
        { min_quantity: 30, max_quantity: null, unit_price: 15.00 }
      ])
    }
  }

  async function loadDashboard() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESELLER_DASHBOARD}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        const reseller = result.reseller || {}
        setCredits(reseller.credits || 0)
        setCreditsUsed(reseller.total_licenses_created || 0)
        setCreditsPurchased(reseller.total_credits_purchased || 0)
        
        // Créditos concedidos = total já criado + disponíveis
        const totalGranted = (reseller.total_licenses_created || 0) + (reseller.credits || 0)
        setCreditsGranted(totalGranted)
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    }
  }

  async function loadLicenses() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESELLER_LIST_LICENSES}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        setLicenses(result.licenses || [])
      }
    } catch (error) {
      console.error('Erro ao carregar licenças:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateLicense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
    
    const payload = {
      user_name: (form.querySelector('#user-name') as HTMLInputElement).value.trim(),
      phone: (form.querySelector('#phone') as HTMLInputElement).value.trim(),
      license_type: selectedType,
      days: selectedType === 'lifetime' ? null : daysValue,
      lifetime: selectedType === 'lifetime'
    }

    await submitMutation(submitBtn, async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESELLER_CREATE_LICENSE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result
    }, 'Licença criada com sucesso.')

    form.reset()
    setDaysValue(30)
    await loadDashboard()
    await loadLicenses()
  }

  async function handleCreateTrial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
    
    const minutes = Math.min(Number((form.querySelector('#trial-minutes') as HTMLInputElement).value || 30), 30)
    const payload = {
      user_name: (form.querySelector('#trial-name') as HTMLInputElement).value.trim() || 'Cliente teste',
      license_type: 'trial',
      trial_minutes: minutes,
      lifetime: false
    }

    await submitMutation(submitBtn, async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESELLER_CREATE_LICENSE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result
    }, 'Trial criado com sucesso.')

    form.reset()
    await loadLicenses()
  }

  async function handleTableAction(e: React.MouseEvent) {
    const button = (e.target as HTMLElement).closest('button[data-action]') as HTMLButtonElement
    if (!button) return

    const key = button.dataset.key!
    const action = button.dataset.action!

    if (action === 'copy') {
      await copyLicenseKey(key)
      return
    }

    if (action === 'renew') {
      await renewLicense(key, button)
    }

    if (action === 'reset') {
      await resetHwid(key, button)
    }

    if (action === 'revoke') {
      await revokeLicense(key, button)
    }

    if (action === 'delete') {
      await deleteLicense(key, button, true)
    }

    await loadDashboard()
    await loadLicenses()
  }

  function calculatePrice(qty: number) {
    // Buscar preço baseado na quantidade usando tabela do banco
    let unitPrice = 30.00 // fallback
    
    for (const tier of pricingTiers) {
      if (tier.max_quantity === null) {
        // Última faixa sem limite superior
        if (qty >= tier.min_quantity) {
          unitPrice = tier.unit_price
          break
        }
      } else {
        // Faixas com limite superior
        if (qty >= tier.min_quantity && qty <= tier.max_quantity) {
          unitPrice = tier.unit_price
          break
        }
      }
    }
    
    const basePrice = 30.00
    const discount = unitPrice < basePrice ? Math.round(((basePrice - unitPrice) / basePrice) * 100) : 0
    
    return {
      unitPrice,
      total: unitPrice * qty,
      discount
    }
  }

  async function handleBuyCredits(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement
    
    const { total } = calculatePrice(quantity)
    
    const payload = {
      quantity,
      buyer_name: buyerName,
      buyer_cpf: buyerCPF,
      buyer_phone: buyerPhone,
      buyer_email: buyerEmail || user?.email,
      total_amount: total
    }

    const original = submitBtn.textContent
    submitBtn.disabled = true
    submitBtn.textContent = 'Gerando Pix...'
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESELLER_BUY_CREDITS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar pagamento')
      }
      
      setPixQRCode(result.qr_code_base64)
      setPixCode(result.qr_code)
      setPaymentId(result.payment_id)
      setShowBuyModal(false)
      setShowPixModal(true)
      
      // Iniciar polling para verificar pagamento
      startPaymentPolling(result.payment_id)
      
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao gerar pagamento Pix', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = original
    }
  }

  function startPaymentPolling(payment_id: string) {
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`${SUPABASE_URL}/functions/v1/check-payment-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payment_id })
        })
        
        const result = await response.json()
        
        if (result.status === 'approved') {
          clearInterval(interval)
          setShowPixModal(false)
          showToast(`Pagamento aprovado! ${quantity} créditos adicionados.`)
          await loadDashboard()
          
          // Resetar formulário
          setQuantity(10)
          setBuyerName('')
          setBuyerCPF('')
          setBuyerPhone('')
          setBuyerEmail('')
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
      }
    }, 5000) // Verifica a cada 5 segundos
    
    // Parar após 10 minutos
    setTimeout(() => clearInterval(interval), 600000)
  }

  async function copyPixCode() {
    await navigator.clipboard.writeText(pixCode)
    showToast('Código Pix copiado!')
  }

  function formatDate(value: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  function labelStatus(status: string) {
    const labels: Record<string, string> = { active: 'Ativa', trial: 'Trial', expired: 'Expirada', suspended: 'Suspensa' }
    return labels[status] || status
  }

  const filteredLicenses = licenses.filter((license) => {
    const statusMatch = statusFilter === 'all' || license.status === statusFilter || license.license_type === statusFilter
    const text = `${license.user_name || ''} ${license.email || ''} ${license.phone || ''} ${license.license_key || ''}`.toLowerCase()
    return statusMatch && (!searchTerm || text.includes(searchTerm.toLowerCase()))
  })
  const totalPages = Math.ceil(filteredLicenses.length / pageSize)
  const safePage = Math.min(page, Math.max(1, totalPages))
  const paginatedLicenses = filteredLicenses.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <ResellerLayout currentPage="/reseller">
      <main className="app-shell">
        <section id="dashboard" className="hero-panel reveal">
          <div>
            <p className="eyebrow">Painel do Revendedor</p>
            <h1>Gere e gerencie suas chaves.</h1>
            <p>Use seus créditos para criar licenças vitalícias e testes de 30 minutos.</p>
          </div>
        </section>

        <div id="credits" className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(109,232,255,0.12), rgba(157,255,47,0.08))', padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(157,255,47,0.2)', display: 'grid', placeItems: 'center', fontSize: '24px' }}>
              🔑
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--text)' }}>
                {credits} / {creditsGranted} chaves disponíveis
              </strong>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 0' }}>
                {creditsUsed} usadas · {creditsPurchased} compradas · {creditsGranted} liberadas pelo admin
              </p>
            </div>
            <Button style={{ whiteSpace: 'nowrap' }} onClick={() => setShowBuyModal(true)}>🛒 Comprar chaves</Button>
          </div>
        </div>

        <section className="work-grid">
          <article id="create-license" className="glass-card">
            <div className="card-heading"><span className="icon-pill">🔑</span><h2>Gerar licença</h2></div>
            <form className="stack-form" onSubmit={handleCreateLicense}>
              <label><span>Nome do cliente</span><input id="user-name" type="text" placeholder="Ex: João Silva" required /></label>
              <label><span>Telefone (opcional)</span><input id="phone" type="tel" placeholder="Ex: (11) 99999-9999" /></label>
              <div className="segmented" role="group" aria-label="Tipo de licença">
                <button 
                  type="button" 
                  className={`segment ${selectedType === 'paid' ? 'active' : ''}`}
                  onClick={() => setSelectedType('paid')}
                >
                  Por dias
                </button>
                <button 
                  type="button" 
                  className={`segment ${selectedType === 'lifetime' ? 'active' : ''}`}
                  onClick={() => setSelectedType('lifetime')}
                >
                  Vitalícia
                </button>
              </div>
              <label style={{ display: selectedType === 'lifetime' ? 'none' : 'block' }}>
                <span>Dias</span>
                <input 
                  id="license-days" 
                  type="number" 
                  min="1" 
                  value={daysValue}
                  onChange={(e) => setDaysValue(Number(e.target.value))}
                />
              </label>
              <Button type="submit">
                {selectedType === 'lifetime' ? 'Gerar vitalícia' : `Gerar ${daysValue} dias`}
              </Button>
            </form>
          </article>

          <article id="create-trial" className="glass-card">
            <div className="card-heading"><span className="icon-pill">⏱️</span><h2>Gerar teste (máx. 30min)</h2></div>
            <form className="stack-form" onSubmit={handleCreateTrial}>
              <label><span>Nome do cliente (opcional)</span><input id="trial-name" type="text" placeholder="Ex: João Silva" /></label>
              <label><span>Minutos (máx. 30)</span><input id="trial-minutes" type="number" min="1" max="30" defaultValue="30" /></label>
              <Button type="submit">Gerar trial</Button>
            </form>
          </article>
        </section>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Minhas Licenças</h2>
              <p>{filteredLicenses.length} de {licenses.length} licença(s){filteredLicenses.length > 0 ? ` · Página ${safePage} de ${totalPages}` : ''}</p>
            </div>
            <div className="table-tools">
              <input 
                type="search" 
                placeholder="Buscar cliente, email, chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspensas</option>
                <option value="lifetime">Vitalícias</option>
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Chave</th>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Expira</th>
                  <th>HWID</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody onClick={handleTableAction}>
                {loading ? (
                  <tr><td colSpan={7}>Carregando...</td></tr>
                ) : filteredLicenses.length === 0 ? (
                  <tr><td colSpan={7}>Nenhuma licença encontrada.</td></tr>
                ) : (
                  paginatedLicenses.map((license) => (
                    <tr key={license.license_key}>
                      <td data-label="Cliente">
                        <strong>{license.user_name || 'Sem nome'}</strong>
                        <small>{license.email || license.phone || '—'}</small>
                      </td>
                      <td data-label="Chave"><span className="license-key">{license.license_key}</span></td>
                      <td data-label="Status"><span className={`badge ${license.status}`}>{labelStatus(license.status)}</span></td>
                      <td data-label="Tipo">{license.lifetime ? 'Vitalícia' : license.license_type || 'paid'}</td>
                      <td data-label="Expira">{formatDate(license.expires_at)}</td>
                      <td data-label="HWID">{license.device_id ? 'vinculado' : 'livre'}</td>
                      <td data-label="Ações">
                        <div className="actions-row">
                          <Button size="tiny" data-action="copy" data-key={license.license_key}>Copiar</Button>
                          {license.license_type !== 'trial' && !license.lifetime && (
                            <Button size="tiny" data-action="renew" data-key={license.license_key}>Renovar</Button>
                          )}
                          {license.license_type !== 'trial' || license.lifetime ? (
                            <Button size="tiny" data-action="reset" data-key={license.license_key}>HWID</Button>
                          ) : null}
                          {license.status !== 'suspended' && (
                            <Button size="tiny" variant="destructive" data-action="revoke" data-key={license.license_key}>Revogar</Button>
                          )}
                          <Button size="tiny" variant="destructive" data-action="delete" data-key={license.license_key}>Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>            </table>
          </div>
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px 0',
              borderTop: '1px solid var(--line)',
              marginTop: '8px'
            }}>
              <Button variant="outline" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                ← Anterior
              </Button>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                {safePage} / {totalPages}
              </span>
              <Button variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Próximo →
              </Button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  marginLeft: '12px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
                aria-label="Itens por página"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size} / pág</option>
                ))}
              </select>
            </div>
          )}
        </section>

      </main>

      {/* Modal de Compra */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBuyModal(false)}>&times;</button>
            <h2>🛒 Loja de Revenda</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              Chaves vitalícias - revenda pelo preço que quiser
            </p>

            <form onSubmit={handleBuyCredits} className="stack-form">
              <div style={{ padding: '20px', background: 'rgba(157,255,47,0.08)', borderRadius: '14px', marginBottom: '20px' }}>
                <label style={{ marginBottom: '12px' }}>
                  <span>Quantas chaves você quer comprar?</span>
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ minHeight: '40px', width: '40px' }}
                  >
                    −
                  </Button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    min="1"
                    style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ minHeight: '40px', width: '40px' }}
                  >
                    +
                  </Button>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                  R$ {calculatePrice(quantity).unitPrice.toFixed(2)} cada
                  {calculatePrice(quantity).discount > 0 && ` (${calculatePrice(quantity).discount}% de desconto)`}
                </p>
              </div>

              <div style={{ background: 'rgba(109,232,255,0.08)', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>📦 Resumo</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Chaves ({quantity} × R$ {calculatePrice(quantity).unitPrice.toFixed(2)})</span>
                  <strong style={{ color: 'var(--cyan)' }}>R$ {calculatePrice(quantity).total.toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-2)', marginTop: '12px' }}>
                  ✓ Chaves vitalícias<br/>
                  ✓ Você revende pelo preço que quiser<br/>
                  ✓ Painel para gerar/gerenciar HWID<br/>
                  ✓ Trials de 30min ilimitados
                </div>
              </div>

              <label>
                <span>Nome completo</span>
                <input 
                  type="text" 
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="João Silva"
                  required 
                />
              </label>

              <div className="split-fields">
                <label>
                  <span>CPF / CNPJ</span>
                  <input 
                    type="text" 
                    value={buyerCPF}
                    onChange={(e) => setBuyerCPF(e.target.value)}
                    placeholder="000.000.000-00"
                    required 
                  />
                </label>
                <label>
                  <span>Telefone</span>
                  <input 
                    type="tel" 
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required 
                  />
                </label>
              </div>

              <label>
                <span>Email (opcional)</span>
                <input 
                  type="email" 
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder={user?.email || 'seu@email.com'}
                />
              </label>

              <p style={{ padding: '12px', background: 'rgba(109,232,255,0.1)', borderRadius: '12px', fontSize: '13px', color: 'var(--muted)', margin: '16px 0' }}>
                💳 Pagamento via <strong>Pix</strong> - suas chaves caem automaticamente no seu painel assim que o pagamento for confirmado.
              </p>

              <Button type="submit" style={{ width: '100%', minHeight: '48px', fontSize: '16px' }}>
                Pagar R$ {calculatePrice(quantity).total.toFixed(2)}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pix */}
      {showPixModal && (
        <div className="modal-overlay" onClick={() => setShowPixModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Pagamento Pix</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              Escaneie o QR Code ou copie o código
            </p>

            <div style={{ textAlign: 'center' }}>
              {pixQRCode && (
                <img 
                  src={`data:image/png;base64,${pixQRCode}`}
                  alt="QR Code Pix"
                  style={{ maxWidth: '280px', margin: '0 auto 20px', display: 'block', borderRadius: '14px' }}
                />
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  value={pixCode}
                  readOnly
                  style={{ flex: 1, fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Button variant="outline" onClick={copyPixCode}>
                  Copiar
                </Button>
              </div>

              <p style={{ color: 'var(--cyan)', fontSize: '13px', marginBottom: '20px' }}>
                ⏳ Aguardando pagamento... A página atualizará automaticamente quando confirmado.
              </p>

              <Button variant="outline" onClick={() => setShowPixModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

    </ResellerLayout>
  )
}
