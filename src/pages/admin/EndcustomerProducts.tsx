import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { Button } from '../../components/ui/button'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  days: number
  price_cents: number
  devices: number
  has_priority_support: boolean
  active: boolean
  sort_order: number
  created_at: string
}

export default function EndcustomerProducts() {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDays, setFormDays] = useState(7)
  const [formPrice, setFormPrice] = useState(2990)
  const [formDevices, setFormDevices] = useState(1)
  const [formPrioritySupport, setFormPrioritySupport] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products_endcustomer')
        .select('*')
        .order('sort_order')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setFormName('')
    setFormSlug('')
    setFormDescription('')
    setFormDays(7)
    setFormPrice(2990)
    setFormDevices(1)
    setFormPrioritySupport(false)
    setShowModal(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setFormName(product.name)
    setFormSlug(product.slug)
    setFormDescription(product.description || '')
    setFormDays(product.days)
    setFormPrice(product.price_cents)
    setFormDevices(product.devices)
    setFormPrioritySupport(product.has_priority_support)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleSave() {
    if (!formName || !formSlug || !formDays || !formPrice) return
    setSaving(true)

    try {
      const payload = {
        name: formName,
        slug: formSlug,
        description: formDescription,
        days: formDays,
        price_cents: formPrice,
        devices: formDevices,
        has_priority_support: formPrioritySupport,
      }

      if (editing) {
        const { error } = await supabase
          .from('products_endcustomer')
          .update(payload)
          .eq('id', editing.id)

        if (error) throw error
        showToast('Produto atualizado!', 'success')
      } else {
        const { error } = await supabase
          .from('products_endcustomer')
          .insert(payload)

        if (error) throw error
        showToast('Produto criado!', 'success')
      }

      closeModal()
      await loadProducts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      const { error } = await supabase
        .from('products_endcustomer')
        .update({ active: !product.active })
        .eq('id', product.id)

      if (error) throw error
      showToast(product.active ? 'Produto desativado' : 'Produto ativado', 'success')
      await loadProducts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    }
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  return (
    <AdminLayout currentPage="/admin/endcustomer-products">
      <AdminTopbar currentPage="/admin/endcustomer-products" />

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Planos para Cliente Final</p>
            <h1>Gerenciar planos de venda direta</h1>
            <p>Produtos exibidos na landing page e disponíveis para compra via Pix no checkout.</p>
          </div>
          <Button onClick={openNew}>
            <Plus className="size-4" /> Novo plano
          </Button>
        </section>

        <section className="table-card reveal">
          <div className="table-head">
            <div>
              <h2>Planos</h2>
              <p>{products.length} produtos cadastrados</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Produto</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Dias</th>
                  <th scope="col">Preço</th>
                  <th scope="col">Dispositivos</th>
                  <th scope="col">Suporte</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}>Carregando...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8}>Nenhum produto cadastrado.</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td data-label="Produto">
                        <strong>{product.name}</strong>
                        <small>{product.description}</small>
                      </td>
                      <td data-label="Slug"><code>{product.slug}</code></td>
                      <td data-label="Dias">{product.days}</td>
                      <td data-label="Preço"><strong>{formatPrice(product.price_cents)}</strong></td>
                      <td data-label="Dispositivos">{product.devices}</td>
                      <td data-label="Suporte">{product.has_priority_support ? '✅' : '—'}</td>
                      <td data-label="Status">
                        <span className={`badge ${product.active ? 'active' : 'expired'}`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td data-label="Ações">
                        <div className="actions-row">
                          <Button size="tiny" onClick={() => openEdit(product)}>
                            <Pencil className="size-3" /> Editar
                          </Button>
                          <Button size="tiny" variant={product.active ? 'destructive' : 'outline'} onClick={() => handleToggleActive(product)}>
                            {product.active ? <PowerOff className="size-3" /> : <Power className="size-3" />}
                            {product.active ? 'Desativar' : 'Ativar'}
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

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>&times;</button>
              <h2>{editing ? 'Editar' : 'Novo'} Plano</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
                {editing ? 'Edite os dados do plano para cliente final.' : 'Cadastre um novo plano para aparecer na landing e no checkout.'}
              </p>

              <div className="stack-form">
                <label>
                  <span>Nome do plano</span>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="ULTRA 15" />
                </label>
                <label>
                  <span>Slug (URL)</span>
                  <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="ultra-15" />
                </label>
                <label>
                  <span>Descrição</span>
                  <input type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="15 dias de acesso ilimitado..." />
                </label>
                <div className="split-fields">
                  <label>
                    <span>Dias de acesso</span>
                    <input type="number" value={formDays} onChange={(e) => setFormDays(Number(e.target.value))} min={1} />
                  </label>
                  <label>
                    <span>Preço (centavos)</span>
                    <input type="number" value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))} min={1} />
                  </label>
                </div>
                <div className="split-fields">
                  <label>
                    <span>Dispositivos</span>
                    <input type="number" value={formDevices} onChange={(e) => setFormDevices(Number(e.target.value))} min={1} />
                  </label>
                  <label>
                    <span>Preço exibido</span>
                    <input type="text" value={formatPrice(formPrice)} readOnly />
                  </label>
                </div>
                <label className="inline-flex items-center gap-3" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formPrioritySupport}
                    onChange={(e) => setFormPrioritySupport(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto' }}
                  />
                  <span style={{ margin: 0, cursor: 'pointer' }}>Suporte prioritário</span>
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <Button type="button" onClick={handleSave} disabled={!formName || !formSlug || saving} style={{ flex: 1 }}>
                    {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar plano'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={closeModal} style={{ flex: 1 }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
