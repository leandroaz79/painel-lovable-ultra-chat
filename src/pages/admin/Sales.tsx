import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import { Button } from '../../components/ui/button'

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
  const { user } = useAuth()
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

  async function handleApprove(purchase: Purchase) {
    if (!confirm(`Aprovar manualmente compra de ${purchase.quantity} créditos?\n\nISTO IRÁ ADICIONAR os créditos ao revendedor.`)) return

    try {
      // Buscar saldo atual
      const { data: resellerData } = await supabase
        .from('resellers')
        .select('credits, total_credits_purchased')
        .eq('user_id', purchase.reseller_id)
        .single()

      if (!resellerData) throw new Error('Revendedor não encontrado')

      // Adicionar créditos
      await supabase
        .from('resellers')
        .update({
          credits: resellerData.credits + purchase.quantity,
          total_credits_purchased: resellerData.total_credits_purchased + purchase.quantity
        })
        .eq('user_id', purchase.reseller_id)

      // Atualizar status da compra
      await supabase
        .from('credit_purchases')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', purchase.id)

      showToast(`${purchase.quantity} créditos adicionados com sucesso`)
      await loadPurchases()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao aprovar', 'error')
    }
  }

  async function handleRefund(purchase: Purchase) {
    if (!confirm(`Estornar compra de ${purchase.quantity} créditos?\n\nISTO IRÁ REMOVER os créditos do revendedor.`)) return

    try {
      // Buscar saldo atual
      const { data: resellerData } = await supabase
        .from('resellers')
        .select('credits, total_credits_purchased')
        .eq('user_id', purchase.reseller_id)
        .single()

      if (!resellerData) throw new Error('Revendedor não encontrado')

      // Remover créditos
      await supabase
        .from('resellers')
        .update({
          credits: Math.max(0, resellerData.credits - purchase.quantity),
          total_credits_purchased: Math.max(0, resellerData.total_credits_purchased - purchase.quantity)
        })
        .eq('user_id', purchase.reseller_id)

      // Atualizar status da compra
      await supabase
        .from('credit_purchases')
        .update({ status: 'refunded' })
        .eq('id', purchase.id)

      showToast('Compra estornada e créditos removidos')
      await loadPurchases()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao estornar', 'error')
    }
  }

  function exportToCSV() {
    const headers = ['Data', 'Hora', 'Revendedor', 'Comprador', 'CPF', 'Email', 'Quantidade', 'Valor', 'Status', 'Payment ID']
    const rows = filteredPurchases.map(p => [
      new Date(p.created_at).toLocaleDateString('pt-BR'),
      new Date(p.created_at).toLocaleTimeString('pt-BR'),
      p.reseller_email,
      p.buyer_name,
      p.buyer_cpf,
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
      <header className="topbar">
        <MobileMenu currentPage="/admin/sales" />
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
          <span>{user?.email || 'Admin'}</span>
          <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</Button>
        </div>
      </header>

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
              📥 Exportar CSV
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Revendedor</th>
                <th>Comprador</th>
                <th>Qtd</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Payment ID</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}>Carregando...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan={8}>Nenhuma compra encontrada</td></tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td>
                      <strong>{new Date(purchase.created_at).toLocaleDateString('pt-BR')}</strong>
                      <small>{new Date(purchase.created_at).toLocaleTimeString('pt-BR')}</small>
                    </td>
                    <td>{purchase.reseller_email}</td>
                    <td>
                      <strong>{purchase.buyer_name}</strong>
                      <small>{purchase.buyer_email}</small>
                    </td>
                    <td>{purchase.quantity}</td>
                    <td>R$ {purchase.amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${purchase.status}`}>
                        {purchase.status === 'approved' && 'Aprovado'}
                        {purchase.status === 'pending' && 'Pendente'}
                        {purchase.status === 'rejected' && 'Rejeitado'}
                        {purchase.status === 'refunded' && 'Estornado'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {purchase.payment_id.substring(0, 12)}...
                      </span>
                    </td>
                    <td>
                      <div className="actions-row">
                        {purchase.status === 'pending' && (
                          <button 
                            className="tiny-action success-action"
                            onClick={() => handleApprove(purchase)}
                          >
                            Aprovar
                          </button>
                        )}
                        {purchase.status === 'approved' && (
                          <button 
                            className="tiny-action danger-action"
                            onClick={() => handleRefund(purchase)}
                          >
                            Estornar
                          </button>
                        )}
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
    </AdminLayout>
  )
}
