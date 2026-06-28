import { useEffect, useState } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { Button } from '../../components/ui/button'
import { formatWhatsApp, cleanDigits } from '../../utils/format'

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
  whatsapp?: string
  cpf?: string
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
  const [customerWhatsapp, setCustomerWhatsapp] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    customer: Customer | null
    isLoading: boolean
  }>({ isOpen: false, customer: null, isLoading: false })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]

  useEffect(() => {
    loadCustomers()
  }, [page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, trialFilter, accountFilter])

  useEffect(() => {
    if (!selectedCustomer) return
    setCustomerName(selectedCustomer.name || '')
    setCustomerEmail(selectedCustomer.email || '')
    setCustomerWhatsapp(selectedCustomer.whatsapp ? formatWhatsApp(selectedCustomer.whatsapp) : '')
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
      const result = await fetchAdminFunction(FUNCTIONS.ADMIN_LIST_CUSTOMERS, { page, pageSize })
      setCustomers(result.customers || [])
      setTotal(result.total ?? 0)
      setTotalPages(result.totalPages ?? 1)
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
    setCustomerWhatsapp('')
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
        whatsapp: cleanDigits(customerWhatsapp),
      })

      showToast('Cadastro do cliente atualizado com sucesso.', 'success')

      const cleanedWhatsapp = cleanDigits(customerWhatsapp)
      const updatedId = selectedCustomer.id
      setSelectedCustomer(prev => prev ? {
        ...prev,
        name: customerName.trim(),
        email: customerEmail.trim(),
        whatsapp: cleanedWhatsapp,
      } : prev)
      await loadCustomers()
      setCustomers(prev => prev.map(c =>
        c.id === updatedId ? { ...c, whatsapp: cleanedWhatsapp } : c
      ))
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao atualizar cliente', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleResetPassword() {
    if (!selectedCustomer || !resetPasswordValue) return
    if (resetPasswordValue.length < 6) {
      showToast('Senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    setResettingPassword(true)
    try {
      await fetchAdminFunction(FUNCTIONS.ADMIN_MANAGE_CUSTOMER, {
        user_id: selectedCustomer.id,
        action: 'reset_password',
        password: resetPasswordValue,
      })
      showToast('Senha do cliente redefinida com sucesso!', 'success')
      setResetPasswordValue('')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao redefinir senha', 'error')
    } finally {
      setResettingPassword(false)
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

  function formatCPF(value: string | undefined) {
    if (!value) return '—'
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
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

  const safePage = Math.min(page, Math.max(1, totalPages))

  return (
    <AdminLayout currentPage="/admin/customers">
      <AdminTopbar currentPage="/admin/customers" />

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Gestão de Clientes</p>
            <h1>Gerenciar contas dos clientes finais</h1>
            <p>Visualize cadastros, acompanhe uso de trial e consulte as licenças vinculadas a cada cliente.</p>
          </div>
        </section>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Clientes</h2>
              <p>{total} total · {filteredCustomers.length} nesta página {totalPages > 1 ? `· Página ${safePage} de ${totalPages}` : ''}</p>
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
                  <th scope="col">Cliente</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col">Trial</th>
                  <th scope="col">Licenças</th>
                  <th scope="col">Status</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Cadastro</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}>Carregando...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={8}>Nenhum cliente encontrado.</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td data-label="Cliente">
                        <strong>{customer.name || 'Sem nome'}</strong>
                        <small>{customer.email || '—'}</small>
                      </td>
                      <td data-label="WhatsApp">{customer.whatsapp ? formatWhatsApp(customer.whatsapp) : '—'}</td>
                      <td data-label="Trial">{customer.has_used_trial ? `Usado em ${formatDate(customer.trial_used_at)}` : 'Disponível'}</td>
                      <td data-label="Licenças">
                        {customer.license_count}
                        <small>Ativas: {customer.active_licenses} · Trial: {customer.trial_licenses}</small>
                      </td>
                      <td data-label="Status"><span className={`badge ${customer.account_status}`}>{labelStatus(customer.account_status)}</span></td>
                      <td data-label="CPF">{formatCPF(customer.cpf)}</td>
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
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                ← Anterior
              </Button>
              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                {safePage} / {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
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
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Atualize nome, email e WhatsApp da conta do cliente.</p>
                </div>

                <label>
                  <span>Nome completo</span>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
                </label>

                <label>
                  <span>Email</span>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@exemplo.com" />
                </label>

                <label>
                  <span>WhatsApp</span>
                  <input type="text" value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(formatWhatsApp(e.target.value))} placeholder="(11) 9 9999-9999" />
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

                <div style={{ padding: '16px', background: 'rgba(109,232,255,0.08)', borderRadius: '14px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Redefinir senha</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Defina uma nova senha para o cliente.</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <label style={{ flex: 1, margin: 0 }}>
                      <span>Nova senha</span>
                      <input
                        type="text"
                        value={resetPasswordValue}
                        onChange={(e) => setResetPasswordValue(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </label>
                    <Button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={!resetPasswordValue || resettingPassword}
                      style={{ whiteSpace: 'nowrap', minHeight: '40px' }}
                    >
                      {resettingPassword ? 'Redefinindo...' : 'Redefinir'}
                    </Button>
                  </div>
                </div>

                <div style={{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                  <h3 style={{ margin: '16px 0 6px', fontSize: '16px' }}>Licenças vinculadas</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Consulta rápida das licenças que pertencem a este cliente.</p>
                </div>

                <div className="table-wrap">
                  <table>
<thead>
                        <tr>
                          <th scope="col">Chave</th>
                          <th scope="col">Status</th>
                          <th scope="col">Tipo</th>
                          <th scope="col">Expira</th>
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
