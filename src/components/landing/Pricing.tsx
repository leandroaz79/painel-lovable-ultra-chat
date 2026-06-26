import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Check } from "lucide-react"
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
    { id: '2', name: 'ULTRA 15', slug: 'ultra-15', description: '15 dias de poder.', days: 15, price_cents: 4990, devices: 2, has_priority_support: true, sort_order: 2 },
    { id: '3', name: 'ULTRA 30', slug: 'ultra-30', description: '30 dias completo.', days: 30, price_cents: 7990, devices: 2, has_priority_support: true, sort_order: 3 },
  ]

  const popularIndex = Math.floor(displayPlans.length / 2)

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

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {displayPlans.map((plan, idx) => {
              const isPopular = idx === popularIndex
              return (
                <div
                  key={plan.id || plan.slug}
                  className={`group relative flex flex-col rounded-2xl border p-6 transition hover:-translate-y-1 ${
                    isPopular ? "border-white/20 shadow-2xl" : "border-white/5"
                  }`}
                  style={{
                    background: isPopular
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(45, 212, 191, 0.05))'
                      : 'rgba(255,255,255,0.03)',
                    boxShadow: isPopular ? '0 0 60px rgba(168, 85, 247, 0.25)' : undefined,
                  }}
                >
                  {isPopular && (
                    <div className="absolute -right-8 top-5 z-10 rotate-45">
                      <span className="inline-flex items-center rounded-full bg-gradient-brand px-5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                        Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{plan.days} dias</p>
                    <div className="mt-4">
                      <span className="text-4xl font-black" style={{ color: 'var(--text)' }}>{formatPrice(plan.price_cents)}</span>
                    </div>
                  </div>

                  <ul className="mt-8 space-y-3">
                    <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--brand-green)' }} />
                      Todas as features liberadas
                    </li>
                    <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--brand-green)' }} />
                      {plan.days} dias de acesso
                    </li>
                    <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--brand-green)' }} />
                      Até {plan.devices} dispositivo{plan.devices > 1 ? 's' : ''}
                    </li>
                    {plan.has_priority_support && (
                      <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                        <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--brand-green)' }} />
                        Suporte prioritário no WhatsApp
                      </li>
                    )}
                  </ul>

                  <div className="mt-8 flex-1" />

                  <button
                    onClick={() => handleSelectPlan(plan.slug)}
                    className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-all cursor-pointer ${
                      isPopular
                        ? "bg-gradient-brand text-white shadow-lg hover:opacity-95"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                    style={isPopular ? { boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)' } : undefined}
                  >
                    Escolher Plano
                  </button>
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
