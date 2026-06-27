import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import { Button } from '../../components/ui/button'

interface Purchase {
  id: string
  user_id: string
  user_name: string
  user_email: string
  product_name: string
  product_slug: string
  amount: number
  days: number
  devices: number
  status: string
  payment_id: string | null
  paid_at: string | null
  created_at: string
  expires_at: string | null
  license_key: string | null
}

interface Stats {
  total: number
  paid: number
  pending: number
  expired: number
  refunded: number
  cancelled: number
  totalRevenue: number
}

export default function CustomerPurchases() {
  const { showToast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, paid: 0, pending: 0, expired: 0, refunded: 0, cancelled: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE_OPTIONS = [10, 15, 25, 50]

  useEffect(() => {
    loadPurchases()
  }, [page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter])

  async function loadPurchases() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.ADMIN_LIST_CUSTOMER_PURCHASES}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page,
          pageSize,
          searchTerm,
          statusFilter,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPurchases(result.purchases || [])
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
        if (result.stats) {
          setStats(result.stats)
        }
      } else {
        showToast(result.error || 'Erro ao carregar compras', 'error')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar compras', 'error')
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  function statusLabel(status: string) {
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

  function statusBadge(status: string) {
    const className =
      status === 'paid' || status === 'approved' ? 'active'
      : status === 'pending' ? 'trial'
      : status === 'expired' ? 'expired'
      : status === 'refunded' || status === 'cancelled' ? 'expired'
      : ''
    return <span className={`badge ${className}`}>{statusLabel(status)}</span>
  }

  const safePage = Math.min(page, Math.max(1, totalPages))

  return (
    <AdminLayout currentPage="/admin/customer-purchases">
      <AdminTopbar currentPage="/admin/customer-purchases" />

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Compras de Clientes Finais</p>
            <h1>Histórico de compras</h1>
            <p>Todas as compras realizadas por clientes finais via checkout da landing page.</p>
          </div>
        </section>

        <section className="stats-grid">
          <article className="metric-card"><span>Receita Total</span><strong>{formatPrice(stats.totalRevenue)}</strong><small>todas as vendas</small></article>
          <article className="metric-card"><span>Pagas</span><strong>{stats.paid}</strong><small>confirmadas</small></article>
          <article className="metric-card"><span>Pendentes</span><strong>{stats.pending}</strong><small>aguardando</small></article>
          <article className="metric-card"><span>Expiradas</span><strong>{stats.expired}</strong><small>vencidas</small></article>
          <article className="metric-card"><span>Reembolsadas</span><strong>{stats.refunded}</strong><small>estornadas</small></article>
          <article className="metric-card"><span>Canceladas</span><strong>{stats.cancelled}</strong><small>canceladas</small></article>
        </section>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Compras</h2>
              <p>{total} registro(s){total > 0 ? ` · Página ${safePage} de ${totalPages}` : ''}</p>
            </div>
            <div className="table-tools">
              <input
                type="search"
                placeholder="Buscar por produto, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos os status</option>
                <option value="paid">Pago</option>
                <option value="approved">Aprovado</option>
                <option value="pending">Pendente</option>
                <option value="expired">Expirado</option>
                <option value="refunded">Reembolsado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Produto</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Dias</th>
                  <th scope="col">Status</th>
                  <th scope="col">Licença</th>
                  <th scope="col">Pagamento</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}>Carregando...</td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan={8}>Nenhuma compra encontrada.</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Cliente">
                        <strong>{p.user_name || '—'}</strong>
                        <small>{p.user_email || '—'}</small>
                      </td>
                      <td data-label="Produto">{p.product_name}</td>
                      <td data-label="Valor"><strong>{formatPrice(p.amount)}</strong></td>
                      <td data-label="Dias">{p.days}</td>
                      <td data-label="Status">{statusBadge(p.status)}</td>
                      <td data-label="Licença">
                        {p.license_key ? (
                          <code style={{ fontSize: '11px' }}>{p.license_key.slice(0, 16)}...</code>
                        ) : '—'}
                      </td>
                      <td data-label="Pagamento">
                        {p.payment_id ? (
                          <code style={{ fontSize: '11px' }}>{p.payment_id.slice(0, 16)}...</code>
                        ) : '—'}
                      </td>
                      <td data-label="Data">{formatDate(p.paid_at || p.created_at)}</td>
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
      </div>
    </AdminLayout>
  )
}
