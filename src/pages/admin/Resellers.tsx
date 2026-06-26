import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { Button } from '../../components/ui/button'
import { formatWhatsApp, cleanDigits } from '../../utils/format'

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
  const [resellerName, setResellerName] = useState('')
  const [resellerEmail, setResellerEmail] = useState('')
  const [resellerWhatsapp, setResellerWhatsapp] = useState('')
  const [resellerStatus, setResellerStatus] = useState<'active' | 'pending' | 'suspended'>('active')
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    reseller: Reseller | null
    isLoading: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    reseller: null,
    isLoading: false,
  })
  
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

  useEffect(() => {
    if (!selectedReseller) return
    setResellerName(selectedReseller.name || '')
    setResellerEmail(selectedReseller.email || '')
    setResellerWhatsapp(selectedReseller.whatsapp ? formatWhatsApp(selectedReseller.whatsapp) : '')
    setResellerStatus(selectedReseller.status)
  }, [selectedReseller])

  async function callAdminManageReseller(payload: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.ADMIN_MANAGE_RESELLER}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erro ao executar ação no revendedor')
    }

    return result
  }

  function openManageModal(reseller: Reseller) {
    setSelectedReseller(reseller)
    setCreditsAmount(0)
    setCreditsReason('')
    setShowManageModal(true)
  }

  function closeManageModal() {
    setShowManageModal(false)
    setSelectedReseller(null)
    setCreditsAmount(0)
    setCreditsReason('')
    setResellerName('')
    setResellerEmail('')
    setResellerWhatsapp('')
    setResellerStatus('active')
    setSavingProfile(false)
  }

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
      closeManageModal()
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
          whatsapp: cleanDigits(newResellerWhatsapp),
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

  async function handleSaveResellerProfile() {
    if (!selectedReseller || !resellerName.trim() || !resellerEmail.trim()) return

    setSavingProfile(true)
    try {
      await callAdminManageReseller({
        user_id: selectedReseller.id,
        action: 'update_profile',
        name: resellerName.trim(),
        email: resellerEmail.trim(),
        whatsapp: cleanDigits(resellerWhatsapp),
        status: resellerStatus,
      })

      showToast('Cadastro do revendedor atualizado com sucesso.', 'success')
      const cleanedWhatsapp = cleanDigits(resellerWhatsapp)
      setSelectedReseller(prev => prev ? ({
        ...prev,
        name: resellerName.trim(),
        email: resellerEmail.trim(),
        whatsapp: cleanedWhatsapp,
        status: resellerStatus,
      }) : prev)
      await loadResellers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao atualizar cadastro do revendedor', 'error')
    } finally {
      setSavingProfile(false)
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

  function handleAskDeleteReseller(reseller: Reseller) {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Revendedor',
      message: `Deseja excluir o revendedor ${reseller.email}? Essa ação remove o cadastro de revenda e o acesso como revendedor.`,
      reseller,
      isLoading: false,
    })
  }

  async function handleConfirmDeleteReseller() {
    if (!confirmDialog.reseller) return

    setConfirmDialog(prev => ({ ...prev, isLoading: true }))

    try {
      await callAdminManageReseller({
        user_id: confirmDialog.reseller.id,
        action: 'delete',
      })

      showToast('Revendedor excluído com sucesso.', 'success')
      if (selectedReseller?.id === confirmDialog.reseller.id) {
        closeManageModal()
      }
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        reseller: null,
        isLoading: false,
      })
      await loadResellers()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao excluir revendedor', 'error')
      setConfirmDialog(prev => ({ ...prev, isLoading: false }))
    }
  }

  function handleCloseDeleteDialog() {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      reseller: null,
      isLoading: false,
    })
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
      <AdminTopbar currentPage="/admin/resellers" />

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
                <th scope="col">Nome</th>
                <th scope="col">Email</th>
                <th scope="col">WhatsApp</th>
                <th scope="col">Créditos</th>
                <th scope="col">Licenças Criadas</th>
                <th scope="col">Total Comprado</th>
                <th scope="col">Status</th>
                <th scope="col">Cadastro</th>
                <th scope="col">Ações</th>
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
                    <td data-label="WhatsApp">{reseller.whatsapp ? formatWhatsApp(reseller.whatsapp) : '—'}</td>
                    <td data-label="Créditos">{reseller.credits}</td>
                    <td data-label="Licenças Criadas">{reseller.total_licenses_created}</td>
                    <td data-label="Total Comprado">{reseller.total_credits_purchased}</td>
                    <td data-label="Status"><span className={`badge ${reseller.status}`}>{reseller.status === 'active' ? 'Ativo' : reseller.status === 'pending' ? 'Pendente' : 'Suspenso'}</span></td>
                    <td data-label="Cadastro">{new Date(reseller.created_at).toLocaleDateString('pt-BR')}</td>
                    <td data-label="Ações">
                      <div className="actions-row">
                        <Button
                          size="tiny"
                          onClick={() => openManageModal(reseller)}
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
                        <Button
                          size="tiny"
                          variant="destructive"
                          onClick={() => handleAskDeleteReseller(reseller)}
                        >
                          Excluir
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
        <div className="modal-overlay" onClick={closeManageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeManageModal}>&times;</button>
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

            <div className="stack-form">
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Dados cadastrais</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                  Visualize e atualize as informações do revendedor.
                </p>
              </div>

              <label>
                <span>Nome completo</span>
                <input
                  type="text"
                  value={resellerName}
                  onChange={(e) => setResellerName(e.target.value)}
                  placeholder="Nome do revendedor"
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={resellerEmail}
                  onChange={(e) => setResellerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </label>

              <div className="split-fields">
                <label>
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    value={resellerWhatsapp}
                    onChange={(e) => setResellerWhatsapp(formatWhatsApp(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={resellerStatus}
                    onChange={(e) => setResellerStatus(e.target.value as 'active' | 'pending' | 'suspended')}
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                </label>
              </div>

              <div className="split-fields">
                <label>
                  <span>Cadastro</span>
                  <input
                    type="text"
                    value={new Date(selectedReseller.created_at).toLocaleDateString('pt-BR')}
                    readOnly
                  />
                </label>
                <label>
                  <span>Ativação paga em</span>
                  <input
                    type="text"
                    value={selectedReseller.activation_paid_at ? new Date(selectedReseller.activation_paid_at).toLocaleDateString('pt-BR') : '—'}
                    readOnly
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <Button
                  type="button"
                  onClick={handleSaveResellerProfile}
                  disabled={!resellerName.trim() || !resellerEmail.trim() || savingProfile}
                >
                  {savingProfile ? 'Salvando...' : 'Salvar cadastro'}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleAskDeleteReseller(selectedReseller)}
                >
                  Excluir revendedor
                </Button>
              </div>

              <div style={{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                <h3 style={{ margin: '16px 0 6px', fontSize: '16px' }}>Gerenciar créditos</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                  Adicione ou remova créditos manualmente com justificativa.
                </p>
              </div>

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
                  type="button"
                  onClick={() => handleManageCredits('add')}
                  disabled={!creditsAmount || !creditsReason}
                >
                  ➕ Adicionar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleManageCredits('remove')}
                  disabled={!creditsAmount || !creditsReason}
                >
                  ➖ Remover
                </Button>
              </div>
            </div>
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
                    onChange={(e) => setNewResellerWhatsapp(formatWhatsApp(e.target.value))}
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
                  type="button"
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

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Excluir"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmDeleteReseller}
        onCancel={handleCloseDeleteDialog}
      />

    </div>
    </AdminLayout>
  )
}
