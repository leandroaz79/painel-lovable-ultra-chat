import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useLicenseActions } from '../../hooks/useLicenseActions'
import { Button } from '../../components/ui/button'
import { Logo } from '../../components/ui/Logo'
import { X } from 'lucide-react'
import CheckoutModal from '../../components/landing/CheckoutModal'
import { Video, Clock, Key, ShoppingBag, Package } from 'lucide-react'

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
  const location = useLocation()
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
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState('')
  const [trialSuccess, setTrialSuccess] = useState<{ show: boolean; licenseKey: string }>({ show: false, licenseKey: '' })

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
  }, [user, location.pathname])

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

      setHasTrial(true)
      setTrialSuccess({ show: true, licenseKey: result.license?.license_key || '' })
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

      <nav className="user-anchors">
        <a href="#planos">Planos</a>
        <a href="#trial">Teste Grátis</a>
        <a href="#content-tabs">Licenças</a>
        <a href="#content-tabs" onClick={(e) => { e.preventDefault(); setActiveTab('purchases'); document.getElementById('content-tabs')?.scrollIntoView({ behavior: 'smooth' }) }}>Minhas Compras</a>
        <a href="#download">Como instalar a extensão</a>
        <a href="#dicas">Dicas</a>
        <a href="#download-ext" className="anchor-highlight">Download da Extensão</a>
      </nav>

      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="hero-panel" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="eyebrow">
              👋 Bem-vindo, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Visitante'}
            </p>
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

      <section id="trial" className="landing-section" style={{ paddingTop: '0' }}>
        <div className={`trial-hero-banner stagger-enter ${hasTrial ? 'used' : ''}`} style={{ animationDelay: '240ms' }}>
          <div className="trial-hero-content">
            <div className="trial-hero-icon">
              {hasTrial ? '✓' : <Clock size={28} />}
            </div>
            <div className="trial-hero-text">
              <strong>{hasTrial ? 'Teste gratuito já realizado' : 'Teste grátis de 30 minutos'}</strong>
              <p>
                {hasTrial
                  ? 'Você já utilizou seu teste gratuito. Adquira um plano para continuar usando o Ultra Chat.'
                  : 'Experimente a extensão completa por 30 minutos sem compromisso. Limite de 1 teste por usuário.'}
              </p>
            </div>
          </div>
          {!hasTrial && (
            <Button onClick={handleGenerateTrial} disabled={generatingTrial} className="trial-hero-btn">
              {generatingTrial ? 'Gerando...' : 'Quero testar grátis'}
            </Button>
          )}
        </div>
      </section>

      <section id="planos" className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <p className="eyebrow">Planos</p>
          <h2>Escolha o plano ideal para você</h2>
        </div>
        {loadingProducts ? (
          <div className="pricing-grid-new">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : endcustomerProducts.length > 0 ? (
          <div className="pricing-grid-new pricing-grid-compact">
            {endcustomerProducts.map((p, idx) => {
              const popularIndex = Math.floor(endcustomerProducts.length / 2)
              const isPopular = idx === popularIndex
              const tones = ['#12b5ff', '#14e6b8', '#ff5ea8', '#7c5aff', '#6de8ff']
              const accentColor = tones[idx % tones.length]
              const planTag = isPopular ? 'Mais vendido' : p.days <= 7 ? 'Ideal para testar' : p.days <= 15 ? 'Equilíbrio perfeito' : 'Melhor custo-benefício'

              return (
                <div
                  key={p.id}
                  className={`pricing-card-new pricing-card-compact ${isPopular ? 'featured' : ''} stagger-enter`}
                  style={{
                    animationDelay: `${idx * 80}ms`,
                    borderColor: isPopular ? `${accentColor}66` : undefined,
                    boxShadow: isPopular ? `0 0 60px ${accentColor}22` : undefined,
                  }}
                >
                  {isPopular && (
                    <span className="pricing-popular-badge" style={{ background: accentColor, color: '#07110a', boxShadow: `0 10px 28px ${accentColor}44` }}>
                      {planTag}
                    </span>
                  )}

                  <div>
                    {!isPopular && (
                      <div className="pricing-tag" style={{ color: accentColor }}>{planTag}</div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="pricing-name" style={{ color: isPopular ? accentColor : 'var(--text)' }}>{p.name}</div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {p.days ? `${p.days} dias` : 'Vitalício'}
                        </p>
                      </div>
                      <div className="pricing-price-row" style={{ margin: 0, justifyContent: 'flex-end' }}>
                        <strong style={{ color: 'var(--text)' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price_cents / 100)}
                        </strong>
                      </div>
                    </div>
                    <div className="pricing-per-day">
                      {p.days ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price_cents / 100 / p.days)} / dia` : 'Acesso sem expiração'}
                    </div>
                    <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{p.description}</p>
                  </div>

                  <ul className="pricing-features-new">
                    <li>Todas as features liberadas</li>
                    <li>{p.days ? `${p.days} dias de acesso` : 'Acesso vitalício'}</li>
                    <li>Até {p.devices} dispositivo{p.devices > 1 ? 's' : ''}</li>
                    {p.has_priority_support && <li>Suporte prioritário no WhatsApp</li>}
                    <li>Liberação imediata após aprovação</li>
                    <li>Pagamento único sem renovação automática</li>
                  </ul>

                  <button
                    onClick={() => { setSelectedSlug(p.slug); setCheckoutOpen(true) }}
                    className="primary-action pricing-btn inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-extrabold uppercase tracking-[0.16em] transition-all cursor-pointer text-white"
                  >
                    Comprar agora <span style={{ marginLeft: '10px', color: accentColor }}>→</span>
                  </button>
                  <p className="pricing-footnote">Pagamento via Pix • Liberação imediata</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Package size={48} className="empty-state-icon" />
            <h3>Nenhum plano disponível</h3>
            <p>Os planos ainda não foram cadastrados pelo administrador.</p>
          </div>
        )}
      </section>

      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="reseller-cta-card stagger-enter">
          <div className="reseller-cta-glow" />
          <div className="reseller-cta-grid">
            <div className="reseller-cta-content">
              <span className="reseller-cta-badge">Programa de Revendedores</span>
              <h2 className="reseller-cta-title">Torne-se um Revendedor Oficial</h2>
              <p className="reseller-cta-desc">
                Crie uma nova fonte de renda revendendo licenças do Ultra Chat.
                Painel exclusivo, preços com desconto, sem mensalidade recorrente.
              </p>
              <div className="reseller-cta-benefits">
                {['Painel exclusivo de revenda', 'Licenças vitalícias com desconto', 'Sem mensalidade recorrente', 'Suporte direto para operação', 'White-Label: cores, logo e marca', '1 Licença Vitalícia de brinde'].map((b) => (
                  <div key={b} className="reseller-cta-benefit">
                    <span className="reseller-cta-check">✓</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reseller-cta-side">
              <p className="reseller-cta-side-label">Oportunidade de lucro</p>
              <strong className="reseller-cta-side-price">
                Compre a partir de <strong style={{ color: 'var(--accent)' }}>R$ 19,90</strong>
              </strong>
              <p className="reseller-cta-side-desc">
                e revenda por R$ 299 — lucro de até 88% por venda.
              </p>
              <button
                onClick={() => navigate('/reseller-program')}
                className="primary-action reseller-cta-btn"
              >
                Conhecer o programa →
              </button>
            </div>
          </div>
        </div>
      </section>

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

      <section id="download-ext" className="landing-section" style={{ paddingTop: '0' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div className="card-heading" style={{ marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px' }}>Download da Extensão</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Baixe a extensão Ultra Chat para começar a usar. Compatível com os principais navegadores.
            </p>
          </div>
          <Button
            isLoading={downloadLoading}
            onClick={async () => {
              setDownloadLoading(true)
              try {
                const resp = await fetch('/templates/lovable-ultra-chat-full.zip')
                if (!resp.ok) throw new Error('Falha ao baixar extensão')
                const blob = await resp.blob()
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'lovable-ultra-chat-full.zip'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(a.href)
              } catch (err: unknown) {
                showToast(err instanceof Error ? err.message : 'Erro ao baixar extensão', 'error')
              } finally {
                setDownloadLoading(false)
              }
            }}
          >
            Baixar Ultra Chat (.zip)
          </Button>
        </div>
      </section>

      <section id="download" className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <p className="eyebrow">Recursos</p>
          <h2>Comece a usar</h2>
        </div>
        <div className="work-grid">
          <article className="glass-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true"><Video size={20} /></span>
              <h2>Como instalar a extensão</h2>
            </div>
            <div className="install-layout">
              <div className="install-video">
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '14px' }}>
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Tutorial Ultra Chat"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="install-text">
                <h3>💻 Instalação (Chrome / Edge / Brave / Opera)</h3>
                <ol>
                  <li><strong>Baixe</strong> o arquivo .zip logo abaixo.</li>
                  <li>Clique com o botão direito no .zip e escolha <strong>Extrair tudo</strong> (guarde a pasta em algum lugar fácil, ex: Documentos).</li>
                  <li>No navegador, abra: <code>chrome://extensions</code></li>
                  <li>Ative o <strong>Modo do desenvolvedor</strong> (canto superior direito).</li>
                  <li>Clique em <strong>Carregar sem compactação</strong> e selecione a pasta extraída (a que tem o <code>manifest.json</code>).</li>
                  <li>A extensão Ultra Chat aparece na lista. <strong>Fixe ela na barra</strong> (ícone de quebra-cabeça → alfinete).</li>
                  <li>Clique no ícone da extensão, <strong>cole sua key</strong> e clique em <strong>Ativar</strong>.</li>
                  <li>Pronto! Abra o Lovable e use à vontade.</li>
                </ol>
                <p className="install-warn">⚠️ Não apague a pasta extraída — a extensão roda a partir dela.</p>
                <h4>❓ Problemas comuns</h4>
                <ul className="install-faq">
                  <li><strong>"Key inválida"</strong> → confira se copiou sem espaços.</li>
                  <li><strong>"Limite de dispositivos atingido"</strong> → entre em <em>/minha-key</em> no site e libere um dispositivo antigo.</li>
                  <li><strong>Extensão sumiu</strong> → não apague a pasta extraída. Se apagou, baixe o .zip de novo.</li>
                  <li>Qualquer dúvida chama no WhatsApp pelo botão flutuante do site. 💚</li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="dicas" className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header">
          <p className="eyebrow">Aprenda mais</p>
          <h2>Dicas de uso e funcionalidades</h2>
        </div>
        <div className="video-grid">
          {[
            { id: 'dQw4w9WgXcQ', title: 'Primeiros passos no Ultra Chat', desc: 'Aprenda a instalar e configurar sua extensão.' },
            { id: 'dQw4w9WgXcQ', title: 'Como otimizar seus prompts', desc: 'Dicas para extrair o melhor resultado da IA.' },
            { id: 'dQw4w9WgXcQ', title: 'Recursos avançados', desc: 'Funcionalidades que vão turbinar seu design.' },
            { id: 'dQw4w9WgXcQ', title: 'Integração com outras ferramentas', desc: 'Conecte o Ultra Chat ao seu workflow.' },
          ].map(v => (
            <div key={v.id + v.title} className="video-card" onClick={() => { setSelectedVideo(v.id); setVideoModalOpen(true) }}>
              <div className="video-thumb">
                <img src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy" />
                <div className="video-play-icon">▶</div>
              </div>
              <div className="video-info">
                <strong>{v.title}</strong>
                <p>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {trialSuccess.show && (
        <div className="trial-success-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setTrialSuccess({ show: false, licenseKey: '' }) }}>
          <div className="trial-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trial-success-burst" />
            <div className="trial-success-particles">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="trial-particle" style={{
                  '--x': `${Math.random() * 100}%`,
                  '--y': `${Math.random() * 100}%`,
                  '--d': `${Math.random() * 0.6 + 0.2}s`,
                  '--s': `${Math.random() * 6 + 4}px`,
                  '--c': ['var(--accent)', '#6de8ff', '#ff5ea8', '#7c5aff', '#14e6b8'][i % 5],
                  animationDelay: `${Math.random() * 0.3}s`,
                } as React.CSSProperties} />
              ))}
            </div>
            <div className="trial-success-glow" />
            <div className="trial-success-check">✓</div>
            <h2 className="trial-success-title">Teste grátis ativado!</h2>
            <p className="trial-success-desc">Sua licença de 30 minutos foi gerada. Use a chave abaixo para ativar a extensão.</p>
            <div className="trial-success-key">
              <code>{trialSuccess.licenseKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(trialSuccess.licenseKey); showToast('Chave copiada!', 'success') }}>
                Copiar
              </button>
            </div>
            <button className="trial-success-ok" onClick={() => setTrialSuccess({ show: false, licenseKey: '' })}>
              Começar a usar
            </button>
          </div>
        </div>
      )}

      {videoModalOpen && (
        <div className="video-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setVideoModalOpen(false) }}>
          <div className="video-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setVideoModalOpen(false)}><X size={20} /></button>
            <div className="video-modal-player">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                title="Vídeo Ultra Chat"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <footer className="landing-footer">
        <div className="footer-inner">
          <Logo variant="user" href="/user" />
          <p>© 2026 Ultra Chat. Todos os direitos reservados.</p>
        </div>
      </footer>

      {checkoutOpen && selectedSlug && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false)
            loadLicenses()
            loadPurchases()
          }}
          productSlug={selectedSlug}
        />
      )}
    </div>
  )
}
