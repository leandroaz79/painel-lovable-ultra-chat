import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { useLicenseActions } from '../../hooks/useLicenseActions'
import SalesChart from '../../components/SalesChart'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import { Button } from '../../components/ui/button'

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

interface Stats {
  total: number
  active: number
  trial: number
  lifetime: number
  expired: number
  suspended: number
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const { copyLicenseKey, renewLicense, resetHwid, revokeLicense, deleteLicense, submitMutation } = useLicenseActions()
  const [licenses, setLicenses] = useState<License[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, trial: 0, lifetime: 0, expired: 0, suspended: 0 })
  const [commercialStats, setCommercialStats] = useState({ totalRevenue: 0, totalResellers: 0, totalSales: 0, avgTicket: 0 })
  const [salesChartData, setSalesChartData] = useState<Array<{date: string, sales: number, revenue: number}>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedType, setSelectedType] = useState<'paid' | 'lifetime'>('paid')
  const [daysValue, setDaysValue] = useState(30)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const PAGE_SIZE_OPTIONS = [10, 15, 25, 50]

  useEffect(() => {
    loadLicenses()
    loadCommercialStats()
  }, [])

  useEffect(() => {
    document.body.classList.add('session-ready')
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  async function loadCommercialStats() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: purchases } = await supabase
        .from('credit_purchases')
        .select('quantity, amount, status, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const approved = purchases?.filter(p => p.status === 'approved') || []
      const totalRevenue = approved.reduce((sum, p) => sum + p.amount, 0)
      const totalSales = approved.length
      const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

      const { data: resellers } = await supabase
        .from('resellers')
        .select('id', { count: 'exact' })
        .eq('status', 'active')

      setCommercialStats({
        totalRevenue,
        totalResellers: resellers?.length || 0,
        totalSales,
        avgTicket
      })

      const chartData: Array<{date: string, sales: number, revenue: number}> = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const daySales = approved.filter(p => p.created_at.startsWith(dateStr))
        chartData.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          sales: daySales.length,
          revenue: daySales.reduce((sum, p) => sum + p.amount, 0)
        })
      }
      setSalesChartData(chartData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas comerciais:', error)
    }
  }

  async function loadLicenses() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.LIST_LICENSES}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 200 })
      })

      const result = await response.json()
      
      if (result.success) {
        setLicenses(result.licenses || [])
        if (result.stats) {
          setStats(result.stats)
        }
      } else {
        showToast(result.error || 'Erro ao carregar licenças', 'error')
      }
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao carregar licenças', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateLicense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
    
    const payload = {
      user_name: (form.querySelector('#client-name') as HTMLInputElement).value.trim(),
      email: (form.querySelector('#client-email') as HTMLInputElement).value.trim(),
      phone: (form.querySelector('#client-phone') as HTMLInputElement).value.trim(),
      license_type: selectedType,
      days: selectedType === 'lifetime' ? null : daysValue,
      lifetime: selectedType === 'lifetime'
    }

    await submitMutation(submitBtn, async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.CREATE_LICENSE}`, {
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
    await loadLicenses()
    loadCommercialStats()
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
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.CREATE_LICENSE}`, {
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
    ;(form.querySelector('#trial-minutes') as HTMLInputElement).value = '30'
    await loadLicenses()
    loadCommercialStats()
  }

  async function handleResetHwid(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
    const key = (form.querySelector('#reset-key') as HTMLInputElement).value.trim()

    await submitMutation(submitBtn, async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESET_HWID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ license_key: key })
      })
      
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result
    }, 'HWID resetado.')

    form.reset()
    await loadLicenses()
    loadCommercialStats()
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
      await deleteLicense(key, button, false)
    }

    await loadLicenses()
    loadCommercialStats()
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
    <AdminLayout currentPage="/admin">
      {/* Header Mobile + Desktop Simplificado */}
      <header className="topbar">
        <MobileMenu currentPage="/admin" />
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
          <span id="admin-email">{user?.email || 'Carregando...'}</span>
          <Button variant="ghost" onClick={() => signOut()}>Sair</Button>
        </div>
      </header>

      <main className="app-shell">
        <section id="dashboard" className="hero-panel reveal">
          <div>
            <p className="eyebrow">Dashboard administrativo</p>
            <h1>Gestão de licenças Ultra Chat.</h1>
            <p>Crie chaves, monitore uso, libere dispositivos e prepare operação para revendedores.</p>
          </div>
          <Button onClick={() => { loadLicenses(); loadCommercialStats(); }} size="sm">
            Atualizar dados
          </Button>
        </section>

        <section className="stats-grid" aria-label="Indicadores">
          <article className="metric-card"><span>Total</span><strong>{stats.total}</strong><small>licenças cadastradas</small></article>
          <article className="metric-card"><span>Ativas</span><strong>{stats.active}</strong><small>liberadas para uso</small></article>
          <article className="metric-card"><span>Trials</span><strong>{stats.trial}</strong><small>testes em andamento</small></article>
          <article className="metric-card"><span>Vitalícias</span><strong>{stats.lifetime}</strong><small>sem expiração</small></article>
          <article className="metric-card"><span>Expiradas</span><strong>{stats.expired}</strong><small>precisam renovação</small></article>
          <article className="metric-card"><span>Suspensas</span><strong>{stats.suspended}</strong><small>bloqueadas</small></article>
        </section>

        <section className="stats-grid" aria-label="Métricas Comerciais" style={{ marginTop: '24px' }}>
          <article className="metric-card"><span>Receita Total</span><strong>R$ {commercialStats.totalRevenue.toFixed(2)}</strong><small>últimos 30 dias</small></article>
          <article className="metric-card"><span>Revendedores</span><strong>{commercialStats.totalResellers}</strong><small>ativos</small></article>
          <article className="metric-card"><span>Vendas</span><strong>{commercialStats.totalSales}</strong><small>compras aprovadas</small></article>
          <article className="metric-card"><span>Ticket Médio</span><strong>R$ {commercialStats.avgTicket.toFixed(2)}</strong><small>por venda</small></article>
        </section>

        <section className="glass-card" style={{ marginTop: '24px', padding: '24px' }}>
          <div className="card-heading" style={{ marginBottom: '16px' }}>
            <span className="icon-pill">📊</span>
            <h2>Vendas - Últimos 7 dias</h2>
          </div>
          <SalesChart data={salesChartData} />
        </section>

        <section className="work-grid">
          <article className="glass-card">
            <div className="card-heading"><span className="icon-pill">🔑</span><h2>Gerar licença</h2></div>
            <form id="license-form" className="stack-form" onSubmit={handleCreateLicense}>
              <div className="split-fields">
                <label><span>Nome do cliente</span><input id="client-name" type="text" placeholder="Cliente" required /></label>
                <label><span>Telefone</span><input id="client-phone" type="tel" placeholder="84 000 0000" /></label>
              </div>
              <label><span>Email</span><input id="client-email" type="email" placeholder="cliente@email.com" /></label>
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
              <label id="days-field" style={{ display: selectedType === 'lifetime' ? 'none' : 'block' }}>
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

          <article className="glass-card">
            <div className="card-heading"><span className="icon-pill">⏱</span><h2>Gerar teste</h2></div>
            <form id="trial-form" className="stack-form" onSubmit={handleCreateTrial}>
              <label><span>Nome do cliente (opcional)</span><input id="trial-name" type="text" placeholder="Cliente teste" /></label>
              <label><span>Minutos (máx. 30)</span><input id="trial-minutes" type="number" min="1" max="30" defaultValue="30" /></label>
              <Button type="submit">
              Gerar trial
            </Button>
            </form>
          </article>

          <article className="glass-card wide-card">
            <div className="card-heading"><span className="icon-pill">🧬</span><h2>Resetar HWID de uma chave</h2></div>
            <form id="reset-form" className="inline-form" onSubmit={handleResetHwid}>
              <label><span>Cole a chave</span><input id="reset-key" type="text" placeholder="TS-XXXXXXXXXXXXXXXXXXXX" required /></label>
              <Button type="submit">
                Resetar HWID
              </Button>
            </form>
          </article>
        </section>

        <section id="licenses" className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Licenças</h2>
              <p id="license-count">{filteredLicenses.length} de {licenses.length} licença(s){filteredLicenses.length > 0 ? ` · Página ${safePage} de ${totalPages}` : ''}</p>
            </div>
            <div className="table-tools">
              <input 
                id="search-input" 
                type="search" 
                placeholder="Buscar cliente, email, chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="trial">Trial</option>
                <option value="expired">Expiradas</option>
                <option value="suspended">Suspensas</option>
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
              <tbody id="licenses-tbody" onClick={handleTableAction}>
                {loading ? (
                  <tr><td colSpan={7}>Carregando...</td></tr>
                ) : filteredLicenses.length === 0 ? (
                  <tr><td colSpan={7}>Nenhuma licença encontrada.</td></tr>
                ) : (
                  paginatedLicenses.map((license) => (
                    <tr key={license.license_key}>
                      <td>
                        <strong>{license.user_name || 'Sem nome'}</strong>
                        <small>{license.email || license.phone || '—'}</small>
                      </td>
                      <td><span className="license-key">{license.license_key}</span></td>
                      <td><span className={`badge ${license.status}`}>{labelStatus(license.status)}</span></td>
                      <td>{license.lifetime ? 'Vitalícia' : license.license_type || 'paid'}</td>
                      <td>{formatDate(license.expires_at)}</td>
                      <td>{license.device_id ? 'vinculado' : 'livre'}</td>
                      <td>
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

        <section id="resellers" className="reseller-preview reveal">
          <div className="glass-card">
            <div className="card-heading"><span className="icon-pill">🏪</span><h2>Revendedores</h2></div>
            <p>Gerencie revendedores, aprove solicitações e monitore vendas.</p>
            <div style={{ marginTop: '20px' }}>
              <a href="/admin/resellers" className="primary-action">
                Ver Revendedores
              </a>
            </div>
          </div>
        </section>
      </main>    </AdminLayout>
  )
}
