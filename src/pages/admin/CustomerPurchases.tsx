import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { Button } from '../../components/ui/button'
import { Download, Undo2, XCircle, Trash2 } from 'lucide-react'

interface Purchase {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_cpf: string
  user_whatsapp: string
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

  function exportToCSV() {
    const headers = ['Data', 'Hora', 'Cliente', 'Email', 'CPF', 'WhatsApp', 'Produto', 'Valor', 'Status', 'Licença', 'Payment ID']
    const rows = purchases.map(p => [
      new Date(p.paid_at || p.created_at).toLocaleDateString('pt-BR'),
      new Date(p.paid_at || p.created_at).toLocaleTimeString('pt-BR'),
      p.user_name,
      p.user_email,
      p.user_cpf,
      p.user_whatsapp,
      p.product_name,
      formatPrice(p.amount),
      statusLabel(p.status),
      p.license_key || '',
      p.payment_id || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(c => '"' + c + '"').join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'compras_' + new Date().toISOString().split('T')[0] + '.csv'
    link.click()
    showToast('CSV exportado com sucesso')
  }

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    action: 'refund' | 'cancel' | 'delete' | null
    purchaseId: string
    isLoading: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    purchaseId: '',
    isLoading: false,
  })

  async function handleAction(purchaseId: string, action: 'refund' | 'cancel' | 'delete') {
    setConfirmDialog(prev => ({ ...prev, isLoading: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.ADMIN_MANAGE_CUSTOMER_PURCHASE}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchase_id: purchaseId, action }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      showToast(result.message)
      setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      await loadPurchases()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao executar ação', 'error')
      setConfirmDialog(prev => ({ ...prev, isLoading: false }))
    }
  }

  function openConfirmDialog(purchaseId: string, action: 'refund' | 'cancel' | 'delete') {
    const config = {
      refund: { title: 'Reembolsar compra', message: 'Tem certeza que deseja reembolsar esta compra? O cliente será notificado.' },
      cancel: { title: 'Cancelar compra', message: 'Tem certeza que deseja cancelar esta compra pendente?' },
      delete: { title: 'Excluir compra', message: 'Tem certeza que deseja excluir永久mente esta compra? Esta ação não pode ser desfeita.' },
    }
    const { title, message } = config[action]
    setConfirmDialog({ isOpen: true, title, message, action, purchaseId, isLoading: false })
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
              <button
                className="primary-action compact"
                onClick={exportToCSV}
                type="button"
              >
                <Download size={14} /> Exportar Excel
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">CPF</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col">Produto</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Status</th>
                  <th scope="col">Licença</th>
                  <th scope="col">Data</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9}>Carregando...</td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan={9}>Nenhuma compra encontrada.</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Cliente">
                        <strong>{p.user_name || '—'}</strong>
                        <small>{p.user_email || '—'}</small>
                      </td>
                      <td data-label="CPF">{p.user_cpf || '—'}</td>
                      <td data-label="WhatsApp">{p.user_whatsapp || '—'}</td>
                      <td data-label="Produto">{p.product_name}</td>
                      <td data-label="Valor"><strong>{formatPrice(p.amount)}</strong></td>
                      <td data-label="Status">{statusBadge(p.status)}</td>
                      <td data-label="Licença">
                        {p.license_key ? (
                          <code style={{ fontSize: '11px' }}>{p.license_key.slice(0, 16)}...</code>
                        ) : '—'}
                      </td>
                      <td data-label="Data">{formatDate(p.paid_at || p.created_at)}</td>
                      <td data-label="Ações">
                        <div className="actions-row">
                          {(p.status === 'approved' || p.status === 'paid') && (
                            <Button size="tiny" variant="destructive" onClick={() => openConfirmDialog(p.id, 'refund')}>
                              <Undo2 size={12} /> Reembolsar
                            </Button>
                          )}
                          {p.status === 'pending' && (
                            <Button size="tiny" variant="destructive" onClick={() => openConfirmDialog(p.id, 'cancel')}>
                              <XCircle size={12} /> Cancelar
                            </Button>
                          )}
                          <Button size="tiny" variant="destructive" onClick={() => openConfirmDialog(p.id, 'delete')}>
                            <Trash2 size={12} /> Excluir
                          </Button>
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
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'delete' ? 'Excluir' : confirmDialog.action === 'refund' ? 'Reembolsar' : 'Cancelar'}
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={confirmDialog.isLoading}
        onConfirm={() => confirmDialog.purchaseId && confirmDialog.action && handleAction(confirmDialog.purchaseId, confirmDialog.action)}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </AdminLayout>
  )
}
