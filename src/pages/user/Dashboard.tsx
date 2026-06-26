import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useLicenseActions } from '../../hooks/useLicenseActions'
import { Button } from '../../components/ui/button'
import { Logo } from '../../components/ui/Logo'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { generateExtensionZip, downloadZip } from '../../utils/extensionBuilder'
import { getStoredTemplate } from '../../utils/templateStorage'
import { loadBrandingConfig } from '../../utils/brandingStorage'
import { Video, Download, Clock, Gem } from 'lucide-react'

interface License {
  license_key: string
  status: string
  license_type: string
  expires_at: string
  device_id?: string
  created_at: string
}

interface Purchase {
  id: string
  product_name: string
  amount: number
  status: string
  paid_at: string
  created_at: string
}

interface EndcustomerProduct {
  id: string
  name: string
  slug: string
  description: string
  days: number
  price_cents: number
  devices: number
  has_priority_support: boolean
}

export default function UserDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { copyLicenseKey } = useLicenseActions()
  const [licenses, setLicenses] = useState<License[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [endcustomerProducts, setEndcustomerProducts] = useState<EndcustomerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [generatingTrial, setGeneratingTrial] = useState(false)
  const [hasTrial, setHasTrial] = useState(false)
  const [videoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    action: null | 'delete'
    licenseKey: string
    isLoading: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    licenseKey: '',
    isLoading: false,
  })

  useEffect(() => {
    document.body.classList.add('session-ready')
    loadLicenses()
    loadPurchases()
    loadEndcustomerProducts()
    checkTrialStatus()
  }, [])

  async function checkTrialStatus() {
    try {
      const { data, error } = await supabase
        .from('user_trials')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) {
        // Tabela pode não existir ainda (migration não executada)
        // Trata como "sem trial" para não bloquear o usuário
        console.warn('user_trials pode não existir:', error.message)
        setHasTrial(false)
        return
      }

      setHasTrial(!!data)
    } catch {
      setHasTrial(false)
    }
  }

  async function loadLicenses() {
    try {
      const { data, error } = await supabase
        .from('ts_licenses')
        .select('license_key, status, license_type, expires_at, device_id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLicenses(data || [])
    } catch (error) {
      console.error('Erro ao carregar licenças:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPurchases() {
    try {
      const { data, error } = await supabase
        .from('customer_purchases')
        .select('id, product_name, amount, status, paid_at, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
    } finally {
      setLoadingPurchases(false)
    }
  }

  async function loadEndcustomerProducts() {
    try {
      const { data, error } = await supabase
        .from('products_endcustomer')
        .select('*')
        .eq('active', true)
        .order('sort_order')

      if (error) throw error
      setEndcustomerProducts(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function handleGenerateTrial() {
    setGeneratingTrial(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${SUPABASE_URL}${FUNCTIONS.USER_CREATE_TRIAL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      showToast(result.message || 'Teste criado com sucesso!', 'success')
      setHasTrial(true)
      await loadLicenses()
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao gerar teste',
        'error'
      )
    } finally {
      setGeneratingTrial(false)
    }
  }

  async function handleDeleteLicense(licenseKey: string) {
    setConfirmDialog({
      isOpen: true,
      title: 'Deletar Licença',
      message: 'Tem certeza que deseja deletar esta licença? Esta ação não pode ser desfeita.',
      action: 'delete',
      licenseKey: licenseKey,
      isLoading: false,
    })
  }

  async function handleConfirmDialog() {
    const { action, licenseKey } = confirmDialog
    setConfirmDialog(prev => ({ ...prev, isLoading: true }))

    try {
      if (action === 'delete') {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-license`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ license_key: licenseKey }),
        })
        
        const result = await response.json()
        if (!result.success) throw new Error(result.error)
        
        showToast('Licença deletada com sucesso.', 'success')
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        await loadLicenses()
      }
    } catch (error) {
      showToast('Erro ao deletar licença.', 'error')
      setConfirmDialog(prev => ({ ...prev, isLoading: false }))
    }
  }

  function handleCloseDialog() {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      active: 'Ativa',
      trial: 'Trial',
      expired: 'Expirada',
      suspended: 'Suspensa',
    }
    return map[status] || status
  }

  function purchaseStatusLabel(status: string) {
    const map: Record<string, string> = {
      approved: 'Aprovado',
      paid: 'Pago',
      pending: 'Pendente',
      expired: 'Expirado',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado',
    }
    return map[status] || status
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Logo variant="user" href="/user" />
          <div className="session-box">
            <span>{user?.email || 'Usuário'}</span>
            <Button variant="ghost" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-section" style={{ paddingTop: '48px' }}>
        <div className="hero-panel" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="eyebrow">Painel do Usuário</p>
            <h1>Bem-vindo ao Ultra Chat</h1>
            <p style={{ fontSize: '16px' }}>
              Gerencie suas licenças, teste a extensão e escolha o plano ideal para você.
            </p>
          </div>
        </div>
      </section>

      {/* Vídeo + Download */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="work-grid">
          {/* Vídeo Tutorial */}
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Video size={20} /></span>
              <h2>Como instalar a extensão</h2>
            </div>
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '14px',
              }}
            >
              <iframe
                src={videoUrl}
                title="Tutorial Ultra Chat"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </article>

          {/* Download */}
          <article className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Download size={20} /></span>
              <h2>Download da Extensão</h2>
            </div>
            <p style={{ marginBottom: '24px' }}>
              Baixe a extensão Ultra Chat para começar a usar. Compatível com os principais navegadores.
            </p>
            <Button
              style={{ alignSelf: 'flex-start' }}
              isLoading={downloadLoading}
              onClick={async () => {
                setDownloadLoading(true)
                try {
                  const config = loadBrandingConfig()
                  if (!config) {
                    showToast('Nenhuma configuração de branding encontrada. O admin precisa gerar a extensão primeiro em Branding.', 'error')
                    return
                  }
                  const stored = await getStoredTemplate()
                  let templateBuffer: ArrayBuffer
                  if (stored) {
                    templateBuffer = stored
                  } else {
                    const resp = await fetch('/templates/lovable-ultra-chat-5.4-1R.zip')
                    if (!resp.ok) throw new Error('Falha ao baixar template')
                    templateBuffer = await resp.arrayBuffer()
                  }
                  const blob = await generateExtensionZip(templateBuffer, {
                    companyName: config.companyName,
                    whatsapp: config.whatsapp,
                    communityLink: config.communityLink,
                    primaryColor: config.primaryColor,
                    secondaryColor: config.secondaryColor,
                  })
                  await downloadZip(blob, config.companyName)
                } catch (err: unknown) {
                  showToast(err instanceof Error ? err.message : 'Erro ao gerar extensão', 'error')
                } finally {
                  setDownloadLoading(false)
                }
              }}
            >
              Baixar Ultra Chat (.zip)
            </Button>
          </article>
        </div>
      </section>

      {/* Trial + Planos */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="work-grid">
          {/* Gerar Trial */}
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Clock size={20} /></span>
              <h2>Teste Grátis</h2>
            </div>
            <p style={{ marginBottom: '20px' }}>
              Experimente a extensão gratuitamente por <strong>30 minutos</strong>.
              Cada usuário tem direito a apenas 1 teste.
            </p>
            {hasTrial ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(157, 255, 47, 0.06)',
                  border: '1px solid rgba(157, 255, 47, 0.2)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                ✓ Você já utilizou seu teste gratuito
              </div>
            ) : (
              <Button onClick={handleGenerateTrial} disabled={generatingTrial}>
                {generatingTrial ? 'Gerando...' : 'Gerar teste de 30 min'}
              </Button>
            )}
          </article>

          {/* Planos */}
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Gem size={20} /></span>
              <h2>Planos disponíveis</h2>
            </div>
            {loadingProducts ? (
              <p style={{ color: 'var(--muted)' }}>Carregando...</p>
            ) : endcustomerProducts.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Nenhum plano disponível no momento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {endcustomerProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      borderRadius: '14px',
                      background: idx === 1 ? 'rgba(157,255,47,0.03)' : 'rgba(255,255,255,0.03)',
                      border: idx === 1 ? '1px solid rgba(157,255,47,0.2)' : '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '16px' }}>{p.name}</strong>
                      <p style={{ fontSize: '13px', margin: '2px 0 0' }}>
                        {p.days} dias • {p.devices} dispositivo{p.devices > 1 ? 's' : ''}
                        {p.has_priority_support ? ' • Suporte prioritário' : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price_cents / 100)}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                        pagamento único
                      </span>
                    </div>
                    <Button size="tiny" onClick={() => navigate(`/checkout/${p.slug}`)}>
                      Comprar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      {/* Licenças */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '24px' }}>
          <p className="eyebrow">Minhas Licenças</p>
          <h2>Suas licenças</h2>
        </div>

        <div className="table-card reveal">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Chave</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Expira em</th>
                  <th scope="col">HWID</th>
                  <th scope="col">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando...</td>
                  </tr>
                ) : licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhuma licença encontrada</td>
                  </tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.license_key}>
                      <td data-label="Chave">
                        <span className="license-key">{license.license_key}</span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${license.status}`}>
                          {statusLabel(license.status)}
                        </span>
                      </td>
                      <td data-label="Tipo">{license.license_type === 'trial' ? 'Trial' : license.license_type === 'lifetime' ? 'Vitalícia' : 'Paga'}</td>
                      <td data-label="Expira em">{formatDate(license.expires_at)}</td>
                      <td data-label="HWID">{license.device_id ? 'vinculado' : 'livre'}</td>
                      <td data-label="Criada em">{formatDate(license.created_at)}</td>
                      <td data-label="Ações">
                        <div className="actions-row">
                          <Button 
                            size="tiny" 
                            onClick={() => copyLicenseKey(license.license_key)}
                          >
                            Copiar
                          </Button>
                          <Button 
                            size="tiny" 
                            variant="destructive" 
                            onClick={() => handleDeleteLicense(license.license_key)}
                          >
                            Deletar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Minhas Compras */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '24px' }}>
          <p className="eyebrow">Compras</p>
          <h2>Minhas compras</h2>
        </div>

        <div className="table-card reveal">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Produto</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Status</th>
                  <th scope="col">Pago em</th>
                  <th scope="col">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {loadingPurchases ? (
                  <tr>
                    <td colSpan={5}>Carregando...</td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Nenhuma compra encontrada</td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Produto"><strong>{p.product_name}</strong></td>
                      <td data-label="Valor">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount / 100)}
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${p.status === 'paid' || p.status === 'approved' ? 'active' : p.status === 'pending' ? 'trial' : 'expired'}`}>
                          {purchaseStatusLabel(p.status)}
                        </span>
                      </td>
                      <td data-label="Pago em">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td data-label="Criada em">{new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <Logo variant="user" href="/user" />
          <p>© 2026 Ultra Chat. Todos os direitos reservados.</p>
        </div>
      </footer>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmDialog}
        onCancel={handleCloseDialog}
      />
    </div>
  )
}
