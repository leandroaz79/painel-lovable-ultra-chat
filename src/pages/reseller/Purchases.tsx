import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { ShoppingCart, CheckCircle, Clock, XCircle, Ban, AlertCircle } from 'lucide-react'
import ResellerLayout from '../../components/ResellerLayout'
import ResellerMobileMenu from '../../components/ResellerMobileMenu'
import { Logo } from '../../components/ui/Logo'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'

interface Purchase {
  payment_id: string
  quantity: number
  amount: number
  status: string
  created_at: string
  approved_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  approved: {
    label: 'Aprovado',
    icon: <CheckCircle size={16} />,
    className: 'badge active',
  },
  pending: {
    label: 'Pendente',
    icon: <Clock size={16} />,
    className: 'badge trial',
  },
  rejected: {
    label: 'Recusado',
    icon: <XCircle size={16} />,
    className: 'badge suspended',
  },
  cancelled: {
    label: 'Cancelado',
    icon: <Ban size={16} />,
    className: 'badge',
  },
  refunded: {
    label: 'Reembolsado',
    icon: <AlertCircle size={16} />,
    className: 'badge',
  },
}

export default function ResellerPurchases() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPurchases()
  }, [])

  async function loadPurchases() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.RESELLER_LIST_PURCHASES}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      const result = await response.json()
      if (result.success) {
        setPurchases(result.purchases)
      }
    } catch (err) {
      console.error('Erro ao carregar compras:', err)
      showToast('Erro ao carregar histórico', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totalSpent = purchases
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalKeys = purchases
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.quantity, 0)

  return (
    <ResellerLayout currentPage="/reseller/purchases">
      <header className="topbar">
        <ResellerMobileMenu currentPage="/reseller" />
        <Logo variant="reseller" href="/reseller" />
        <nav className="nav-links" aria-label="Navegação principal">
          <a href="/reseller">Painel</a>
          <a href="/reseller#credits">Créditos</a>
          <a href="/reseller#create-license">Gerar licença</a>
          <a href="/reseller#create-trial">Gerar trial</a>
          <a href="/reseller#licenses">Licenças</a>
          <a href="/reseller/purchases" className="active">Minhas Compras</a>
        </nav>
        <div className="session-box">
          <span>{user?.email || 'Carregando...'}</span>
          <Button variant="ghost" onClick={() => signOut()}>Sair</Button>
        </div>
      </header>

      <main className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Financeiro</p>
            <h1>Minhas Compras</h1>
            <p>Histórico completo de compras de créditos.</p>
          </div>
        </section>

        <div className="work-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '28px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>Total investido</p>
            <strong style={{ fontSize: '24px', color: 'var(--accent)' }}>{formatCurrency(totalSpent)}</strong>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>Chaves compradas</p>
            <strong style={{ fontSize: '24px', color: 'var(--text)' }}>{totalKeys}</strong>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>Transações</p>
            <strong style={{ fontSize: '24px', color: 'var(--text)' }}>{purchases.length}</strong>
          </div>
        </div>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Transações</h2>
              <p>{purchases.length} compra(s) registrada(s)</p>
            </div>
            <div className="table-tools">
              <Button variant="outline" size="sm" onClick={loadPurchases}>
                Atualizar
              </Button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Chaves</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Status</th>
                  <th scope="col">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}>Carregando...</td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan={5}>Nenhuma compra encontrada.</td></tr>
                ) : (
                  purchases.map(p => {
                    const cfg = statusConfig[p.status] || { label: p.status, icon: null, className: 'badge' }
                    return (
                      <tr key={p.payment_id}>
                        <td data-label="Data">{formatDate(p.created_at)}</td>
                        <td data-label="Chaves"><strong>{p.quantity}</strong></td>
                        <td data-label="Valor"><strong>{formatCurrency(p.amount)}</strong></td>
                        <td data-label="Status">
                          <span className={cfg.className} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td data-label="Pagamento">{p.approved_at ? formatDate(p.approved_at) : '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </ResellerLayout>
  )
}
