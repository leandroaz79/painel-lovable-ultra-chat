import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { Button } from '../../components/ui/button'

interface CustomerLicense {
  license_key: string
  status: string
  license_type: string
  expires_at: string | null
  created_at: string
}

interface Customer {
  id: string
  name: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  account_status: 'active' | 'blocked'
  has_used_trial: boolean
  trial_used_at: string | null
  license_count: number
  active_licenses: number
  trial_licenses: number
  expired_licenses: number
  suspended_licenses: number
  latest_license_at: string | null
  licenses: CustomerLicense[]
}

export default function Customers() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [trialFilter, setTrialFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    customer: Customer | null
    isLoading: boolean
  }>({ isOpen: false, customer: null, isLoading: false })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (!selectedCustomer) return
    setCustomerName(selectedCustomer.name || '')
    setCustomerEmail(selectedCustomer.email || '')
  }, [selectedCustomer])

  async function fetchAdminFunction(path: string, payload?: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload ?? {}),
    })

    const result = await response.json()
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erro ao executar ação administrativa')
    }

    return result
  }

  async function loadCustomers() {
    try {
      const result = await fetchAdminFunction(FUNCTIONS.ADMIN_LIST_CUSTOMERS)
      setCustomers(result.customers || [])
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao carregar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openManageModal(customer: Customer) {
    setSelectedCustomer(customer)
    setShowManageModal(true)
  }

  function closeManageModal() {
    setShowManageModal(false)
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerEmail('')
    setSavingProfile(false)
  }

  async function handleSaveCustomerProfile() {
    if (!selectedCustomer || !customerName.trim() || !customerEmail.trim()) return

    setSavingProfile(true)
    try {
      await fetchAdminFunction(FUNCTIONS.ADMIN_MANAGE_CUSTOMER, {
        user_id: selectedCustomer.id,
        action: 'update_profile',
        name: customerName.trim(),
        email: customerEmail.trim(),
      })

      showToast('Cadastro do cliente atualizado com sucesso.', 'success')
      setSelectedCustomer(prev => prev ? {
        ...prev,
        name: customerName.trim(),
        email: customerEmail.trim(),
      } : prev)
      await loadCustomers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao atualizar cliente', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  function handleAskDeleteCustomer(customer: Customer) {
    setConfirmDialog({ isOpen: true, customer, isLoading: false })
  }

  async function handleConfirmDeleteCustomer() {
    if (!confirmDialog.customer) return

    setConfirmDialog(prev => ({ ...prev, isLoading: true }))
    try {
      await fetchAdminFunction(FUNCTIONS.ADMIN_MANAGE_CUSTOMER, {
        user_id: confirmDialog.customer.id,
        action: 'delete',
      })

      showToast('Cliente excluído com sucesso.', 'success')
      if (selectedCustomer?.id === confirmDialog.customer.id) {
        closeManageModal()
      }
      setConfirmDialog({ isOpen: false, customer: null, isLoading: false })
      await loadCustomers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao excluir cliente', 'error')
      setConfirmDialog(prev => ({ ...prev, isLoading: false }))
    }
  }

  function handleCloseDeleteDialog() {
    setConfirmDialog({ isOpen: false, customer: null, isLoading: false })
  }

  function formatDate(value: string | null) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  function labelStatus(status: string) {
    const labels: Record<string, string> = {
      active: 'Ativa',
      expired: 'Expirada',
      suspended: 'Suspensa',
      trial: 'Trial',
      blocked: 'Bloqueada',
    }
    return labels[status] || status
  }

  const filteredCustomers = customers.filter((customer) => {
    const text = `${customer.name || ''} ${customer.email || ''}`.toLowerCase()
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase())
    const matchesTrial = trialFilter === 'all'
      || (trialFilter === 'used' && customer.has_used_trial)
      || (trialFilter === 'unused' && !customer.has_used_trial)
    const matchesAccount = accountFilter === 'all' || customer.account_status === accountFilter
    return matchesSearch && matchesTrial && matchesAccount
  })

  const stats = {
    total: customers.length,
    withLicenses: customers.filter(customer => customer.license_count > 0).length,
    usedTrial: customers.filter(customer => customer.has_used_trial).length,
    blocked: customers.filter(customer => customer.account_status === 'blocked').length,
  }

  return (
    <AdminLayout currentPage="/admin/customers">
      <header className="topbar">
        <MobileMenu currentPage="/admin/customers" />
        <a className="brand" href="/admin" aria-label="Ultra Admin">
          <span className="brand-bolt">⚡</span>
          <strong>Ultra<span>Admin</span></strong>
        </a>
        <nav className="nav-links" aria-label="Navegação principal">
          <a href="/admin">Painel</a>
          <a href="/admin#licenses">Licenças</a>
          <a href="/admin/customers">Clientes</a>
          <a href="/admin/resellers">Revendedores</a>
          <a href="/admin/sales">Vendas</a>
          <a href="/admin/products">Produtos</a>
        </nav>
        <div className="session-box">
          <span>{user?.email || 'Carregando...'}</span>
          <Button variant="ghost" onClick={() => signOut()}>Sair</Button>
        </div>
      </header>

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Gestão de Clientes</p>
            <h1>Gerenciar contas dos clientes finais</h1>
            <p>Visualize cadastros, acompanhe uso de trial e consulte as licenças vinculadas a cada cliente.</p>
          </div>
        </section>

        <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <article className="metric-card"><span>Total</span><strong>{stats.total}</strong><small>clientes cadastrados</small></article>
          <article className="metric-card"><span>Com licenças</span><strong>{stats.withLicenses}</strong><small>já possuem chaves</small></article>
          <article className="metric-card"><span>Trial usado</span><strong>{stats.usedTrial}</strong><small>teste gratuito consumido</small></article>
          <article className="metric-card"><span>Bloqueados</span><strong>{stats.blocked}</strong><small>acesso restrito</small></article>
        </section>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Clientes</h2>
              <p>{filteredCustomers.length} de {customers.length}</p>
            </div>
            <div className="table-tools">
              <input
                type="search"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={trialFilter} onChange={(e) => setTrialFilter(e.target.value)}>
                <option value="all">Todos os trials</option>
                <option value="used">Com trial usado</option>
                <option value="unused">Sem trial usado</option>
              </select>
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                <option value="all">Todas as contas</option>
                <option value="active">Ativas</option>
                <option value="blocked">Bloqueadas</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Trial</th>
                  <th>Licenças</th>
                  <th>Status</th>
                  <th>Último acesso</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}>Carregando...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={7}>Nenhum cliente encontrado.</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td data-label="Cliente">
                        <strong>{customer.name || 'Sem nome'}</strong>
                        <small>{customer.email || '—'}</small>
                      </td>
                      <td data-label="Trial">{customer.has_used_trial ? `Usado em ${formatDate(customer.trial_used_at)}` : 'Disponível'}</td>
                      <td data-label="Licenças">
                        {customer.license_count}
                        <small>Ativas: {customer.active_licenses} · Trial: {customer.trial_licenses}</small>
                      </td>
                      <td data-label="Status"><span className={`badge ${customer.account_status}`}>{labelStatus(customer.account_status)}</span></td>
                      <td data-label="Último acesso">{formatDate(customer.last_sign_in_at)}</td>
                      <td data-label="Cadastro">{formatDate(customer.created_at)}</td>
                      <td data-label="Ações">
                        <div className="actions-row">
                          <Button size="tiny" onClick={() => openManageModal(customer)}>Gerenciar</Button>
                          <Button size="tiny" variant="destructive" onClick={() => handleAskDeleteCustomer(customer)}>Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showManageModal && selectedCustomer && (
          <div className="modal-overlay" onClick={closeManageModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeManageModal}>&times;</button>
              <h2>Gerenciar Cliente</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>{selectedCustomer.email}</p>

              <div style={{ background: 'rgba(109,232,255,0.08)', padding: '16px', borderRadius: '14px', marginBottom: '24px' }}>
                <div className="split-fields">
                  <div><span>Status da conta</span><strong style={{ display: 'block', marginTop: '4px' }}>{labelStatus(selectedCustomer.account_status)}</strong></div>
                  <div><span>Trial gratuito</span><strong style={{ display: 'block', marginTop: '4px' }}>{selectedCustomer.has_used_trial ? 'Já utilizado' : 'Ainda disponível'}</strong></div>
                </div>
                <div className="split-fields" style={{ marginTop: '12px' }}>
                  <div><span>Licenças totais</span><strong style={{ display: 'block', marginTop: '4px' }}>{selectedCustomer.license_count}</strong></div>
                  <div><span>Última licença</span><strong style={{ display: 'block', marginTop: '4px' }}>{formatDate(selectedCustomer.latest_license_at)}</strong></div>
                </div>
              </div>

              <div className="stack-form">
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Dados cadastrais</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Atualize nome e email da conta do cliente.</p>
                </div>

                <label>
                  <span>Nome completo</span>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
                </label>

                <label>
                  <span>Email</span>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@exemplo.com" />
                </label>

                <div className="split-fields">
                  <label>
                    <span>Cadastro</span>
                    <input type="text" value={formatDate(selectedCustomer.created_at)} readOnly />
                  </label>
                  <label>
                    <span>Último acesso</span>
                    <input type="text" value={formatDate(selectedCustomer.last_sign_in_at)} readOnly />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <Button type="button" onClick={handleSaveCustomerProfile} disabled={!customerName.trim() || !customerEmail.trim() || savingProfile}>
                    {savingProfile ? 'Salvando...' : 'Salvar cadastro'}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => handleAskDeleteCustomer(selectedCustomer)}>
                    Excluir cliente
                  </Button>
                </div>

                <div style={{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                  <h3 style={{ margin: '16px 0 6px', fontSize: '16px' }}>Licenças vinculadas</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Consulta rápida das licenças que pertencem a este cliente.</p>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Chave</th>
                        <th>Status</th>
                        <th>Tipo</th>
                        <th>Expira</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.licenses.length === 0 ? (
                        <tr><td colSpan={4}>Nenhuma licença vinculada.</td></tr>
                      ) : (
                        selectedCustomer.licenses.map((license) => (
                          <tr key={license.license_key}>
                            <td data-label="Chave"><span className="license-key">{license.license_key}</span></td>
                            <td data-label="Status"><span className={`badge ${license.status}`}>{labelStatus(license.status)}</span></td>
                            <td data-label="Tipo">{license.license_type === 'trial' ? 'Trial' : license.license_type}</td>
                            <td data-label="Expira">{formatDate(license.expires_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title="Excluir Cliente"
          message={confirmDialog.customer ? `Deseja excluir o cliente ${confirmDialog.customer.email}? Essa ação remove a conta e as licenças vinculadas.` : ''}
          confirmText="Excluir"
          cancelText="Cancelar"
          isDangerous={true}
          isLoading={confirmDialog.isLoading}
          onConfirm={handleConfirmDeleteCustomer}
          onCancel={handleCloseDeleteDialog}
        />
      </div>
    </AdminLayout>
  )
}
