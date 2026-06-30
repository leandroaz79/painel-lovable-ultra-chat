import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { Button } from '../../components/ui/button'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { Plus, Pencil, Power, PowerOff, Trash2, ArrowUp, ArrowDown, Star } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  days: number
  price_cents: number
  devices: number
  has_priority_support: boolean
  is_lifetime: boolean
  is_featured: boolean
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
  const [formIsLifetime, setFormIsLifetime] = useState(false)
  const [formIsFeatured, setFormIsFeatured] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    product: Product | null
    isLoading: boolean
  }>({ isOpen: false, product: null, isLoading: false })

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
    setFormIsLifetime(false)
    setFormIsFeatured(false)
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
    setFormIsLifetime(product.is_lifetime)
    setFormIsFeatured(product.is_featured)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleSave() {
    if (!formName || !formSlug || !formPrice) return
    if (!formIsLifetime && !formDays) return
    setSaving(true)

    try {
      const payload: Record<string, unknown> = {
        name: formName,
        slug: formSlug,
        description: formDescription,
        days: formIsLifetime ? 0 : formDays,
        price_cents: formPrice,
        devices: formDevices,
        has_priority_support: formPrioritySupport,
        is_lifetime: formIsLifetime,
        is_featured: formIsFeatured,
      }

      if (formIsFeatured) {
        await supabase
          .from('products_endcustomer')
          .update({ is_featured: false })
          .neq('id', editing?.id || '')
      }

      if (editing) {
        payload.sort_order = editing.sort_order
        const { error } = await supabase
          .from('products_endcustomer')
          .update(payload)
          .eq('id', editing.id)

        if (error) throw error
        showToast('Produto atualizado!', 'success')
      } else {
        payload.sort_order = products.length > 0
          ? Math.max(...products.map(p => p.sort_order)) + 1
          : 1
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

  async function handleMoveUp(product: Product) {
    const index = products.findIndex(p => p.id === product.id)
    if (index <= 0) return
    const above = products[index - 1]
    try {
      await supabase.from('products_endcustomer').update({ sort_order: above.sort_order }).eq('id', product.id)
      await supabase.from('products_endcustomer').update({ sort_order: product.sort_order }).eq('id', above.id)
      await loadProducts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao reordenar', 'error')
    }
  }

  async function handleMoveDown(product: Product) {
    const index = products.findIndex(p => p.id === product.id)
    if (index < 0 || index >= products.length - 1) return
    const below = products[index + 1]
    try {
      await supabase.from('products_endcustomer').update({ sort_order: below.sort_order }).eq('id', product.id)
      await supabase.from('products_endcustomer').update({ sort_order: product.sort_order }).eq('id', below.id)
      await loadProducts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao reordenar', 'error')
    }
  }

  function handleAskDeleteProduct(product: Product) {
    setDeleteDialog({ isOpen: true, product, isLoading: false })
  }

  function handleCloseDeleteDialog() {
    setDeleteDialog({ isOpen: false, product: null, isLoading: false })
  }

  async function handleConfirmDeleteProduct() {
    const product = deleteDialog.product
    if (!product) return
    setDeleteDialog(prev => ({ ...prev, isLoading: true }))
    try {
      const { error } = await supabase
        .from('products_endcustomer')
        .delete()
        .eq('id', product.id)

      if (error) throw error
      showToast('Plano excluído!', 'success')
      handleCloseDeleteDialog()
      await loadProducts()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir'
      if (msg.includes('foreign key')) {
        showToast('Não é possível excluir: existem compras vinculadas a este plano. Desative-o em vez de excluir.', 'error')
      } else {
        showToast(msg, 'error')
      }
      setDeleteDialog(prev => ({ ...prev, isLoading: false }))
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
              <p>{products.length} produtos cadastrados · ordem definida pela posição na tabela</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Produto</th>
                    <th scope="col">Slug</th>
                    <th scope="col">Duração</th>
                    <th scope="col">Preço</th>
                    <th scope="col">Dispositivos</th>
                    <th scope="col">Suporte</th>
                    <th scope="col">Destaque</th>
                    <th scope="col">Status</th>
                    <th scope="col">Ações</th>
                  </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10}>Carregando...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={10}>Nenhum produto cadastrado.</td></tr>
                ) : (
                  products.map((product, idx) => (
                    <tr key={product.id}>
                      <td data-label="#" style={{ color: 'var(--muted)', fontSize: '13px' }}>{idx + 1}</td>
                      <td data-label="Produto">
                        <strong>{product.name}</strong>
                        <small>{product.description}</small>
                      </td>
                      <td data-label="Slug"><code>{product.slug}</code></td>
                      <td data-label="Duração">{product.is_lifetime ? <strong>Vitalício</strong> : `${product.days} dias`}</td>
                      <td data-label="Preço"><strong>{formatPrice(product.price_cents)}</strong></td>
                      <td data-label="Dispositivos">{product.devices}</td>
                      <td data-label="Suporte">{product.has_priority_support ? '✅' : '—'}</td>
                      <td data-label="Destaque">
                        {product.is_featured ? <Star size={18} fill="var(--accent)" color="var(--accent)" /> : '—'}
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${product.active ? 'active' : 'expired'}`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td data-label="Ações">
                        <div className="actions-row" style={{ flexWrap: 'wrap', gap: '4px' }}>
                          <Button size="tiny" onClick={() => openEdit(product)}>
                            <Pencil className="size-3" /> Editar
                          </Button>
                          <Button size="tiny" variant="outline" onClick={() => handleMoveUp(product)} disabled={idx === 0}>
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button size="tiny" variant="outline" onClick={() => handleMoveDown(product)} disabled={idx >= products.length - 1}>
                            <ArrowDown className="size-3" />
                          </Button>
                          <Button size="tiny" variant={product.active ? 'destructive' : 'outline'} onClick={() => handleToggleActive(product)}>
                            {product.active ? <PowerOff className="size-3" /> : <Power className="size-3" />}
                            {product.active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button size="tiny" variant="ghost" onClick={() => handleAskDeleteProduct(product)}>
                            <Trash2 className="size-3" />
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
                    <input type="number" value={formDays} onChange={(e) => setFormDays(Number(e.target.value))} min={1} disabled={formIsLifetime} style={formIsLifetime ? { opacity: 0.4 } : {}} />
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
                <label className="inline-flex items-center gap-3" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formIsLifetime}
                    onChange={(e) => setFormIsLifetime(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto' }}
                  />
                  <span style={{ margin: 0, cursor: 'pointer' }}>Vitalício (não expira)</span>
                </label>
                <label className="inline-flex items-center gap-3" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto' }}
                  />
                  <span style={{ margin: 0, cursor: 'pointer' }}>Em destaque (aparece destacado na landing page)</span>
                </label>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <Button type="button" onClick={handleSave} disabled={!formName || !formSlug || !formPrice || saving || (!formIsLifetime && !formDays)} style={{ flex: 1 }}>
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

        <ConfirmationDialog
          isOpen={deleteDialog.isOpen}
          title="Excluir Plano"
          message={deleteDialog.product ? `Deseja excluir o plano "${deleteDialog.product.name}"? Se houver compras vinculadas, o banco impedirá a exclusão.` : ''}
          confirmText="Excluir"
          cancelText="Cancelar"
          isDangerous={true}
          isLoading={deleteDialog.isLoading}
          onConfirm={handleConfirmDeleteProduct}
          onCancel={handleCloseDeleteDialog}
        />
      </div>
    </AdminLayout>
  )
}
