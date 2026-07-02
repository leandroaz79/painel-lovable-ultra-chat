import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useLicenseActions } from '../../hooks/useLicenseActions'
import { Button } from '../../components/ui/button'
import { Logo } from '../../components/ui/Logo'
import CheckoutModal from '../../components/landing/CheckoutModal'
import { generateExtensionZip, downloadZip } from '../../utils/extensionBuilder'
import { getStoredTemplate } from '../../utils/templateStorage'
import { loadBrandingConfig } from '../../utils/brandingStorage'
import { Video, Download, Clock, Key, ShoppingBag, Package } from 'lucide-react'

interface License {
  license_key: string
  status: string
  license_type: string
  expires_at: string
  device_id?: string
  created_at: string
}

interface Purchase {
  id: string
  payment_status: string
  approved_at: string | null
  created_at: string
  product: { name: string, price_cents: number } | null
}

interface EndcustomerProduct {
  id: string
  name: string
  slug: string
  description: string
  days: number
  price_cents: number
  devices: number
  has_priority_support: boolean
}

export default function UserDashboard() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { copyLicenseKey, resetHwid } = useLicenseActions()
  const [licenses, setLicenses] = useState<License[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [endcustomerProducts, setEndcustomerProducts] = useState<EndcustomerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [generatingTrial, setGeneratingTrial] = useState(false)
  const [hasTrial, setHasTrial] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'licenses' | 'purchases'>('licenses')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const activeLicenses = licenses.filter(l => l.status === 'active')
  const nearestExpiry = activeLicenses.length > 0
    ? activeLicenses.reduce((prev, curr) =>
        new Date(prev.expires_at) < new Date(curr.expires_at) ? prev : curr
      )
    : null

  useEffect(() => {
    if (!user) return
    document.body.classList.add('session-ready')
    loadLicenses()
    loadPurchases()
    loadEndcustomerProducts()
    checkTrialStatus()
  }, [user])

  async function checkTrialStatus() {
    try {
      const { data, error } = await supabase
        .from('user_trials')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) {
        console.warn('user_trials pode não existir:', error.message)
        setHasTrial(false)
        return
      }

      setHasTrial(!!data)
    } catch {
      setHasTrial(false)
    }
  }

  async function loadLicenses() {
    try {
      const { data, error } = await supabase
        .from('ts_licenses')
        .select('license_key, status, license_type, expires_at, device_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLicenses(data || [])
    } catch (error) {
      console.error('Erro ao carregar licenças:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPurchases() {
    try {
      const { data, error } = await supabase
        .from('customer_purchases')
        .select('id, payment_status, approved_at, created_at, product:product_id!inner(name, price_cents)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases((data || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        payment_status: p.payment_status as string,
        approved_at: p.approved_at as string | null,
        created_at: p.created_at as string,
        product: (Array.isArray(p.product) ? (p.product as Array<{ name: string; price_cents: number }>)[0] : p.product) as { name: string; price_cents: number } | null,
      })))
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
    } finally {
      setLoadingPurchases(false)
    }
  }

  async function loadEndcustomerProducts() {
    try {
      const { data, error } = await supabase
        .from('products_endcustomer')
        .select('*')
        .eq('active', true)
        .order('sort_order')

      if (error) throw error
      setEndcustomerProducts(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function handleGenerateTrial() {
    setGeneratingTrial(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${SUPABASE_URL}${FUNCTIONS.USER_CREATE_TRIAL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      showToast(result.message || 'Teste criado com sucesso!', 'success')
      setHasTrial(true)
      await loadLicenses()
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao gerar teste',
        'error'
      )
    } finally {
      setGeneratingTrial(false)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      active: 'Ativa',
      trial: 'Trial',
      expired: 'Expirada',
      suspended: 'Suspensa',
    }
    return map[status] || status
  }

  function purchaseStatusLabel(status: string) {
    const map: Record<string, string> = {
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Rejeitado',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado',
    }
    return map[status] || status
  }

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Logo variant="user" href="/user" />
          <div className="session-box">
            <span>{user?.email || 'Usuário'}</span>
            <Button variant="ghost" onClick={() => navigate('/profile')}>
              Perfil
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="hero-panel" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="eyebrow">Painel do Usuário</p>
            {loading ? (
              <>
                <div className="skeleton skeleton-line skeleton-line-lg" style={{ marginBottom: '12px' }} />
                <div className="skeleton skeleton-line skeleton-line-md" />
              </>
            ) : (
              <>
                <h1 style={{ maxWidth: 'none' }}>
                  {licenses.length === 0
                    ? 'Comece agora com Ultra Chat'
                    : activeLicenses.length > 0
                      ? `Você tem ${activeLicenses.length} licença${activeLicenses.length > 1 ? 's' : ''} ativa${activeLicenses.length > 1 ? 's' : ''}`
                      : 'Suas licenças expiraram'}
                </h1>
                <p style={{ fontSize: '16px', maxWidth: '480px' }}>
                  {licenses.length === 0
                    ? 'Adquira um plano e tenha acesso a todos os recursos do Ultra Chat.'
                    : nearestExpiry
                      ? `Próxima expira em ${daysUntil(nearestExpiry.expires_at)} dia${daysUntil(nearestExpiry.expires_at) !== 1 ? 's' : ''}`
                      : 'Gerencie suas licenças e acompanhe suas compras.'}
                </p>
                <div className="user-hero-stats">
                  <div className="user-hero-stat">
                    <strong>{activeLicenses.length}</strong>
                    <span>Ativas</span>
                  </div>
                  <div className="user-hero-stat">
                    <strong>{licenses.length}</strong>
                    <span>Total</span>
                  </div>
                  <div className="user-hero-stat">
                    <strong>{purchases.length}</strong>
                    <span>Compras</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
                  {licenses.length === 0 && (
                    <Button onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}>
                      Ver planos
                    </Button>
                  )}
                  {activeLicenses.length > 0 && (
                    <Button variant="ghost" onClick={() => {
                      setActiveTab('licenses')
                      document.getElementById('content-tabs')?.scrollIntoView({ behavior: 'smooth' })
                    }}>
                      Gerenciar licenças
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="planos" className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <p className="eyebrow">Planos</p>
          <h2>Escolha o plano ideal para você</h2>
        </div>
        {loadingProducts ? (
          <div className="user-pricing-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : endcustomerProducts.length > 0 ? (
          <div className="user-pricing-grid">
            {endcustomerProducts.map((p, idx) => (
              <div
                key={p.id}
                className={`user-pricing-card ${idx === 1 ? 'featured' : ''} stagger-enter`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {idx === 1 && <span className="pricing-popular-badge">★ Popular</span>}
                <div>
                  <h3 className="user-pricing-name">{p.name}</h3>
                  {p.description && <p className="user-pricing-desc">{p.description}</p>}
                </div>
                <div className="user-pricing-price">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price_cents / 100)}
                  <small> / único</small>
                </div>
                <div className="user-pricing-perday">
                  ~{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price_cents / 100 / p.days)}/dia
                </div>
                <ul className="user-pricing-features">
                  <li>{p.devices} dispositivo{p.devices > 1 ? 's' : ''}</li>
                  <li>{p.days} dias de acesso</li>
                  {p.has_priority_support && <li>Suporte prioritário via WhatsApp</li>}
                </ul>
                <div className="user-pricing-cta">
                  <Button onClick={() => { setSelectedSlug(p.slug); setCheckoutOpen(true) }}>
                    Comprar agora
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Package size={48} className="empty-state-icon" />
            <h3>Nenhum plano disponível</h3>
            <p>Os planos ainda não foram cadastrados pelo administrador.</p>
          </div>
        )}
      </section>

      {!hasTrial && !loading && (
        <section className="landing-section" style={{ paddingTop: '0' }}>
          <div className="trial-banner stagger-enter" style={{ animationDelay: '240ms' }}>
            <div className="trial-banner-info">
              <span className="icon-pill" aria-hidden="true"><Clock size={18} /></span>
              <div className="trial-banner-text">
                <strong>Teste grátis de 30 minutos</strong>
                <p>Experimente a extensão antes de comprar. Limite de 1 teste por usuário.</p>
              </div>
            </div>
            <Button onClick={handleGenerateTrial} disabled={generatingTrial} style={{ flexShrink: 0 }}>
              {generatingTrial ? 'Gerando...' : 'Gerar teste grátis'}
            </Button>
          </div>
        </section>
      )}
      {hasTrial && !loading && (
        <section className="landing-section" style={{ paddingTop: '0' }}>
          <div className="trial-banner-used stagger-enter" style={{ animationDelay: '240ms' }}>
            <Clock size={18} color="var(--accent)" />
            <span>✓ Você já utilizou seu teste gratuito</span>
          </div>
        </section>
      )}

      <section id="content-tabs" className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <p className="eyebrow">Seu conteúdo</p>
          <h2>Licenças e compras</h2>
        </div>
        <div className="user-tabs">
          <button
            className={`user-tab ${activeTab === 'licenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('licenses')}
          >
            <Key size={16} />
            Licenças
            <span className="user-tab-badge">{licenses.length}</span>
          </button>
          <button
            className={`user-tab ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchases')}
          >
            <ShoppingBag size={16} />
            Compras
            <span className="user-tab-badge">{purchases.length}</span>
          </button>
        </div>

        {activeTab === 'licenses' && (
          <div className="table-card reveal">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Chave</th>
                    <th scope="col">Status</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Expira em</th>
                    <th scope="col">HWID</th>
                    <th scope="col">Criada em</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i}>
                        <td colSpan={7} style={{ padding: '12px 18px' }}>
                          <div className="skeleton skeleton-line" style={{ width: '80%' }} />
                        </td>
                      </tr>
                    ))
                  ) : licenses.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state" style={{ padding: '32px 24px' }}>
                          <Key size={40} className="empty-state-icon" style={{ fontSize: '40px' }} />
                          <h3>Nenhuma licença encontrada</h3>
                          <p>Adquira um plano para gerar sua primeira licença.</p>
                          <Button onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}>
                            Ver planos
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    licenses.map((license) => (
                      <tr key={license.license_key}>
                        <td data-label="Chave">
                          <span className="license-key">{license.license_key}</span>
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${license.status}`}>
                            {statusLabel(license.status)}
                          </span>
                        </td>
                        <td data-label="Tipo">{license.license_type === 'trial' ? 'Trial' : license.license_type === 'lifetime' ? 'Vitalícia' : 'Paga'}</td>
                        <td data-label="Expira em">{formatDate(license.expires_at)}</td>
                        <td data-label="HWID">{license.device_id ? 'vinculado' : 'livre'}</td>
                        <td data-label="Criada em">{formatDate(license.created_at)}</td>
                        <td data-label="Ações">
                          <div className="actions-row">
                            <Button
                              size="tiny"
                              onClick={() => copyLicenseKey(license.license_key)}
                            >
                              Copiar
                            </Button>
                            {license.device_id && (
                              <Button
                                size="tiny"
                                variant="outline"
                                onClick={async (e) => {
                                  const ok = await resetHwid(license.license_key, e.currentTarget)
                                  if (ok) await loadLicenses()
                                }}
                              >
                                Liberar PC
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="table-card reveal">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Produto</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Pago em</th>
                    <th scope="col">Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPurchases ? (
                    [1, 2, 3].map(i => (
                      <tr key={i}>
                        <td colSpan={5} style={{ padding: '12px 18px' }}>
                          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
                        </td>
                      </tr>
                    ))
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state" style={{ padding: '32px 24px' }}>
                          <ShoppingBag size={40} className="empty-state-icon" style={{ fontSize: '40px' }} />
                          <h3>Nenhuma compra encontrada</h3>
                          <p>Você ainda não realizou nenhuma compra.</p>
                          <Button onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}>
                            Ver planos
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id}>
                        <td data-label="Produto"><strong>{p.product?.name || '—'}</strong></td>
                        <td data-label="Valor">
                          {p.product?.price_cents
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.product.price_cents / 100)
                            : '—'}
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${p.payment_status === 'approved' ? 'active' : p.payment_status === 'pending' ? 'trial' : 'expired'}`}>
                            {purchaseStatusLabel(p.payment_status)}
                          </span>
                        </td>
                        <td data-label="Pago em">{p.approved_at ? formatDate(p.approved_at) : '—'}</td>
                        <td data-label="Criada em">{formatDate(p.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <p className="eyebrow">Recursos</p>
          <h2>Comece a usar</h2>
        </div>
        <div className="work-grid">
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Video size={20} /></span>
              <h2>Como instalar a extensão</h2>
            </div>
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '14px',
              }}
            >
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Tutorial Ultra Chat"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </article>

          <article className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Download size={20} /></span>
              <h2>Download da Extensão</h2>
            </div>
            <p style={{ marginBottom: '24px' }}>
              Baixe a extensão Ultra Chat para começar a usar. Compatível com os principais navegadores.
            </p>
            <Button
              style={{ alignSelf: 'flex-start' }}
              isLoading={downloadLoading}
              onClick={async () => {
                setDownloadLoading(true)
                try {
                  const config = loadBrandingConfig()
                  if (!config) {
                    showToast('Nenhuma configuração de branding encontrada. O admin precisa gerar a extensão primeiro em Branding.', 'error')
                    return
                  }
                  const stored = await getStoredTemplate()
                  let templateBuffer: ArrayBuffer
                  if (stored) {
                    templateBuffer = stored
                  } else {
                    const resp = await fetch('/templates/lovable-ultra-chat-5.4-1R.zip')
                    if (!resp.ok) throw new Error('Falha ao baixar template')
                    templateBuffer = await resp.arrayBuffer()
                  }
                  const blob = await generateExtensionZip(templateBuffer, {
                    companyName: config.companyName,
                    whatsapp: config.whatsapp,
                    communityLink: config.communityLink,
                    primaryColor: config.primaryColor,
                    secondaryColor: config.secondaryColor,
                  })
                  await downloadZip(blob, config.companyName)
                } catch (err: unknown) {
                  showToast(err instanceof Error ? err.message : 'Erro ao gerar extensão', 'error')
                } finally {
                  setDownloadLoading(false)
                }
              }}
            >
              Baixar Ultra Chat (.zip)
            </Button>
          </article>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <Logo variant="user" href="/user" />
          <p>© 2026 Ultra Chat. Todos os direitos reservados.</p>
        </div>
      </footer>

      {checkoutOpen && selectedSlug && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productSlug={selectedSlug}
        />
      )}
    </div>
  )
}
