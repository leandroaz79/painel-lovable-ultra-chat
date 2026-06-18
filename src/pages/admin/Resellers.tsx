import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import { Button } from '../../components/ui/button'

interface Reseller {
  id: string
  name?: string
  whatsapp?: string
  email: string
  credits: number
  total_licenses_created: number
  total_credits_purchased: number
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  activation_paid_at?: string
}

export default function Resellers() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null)
  const [creditsAmount, setCreditsAmount] = useState(0)
  const [creditsReason, setCreditsReason] = useState('')
  
  // Estado para modal de criar revendedor
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newResellerName, setNewResellerName] = useState('')
  const [newResellerEmail, setNewResellerEmail] = useState('')
  const [newResellerWhatsapp, setNewResellerWhatsapp] = useState('')
  const [newResellerPassword, setNewResellerPassword] = useState('')
  const [newResellerCredits, setNewResellerCredits] = useState(0)
  const [newResellerStatus, setNewResellerStatus] = useState<'active' | 'pending' | 'suspended'>('active')
  const [creatingReseller, setCreatingReseller] = useState(false)

  useEffect(() => {
    loadResellers()
  }, [])

  async function loadResellers() {
    try {
      // Buscar revendedores com email via View
      const { data: resellersData, error } = await supabase
        .from('resellers_with_email')
        .select('*')

      if (error) {
        console.error('Erro ao buscar revendedores:', error)
        setLoading(false)
        return
      }

      if (!resellersData || resellersData.length === 0) {
        setResellers([])
        setLoading(false)
        return
      }

      const combined: Reseller[] = resellersData.map(r => ({
      id: r.user_id,
      name: r.name,
      whatsapp: r.whatsapp,
      email: r.email || 'N/A',
      credits: r.credits || 0,
      total_licenses_created: r.total_licenses_created || 0,
      total_credits_purchased: r.total_credits_purchased || 0,
      status: r.status,
      created_at: r.created_at,
      activation_paid_at: r.activation_paid_at
    }))

      setResellers(combined)
    } catch (error) {
      console.error('Erro ao carregar revendedores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleManageCredits(type: 'add' | 'remove') {
    if (!selectedReseller || !creditsAmount) return

    const amount = type === 'remove' ? -Math.abs(creditsAmount) : Math.abs(creditsAmount)

    try {
      // Buscar saldo atual
      const { data: resellerData } = await supabase
        .from('resellers')
        .select('credits')
        .eq('user_id', selectedReseller.id)
        .single()

      if (!resellerData) throw new Error('Revendedor não encontrado')

      // Atualizar créditos
      const { error } = await supabase
        .from('resellers')
        .update({
          credits: Math.max(0, resellerData.credits + amount)
        })
        .eq('user_id', selectedReseller.id)

      if (error) throw error

      // Log da ação
      await supabase.from('reseller_credits_log').insert({
        reseller_id: selectedReseller.id,
        amount: amount,
        reason: creditsReason,
        admin_id: user?.id
      })

      showToast(`${Math.abs(amount)} créditos ${type === 'add' ? 'adicionados' : 'removidos'}`)
      setShowManageModal(false)
      setCreditsAmount(0)
      setCreditsReason('')
      await loadResellers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao gerenciar créditos', 'error')
    }
  }

  async function handleCreateReseller(e: React.FormEvent) {
    e.preventDefault()
    if (!newResellerEmail || !newResellerName || !newResellerPassword) return

    setCreatingReseller(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.ADMIN_CREATE_RESELLER || '/functions/v1/admin-create-reseller'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newResellerName,
          email: newResellerEmail,
          whatsapp: newResellerWhatsapp,
          password: newResellerPassword,
          initial_credits: newResellerCredits,
          status: newResellerStatus
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar revendedor')
      }

      showToast(result.message || 'Revendedor criado com sucesso!', 'success')
      setShowCreateModal(false)
      setNewResellerName('')
      setNewResellerEmail('')
      setNewResellerWhatsapp('')
      setNewResellerPassword('')
      setNewResellerCredits(0)
      setNewResellerStatus('active')
      await loadResellers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao criar revendedor', 'error')
    } finally {
      setCreatingReseller(false)
    }
  }

  async function handleSuspend(reseller: Reseller) {
    const action = reseller.status === 'active' ? 'suspender' : 'reativar'
    if (!confirm(`Deseja ${action} o revendedor ${reseller.email}?`)) return

    try {
      await supabase
        .from('resellers')
        .update({
          status: reseller.status === 'active' ? 'suspended' : 'active'
        })
        .eq('user_id', reseller.id)

      showToast(`Revendedor ${action === 'suspender' ? 'suspenso' : 'reativado'}`)
      await loadResellers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : `Erro ao ${action}`, 'error')
    }
  }

  const filteredResellers = resellers.filter(r => {
    const statusMatch = statusFilter === 'all' || r.status === statusFilter
    const searchMatch = !searchTerm || r.email.toLowerCase().includes(searchTerm.toLowerCase())
    return statusMatch && searchMatch
  })

  const stats = {
    total: resellers.length,
    active: resellers.filter(r => r.status === 'active').length,
    suspended: resellers.filter(r => r.status === 'suspended').length,
    totalCredits: resellers.reduce((sum, r) => sum + r.credits, 0),
  }

  return (
    <AdminLayout currentPage="/admin/resellers">
      <header className="topbar">
        <MobileMenu currentPage="/admin/resellers" />
        <a className="brand" href="/admin" aria-label="Ultra Admin">
          <span className="brand-bolt">⚡</span>
          <strong>Ultra<span>Admin</span></strong>
        </a>
        <nav className="nav-links" aria-label="Navegação principal">
          <a href="/admin">Painel</a>
          <a href="/admin#licenses">Licenças</a>
          <a href="/admin/resellers">Revendedores</a>
          <a href="/admin/sales">Vendas</a>
          <a href="/admin/products">Produtos</a>
        </nav>
        <div className="session-box">
          <span>{user?.email || 'Carregando...'}</span>
          <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</Button>
        </div>
      </header>

      <div className="app-shell">
      <section className="hero-panel reveal">
        <div>
          <p className="eyebrow">Gestão de Revendedores</p>
          <h1>Gerenciar revendedores e créditos</h1>
          <p>Aprove solicitações, adicione créditos e monitore atividade dos revendedores.</p>
        </div>
      </section>

      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <article className="metric-card"><span>Total</span><strong>{stats.total}</strong><small>revendedores</small></article>
        <article className="metric-card"><span>Ativos</span><strong>{stats.active}</strong><small>operando</small></article>
        <article className="metric-card"><span>Suspensos</span><strong>{stats.suspended}</strong><small>bloqueados</small></article>
        <article className="metric-card"><span>Créditos</span><strong>{stats.totalCredits}</strong><small>em circulação</small></article>
      </section>

      <section className="table-card reveal">
        <div className="table-head">
          <div>
            <h2>Revendedores</h2>
            <p>{filteredResellers.length} de {resellers.length}</p>
          </div>
          <div className="table-tools">
            <input 
              type="search" 
              placeholder="Buscar por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="suspended">Suspensos</option>
            </select>
            <Button onClick={() => setShowCreateModal(true)}>
              Novo Revendedor
            </Button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Créditos</th>
                <th>Licenças Criadas</th>
                <th>Total Comprado</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}>Carregando...</td></tr>
              ) : filteredResellers.length === 0 ? (
                <tr><td colSpan={9}>Nenhum revendedor encontrado</td></tr>
              ) : (
                filteredResellers.map(reseller => (
                  <tr key={reseller.id}>
                    <td data-label="Nome"><strong>{reseller.name || '—'}</strong></td>
                    <td data-label="Email">{reseller.email}</td>
                    <td data-label="WhatsApp">{reseller.whatsapp || '—'}</td>
                    <td data-label="Créditos">{reseller.credits}</td>
                    <td data-label="Licenças Criadas">{reseller.total_licenses_created}</td>
                    <td data-label="Total Comprado">{reseller.total_credits_purchased}</td>
                    <td data-label="Status"><span className={`badge ${reseller.status}`}>{reseller.status === 'active' ? 'Ativo' : reseller.status === 'pending' ? 'Pendente' : 'Suspenso'}</span></td>
                    <td data-label="Cadastro">{new Date(reseller.created_at).toLocaleDateString('pt-BR')}</td>
                    <td data-label="Ações">
                      <div className="actions-row">
                        <Button
                          size="tiny"
                          onClick={() => { setSelectedReseller(reseller); setShowManageModal(true); }}
                        >
                          Gerenciar
                        </Button>
                        <Button
                          size="tiny"
                          variant={reseller.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => handleSuspend(reseller)}
                        >
                          {reseller.status === 'active' ? 'Suspender' : 'Reativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Gerenciar Revendedor */}
      {showManageModal && selectedReseller && (
        <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowManageModal(false)}>&times;</button>
            <h2>Gerenciar Revendedor</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              {selectedReseller.email}
            </p>

            <div style={{ background: 'rgba(109,232,255,0.08)', padding: '16px', borderRadius: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Créditos Atuais:</span>
                <strong style={{ color: 'var(--cyan)', fontSize: '24px' }}>{selectedReseller.credits}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted-2)' }}>
                Total criado: {selectedReseller.total_licenses_created} | Total comprado: {selectedReseller.total_credits_purchased}
              </div>
            </div>

            <form className="stack-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                <span>Quantidade de créditos</span>
                <input 
                  type="number" 
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(Number(e.target.value))}
                  min="1"
                  placeholder="Ex: 10"
                  required
                />
              </label>

              <label>
                <span>Motivo</span>
                <input 
                  type="text" 
                  value={creditsReason}
                  onChange={(e) => setCreditsReason(e.target.value)}
                  placeholder="Ex: Bônus de ativação"
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Button
                  onClick={() => handleManageCredits('add')}
                  disabled={!creditsAmount || !creditsReason}
                >
                  ➕ Adicionar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleManageCredits('remove')}
                  disabled={!creditsAmount || !creditsReason}
                >
                  ➖ Remover
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Revendedor */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            <h2>Criar Novo Revendedor</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              Cadastre um novo revendedor manualmente
            </p>

            <form className="stack-form" onSubmit={handleCreateReseller}>
              <label>
                <span>Nome Completo</span>
                <input 
                  type="text" 
                  value={newResellerName}
                  onChange={(e) => setNewResellerName(e.target.value)}
                  placeholder="Nome do revendedor"
                  required
                />
              </label>
              
              <label>
                <span>Email</span>
                <input 
                  type="email" 
                  value={newResellerEmail}
                  onChange={(e) => setNewResellerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </label>
              
              <div className="split-fields">
                <label>
                  <span>WhatsApp</span>
                  <input 
                    type="tel" 
                    value={newResellerWhatsapp}
                    onChange={(e) => setNewResellerWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </label>
                <label>
                  <span>Senha</span>
                  <input 
                    type="password" 
                    value={newResellerPassword}
                    onChange={(e) => setNewResellerPassword(e.target.value)}
                    placeholder="Senha para o revendedor"
                    required
                  />
                </label>
              </div>

              <div className="split-fields">
                <label>
                  <span>Créditos Iniciais</span>
                  <input 
                    type="number" 
                    value={newResellerCredits}
                    onChange={(e) => setNewResellerCredits(Number(e.target.value))}
                    min="0"
                    placeholder="0"
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select 
                    value={newResellerStatus}
                    onChange={(e) => setNewResellerStatus(e.target.value as any)}
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!newResellerEmail || !newResellerName || !newResellerPassword || creatingReseller}
                >
                  {creatingReseller ? 'Criando...' : 'Criar Revendedor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </AdminLayout>
  )
}
