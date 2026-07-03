import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import CheckoutModal from './CheckoutModal'

interface Plan {
  id: string
  name: string
  slug: string
  description: string
  days: number
  price_cents: number
  devices: number
  has_priority_support: boolean
  is_featured?: boolean
  sort_order: number
}

export function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      const { data, error } = await supabase
        .from('products_endcustomer')
        .select('*')
        .eq('active', true)
        .order('sort_order')

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectPlan(slug: string) {
    setSelectedSlug(slug)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setSelectedSlug(null)
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <section id="planos" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
          <p style={{ color: 'var(--muted)' }}>Carregando planos...</p>
        </div>
      </section>
    )
  }

  const displayPlans = plans.length > 0 ? plans : [
    { id: '1', name: 'TRY 7', slug: 'try-7', description: 'Experimente por 7 dias.', days: 7, price_cents: 2990, devices: 1, has_priority_support: false, sort_order: 1 },
    { id: '2', name: 'ULTRA 15', slug: 'ultra-15', description: '15 dias de poder.', days: 15, price_cents: 4990, devices: 2, has_priority_support: true, is_featured: true, sort_order: 2 },
    { id: '3', name: 'ULTRA 30', slug: 'ultra-30', description: '30 dias completo.', days: 30, price_cents: 7990, devices: 2, has_priority_support: true, sort_order: 3 },
  ]

  const featuredIndex = displayPlans.findIndex((plan) => plan.is_featured)
  const popularIndex = featuredIndex >= 0 ? featuredIndex : Math.floor(displayPlans.length / 2)

  function planTag(plan: Plan, idx: number) {
    if (plan.is_featured || idx === popularIndex) return 'Mais vendido'
    if (plan.days <= 7) return 'Ideal para testar'
    if (plan.days <= 15) return 'Equilíbrio perfeito'
    if (plan.days >= 30 || plan.days === 0) return 'Melhor custo-benefício'
    return 'Plano premium'
  }

  function planTone(idx: number) {
    const tones = ['#12b5ff', '#14e6b8', '#ff5ea8', '#7c5aff', '#6de8ff']
    return tones[idx % tones.length]
  }

  function perDayLabel(plan: Plan) {
    if (!plan.days) return 'Acesso sem expiração'
    return `${formatPrice(Math.round(plan.price_cents / plan.days))} / dia`
  }

  return (
    <>
      <section id="planos" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Preços Justos
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
              Planos e <span className="text-gradient-brand">Preços</span>
            </h2>
            <p className="mt-4" style={{ color: 'var(--muted)' }}>
              Invista no seu fluxo criativo sem susto. Pagamento único via Pix.
            </p>
          </div>

          <div className="pricing-grid-new mt-12">
            {displayPlans.map((plan, idx) => {
              const isPopular = idx === popularIndex
              const accentColor = planTone(idx)
              return (
                <div
                  key={plan.id || plan.slug}
                  className={`pricing-card-new ${isPopular ? 'featured' : ''}`}
                  style={{
                    borderColor: isPopular ? `${accentColor}66` : undefined,
                    boxShadow: isPopular ? `0 0 60px ${accentColor}22` : undefined,
                  }}
                >
                  {isPopular && (
                    <span className="pricing-popular-badge" style={{ background: accentColor, color: '#07110a', boxShadow: `0 10px 28px ${accentColor}44` }}>
                      {planTag(plan, idx)}
                    </span>
                  )}

                  <div>
                    {!isPopular && (
                      <div className="pricing-tag" style={{ color: accentColor }}>{planTag(plan, idx)}</div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="pricing-name" style={{ color: isPopular ? accentColor : 'var(--text)' }}>{plan.name}</div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {plan.days ? `${plan.days} dias` : 'Vitalício'}
                        </p>
                      </div>
                      <div className="pricing-price-row" style={{ margin: 0, justifyContent: 'flex-end' }}>
                        <strong style={{ color: 'var(--text)' }}>{formatPrice(plan.price_cents)}</strong>
                      </div>
                    </div>
                    <div className="pricing-per-day">{perDayLabel(plan)}</div>
                    <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{plan.description}</p>
                  </div>

                  <ul className="pricing-features-new">
                    <li>Todas as features liberadas</li>
                    <li>{plan.days ? `${plan.days} dias de acesso` : 'Acesso vitalício'}</li>
                    <li>Até {plan.devices} dispositivo{plan.devices > 1 ? 's' : ''}</li>
                    {plan.has_priority_support && (
                      <li>Suporte prioritário no WhatsApp</li>
                    )}
                    <li>Liberação imediata após aprovação</li>
                    <li>Pagamento único sem renovação automática</li>
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.slug)}
                    className={`pricing-btn inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-extrabold uppercase tracking-[0.16em] transition-all cursor-pointer ${
                      isPopular ? 'text-white' : 'text-white'
                    }`}
                    style={{
                      background: 'rgba(14, 19, 32, 0.9)',
                      border: `1px solid ${accentColor}66`,
                      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 8px 28px ${accentColor}1f`,
                    }}
                  >
                    Comprar agora <span style={{ marginLeft: '10px', color: accentColor }}>→</span>
                  </button>
                  <p className="pricing-footnote">Pagamento via Pix ou cartão • Liberação imediata</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {selectedSlug && (
        <CheckoutModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          productSlug={selectedSlug}
        />
      )}
    </>
  )
}
