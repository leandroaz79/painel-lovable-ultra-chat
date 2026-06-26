import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import { Button } from '../../components/ui/button'
import { Logo } from '../../components/ui/Logo'
import { Info, AlertTriangle } from 'lucide-react'

interface PricingTier {
  id: string
  min_quantity: number
  max_quantity: number | null
  unit_price: number
  discount_percent: number
  is_active: boolean
}

export default function Products() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<PricingTier>>({})

  useEffect(() => {
    loadPricing()
  }, [])

  async function loadPricing() {
    try {
      const { data, error } = await supabase
        .from('product_pricing')
        .select('*')
        .order('min_quantity', { ascending: true })

      if (error) throw error
      setPricingTiers(data || [])
    } catch (error) {
      console.error('Erro ao carregar preços:', error)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(tier: PricingTier) {
    setEditingId(tier.id)
    setEditValues({
      min_quantity: tier.min_quantity,
      max_quantity: tier.max_quantity,
      unit_price: tier.unit_price,
      discount_percent: tier.discount_percent
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  async function saveEdit(tier: PricingTier) {
    if (!editValues.unit_price || editValues.unit_price <= 0) {
      showToast('Preço deve ser maior que zero', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('product_pricing')
        .update({
          unit_price: editValues.unit_price,
          discount_percent: editValues.discount_percent || 0
        })
        .eq('id', tier.id)

      if (error) throw error

      // Registrar no histórico
      await supabase.from('product_pricing_history').insert({
        pricing_id: tier.id,
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        old_unit_price: tier.unit_price,
        new_unit_price: editValues.unit_price,
        changed_by: user?.id,
        change_reason: 'Atualização manual via dashboard'
      })

      showToast('Preço atualizado com sucesso')
      setEditingId(null)
      setEditValues({})
      await loadPricing()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Erro ao atualizar preço', 'error')
    }
  }

  return (
    <AdminLayout currentPage="/admin/products">
      <header className="topbar">
        <MobileMenu currentPage="/admin/products" />
        <Logo variant="admin" href="/admin" />
        <nav className="nav-links" aria-label="Navegação principal">
          <a href="/admin">Painel</a>
          <a href="/admin#licenses">Licenças</a>
          <a href="/admin/customers">Clientes</a>
          <a href="/admin/resellers">Revendedores</a>
          <a href="/admin/sales">Vendas</a>
          <a href="/admin/products">Produtos</a>
        </nav>
        <div className="session-box">
          <span>{user?.email || 'Admin'}</span>
          <Button variant="ghost" onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</Button>
        </div>
      </header>

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Gestão de Produtos</p>
            <h1>Preços de créditos</h1>
            <p>Configure a tabela de preços progressivos para venda de créditos.</p>
          </div>
        </section>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Tabela de Preços</h2>
              <p>Desconto progressivo por quantidade</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Preço Unitário</th>
                  <th scope="col">Desconto</th>
                  <th scope="col">Preço Base</th>
                  <th scope="col">Economia</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}>Carregando...</td></tr>
                ) : pricingTiers.length === 0 ? (
                  <tr><td colSpan={6}>Nenhum preço configurado</td></tr>
                ) : (
                  pricingTiers.map(tier => {
                    const isEditing = editingId === tier.id
                    const currentPrice = isEditing ? (editValues.unit_price || tier.unit_price) : tier.unit_price
                    const basePrice = 30.00
                    const savings = basePrice - currentPrice
                    const rangeText = tier.max_quantity 
                      ? `${tier.min_quantity} - ${tier.max_quantity}`
                      : `${tier.min_quantity}+`

                    return (
                      <tr key={tier.id}>
                        <td data-label="Quantidade"><strong>{rangeText}</strong></td>
                        <td data-label="Preço Unitário">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editValues.unit_price || ''}
                              onChange={(e) => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) })}
                              style={{ width: '100px' }}
                            />
                          ) : (
                            `R$ ${tier.unit_price.toFixed(2)}`
                          )}
                        </td>
                        <td data-label="Desconto">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editValues.discount_percent ?? ''}
                              onChange={(e) => setEditValues({ ...editValues, discount_percent: parseInt(e.target.value) })}
                              style={{ width: '80px' }}
                            />
                          ) : (
                            `${tier.discount_percent}%`
                          )}
                        </td>
                        <td data-label="Preço Base">R$ {basePrice.toFixed(2)}</td>
                        <td data-label="Economia">
                          {savings > 0 ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                              -R$ {savings.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>--</span>
                          )}
                        </td>
                        <td data-label="Ações">
                          <div className="actions-row">
                            {isEditing ? (
                              <>
                                <Button
                                  size="tiny"
                                  onClick={() => saveEdit(tier)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  size="tiny"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="tiny"
                                onClick={() => startEdit(tier)}
                              >
                                Editar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="info-box">
            <h3 className="info-box-title"><Info size={18} /> Como funciona</h3>
            <ul className="info-box-list">
              <li>Preços são aplicados automaticamente no modal de compra</li>
              <li>Desconto progressivo incentiva compras maiores</li>
              <li>Alterações são registradas no histórico para auditoria</li>
              <li>Preço base (R$ 30,00) é usado como referência para calcular economia</li>
            </ul>
            {pricingTiers.length === 0 && (
              <div className="info-box warning">
                <p className="info-box-warning-title"><AlertTriangle size={16} /> Atenção</p>
                <p className="info-box-warning-text">
                  Execute a migration <code>008_product_pricing.sql</code> no Supabase para criar a tabela de preços.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </AdminLayout>
  )
}
