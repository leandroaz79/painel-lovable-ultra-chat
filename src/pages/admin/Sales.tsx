import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { Button } from '../../components/ui/button'
import { Download, Check, RotateCcw, Trash2 } from 'lucide-react'

interface Purchase {
  id: string
  reseller_id: string
  reseller_email: string
  payment_id: string
  quantity: number
  amount: number
  status: string
  buyer_name: string
  buyer_cpf: string
  buyer_phone: string
  buyer_email: string
  created_at: string
  approved_at?: string
}

export default function Sales() {
  const { showToast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('30') // dias

  useEffect(() => {
    loadPurchases()
  }, [periodFilter])

  async function loadPurchases() {
    try {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - Number(periodFilter))

      const { data: purchasesData, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Buscar emails dos revendedores via View
      const resellerIds = [...new Set(purchasesData?.map(p => p.reseller_id) || [])]
      const { data: resellersData } = await supabase
        .from('resellers_with_email')
        .select('user_id, email')
        .in('user_id', resellerIds)
      
      const emailMap = new Map(resellersData?.map(r => [r.user_id, r.email]) || [])
      
      const combined = purchasesData?.map(p => ({
        ...p,
        reseller_email: emailMap.get(p.reseller_id) || 'N/A'
      })) || []

      setPurchases(combined as Purchase[])
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = ['Data', 'Hora', 'Revendedor', 'Comprador', 'CPF', 'Telefone', 'Email', 'Quantidade', 'Valor', 'Status', 'Payment ID']
    const rows = filteredPurchases.map(p => [
      new Date(p.created_at).toLocaleDateString('pt-BR'),
      new Date(p.created_at).toLocaleTimeString('pt-BR'),
      p.reseller_email,
      p.buyer_name,
      p.buyer_cpf,
      p.buyer_phone,
      p.buyer_email,
      p.quantity,
      p.amount.toFixed(2),
      p.status,
      p.payment_id
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(c => '"' + c + '"').join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'vendas_' + new Date().toISOString().split('T')[0] + '.csv'
    link.click()
    showToast('CSV exportado com sucesso')
  }

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    action: 'approve' | 'refund' | 'delete' | null
    purchase: Purchase | null
    isLoading: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    purchase: null,
    isLoading: false,
  })

  async function handleConfirmDialog() {
    const { action, purchase } = confirmDialog
    if (!purchase || !action) return
    setConfirmDialog(prev => ({ ...prev, isLoading: true }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.ADMIN_MANAGE_CREDIT_PURCHASE}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchase_id: purchase.id, action }),
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

  const filteredPurchases = purchases.filter(p => {
    const statusMatch = statusFilter === 'all' || p.status === statusFilter
    const searchMatch = !searchTerm || 
      p.reseller_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payment_id.includes(searchTerm)
    return statusMatch && searchMatch
  })

  const stats = {
    total: filteredPurchases.length,
    approved: filteredPurchases.filter(p => p.status === 'approved').length,
    pending: filteredPurchases.filter(p => p.status === 'pending').length,
    revenue: filteredPurchases.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0),
  }

  return (
    <AdminLayout currentPage="/admin/sales">
      <AdminTopbar currentPage="/admin/sales" />

      <div className="app-shell">
      <section className="hero-panel reveal">
        <div>
          <p className="eyebrow">Vendas & Compras</p>
          <h1>Histórico de compras de créditos</h1>
          <p>Monitore todas as transações de compra de créditos pelos revendedores.</p>
        </div>
      </section>

      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <article className="metric-card"><span>Total</span><strong>{stats.total}</strong><small>compras</small></article>
        <article className="metric-card"><span>Aprovadas</span><strong>{stats.approved}</strong><small>pagas</small></article>
        <article className="metric-card"><span>Pendentes</span><strong>{stats.pending}</strong><small>aguardando</small></article>
        <article className="metric-card"><span>Faturamento</span><strong>R$ {stats.revenue.toFixed(2)}</strong><small>período</small></article>
      </section>

      <section className="table-card reveal">
        <div className="table-head">
          <div>
            <h2>Compras</h2>
            <p>{filteredPurchases.length} transações</p>
          </div>
          <div className="table-tools">
            <input 
              type="search" 
              placeholder="Buscar revendedor, comprador, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos Status</option>
              <option value="approved">Aprovado</option>
              <option value="pending">Pendente</option>
              <option value="rejected">Rejeitado</option>
              <option value="refunded">Estornado</option>
            </select>
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
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
                  <th scope="col">Data</th>
                  <th scope="col">Revendedor</th>
                  <th scope="col">Comprador</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Qtd</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}>Carregando...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan={9}>Nenhuma compra encontrada</td></tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td data-label="Data">
                      <strong>{new Date(purchase.created_at).toLocaleDateString('pt-BR')}</strong>
                      <small>{new Date(purchase.created_at).toLocaleTimeString('pt-BR')}</small>
                    </td>
                    <td data-label="Revendedor">{purchase.reseller_email}</td>
                    <td data-label="Comprador">
                      <strong>{purchase.buyer_name}</strong>
                      <small>{purchase.buyer_email}</small>
                    </td>
                    <td data-label="CPF">{purchase.buyer_cpf || '—'}</td>
                    <td data-label="Telefone">{purchase.buyer_phone || '—'}</td>
                    <td data-label="Qtd">{purchase.quantity}</td>
                    <td data-label="Valor">R$ {purchase.amount.toFixed(2)}</td>
                    <td data-label="Status">
                      <span className={`badge ${purchase.status}`}>
                        {purchase.status === 'approved' && 'Aprovado'}
                        {purchase.status === 'pending' && 'Pendente'}
                        {purchase.status === 'rejected' && 'Rejeitado'}
                        {purchase.status === 'refunded' && 'Estornado'}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <div className="actions-row">
                        {purchase.status === 'pending' && (
                          <Button
                            size="tiny"
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: 'Aprovar compra',
                              message: `Aprovar manualmente compra de ${purchase.quantity} créditos? Isto irá ADICIONAR os créditos ao revendedor.`,
                              action: 'approve',
                              purchase,
                              isLoading: false,
                            })}
                          >
                            <Check size={12} /> Aprovar
                          </Button>
                        )}
                        {purchase.status === 'approved' && (
                          <Button
                            size="tiny"
                            variant="destructive"
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: 'Estornar compra',
                              message: `Estornar compra de ${purchase.quantity} créditos? Isto irá REMOVER os créditos do revendedor.`,
                              action: 'refund',
                              purchase,
                              isLoading: false,
                            })}
                          >
                            <RotateCcw size={12} /> Estornar
                          </Button>
                        )}
                        <Button
                          size="tiny"
                          variant="destructive"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir compra',
                            message: 'Tem certeza que deseja excluir permanentemente esta compra? Esta ação não pode ser desfeita.',
                            action: 'delete',
                            purchase,
                            isLoading: false,
                          })}
                        >
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
      </section>

      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'delete' ? 'Excluir' : confirmDialog.action === 'refund' ? 'Estornar' : 'Aprovar'}
        cancelText="Cancelar"
        isDangerous={confirmDialog.action === 'delete' || confirmDialog.action === 'refund'}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmDialog}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </AdminLayout>
  )
}
