import { Check, X } from "lucide-react"

const plans = [
  {
    name: "TRY 7",
    days: "7 dias",
    price: "R$ 29,90",
    popular: false,
    features: [
      "Todas as features liberadas",
      "Suporte por WhatsApp",
      "Renovação manual",
      "Registro em 1 dispositivo",
    ],
    missing: [],
  },
  {
    name: "ULTRA 15",
    days: "15 dias",
    price: "R$ 49,90",
    popular: true,
    features: [
      "Todas as features liberadas",
      "Suporte prioritário no WhatsApp",
      "Renovação manual",
      "Registro em até 2 dispositivos",
    ],
    missing: [],
  },
  {
    name: "ULTRA 30",
    days: "30 dias",
    price: "R$ 79,90",
    popular: false,
    features: [
      "Todas as features liberadas",
      "Suporte prioritário no WhatsApp",
      "Renovação manual",
      "Registro em até 2 dispositivos",
    ],
    missing: [],
  },
]

export function Pricing() {
  return (
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
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative flex flex-col rounded-2xl border p-6 transition hover:-translate-y-1 ${
                plan.popular
                  ? "border-white/20 shadow-2xl"
                  : "border-white/5"
              }`}
              style={{
                background: plan.popular
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(45, 212, 191, 0.05))'
                  : 'rgba(255,255,255,0.03)',
                boxShadow: plan.popular ? '0 0 60px rgba(168, 85, 247, 0.25)' : undefined,
              }}
            >
              {plan.popular && (
                <div className="absolute -right-8 top-5 z-10 rotate-45">
                  <span className="inline-flex items-center rounded-full bg-gradient-brand px-5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                    Popular
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{plan.days}</p>
                <div className="mt-4">
                  <span className="text-4xl font-black" style={{ color: 'var(--text)' }}>{plan.price}</span>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text)' }}>
                    <Check className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--brand-green)' }} />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                    <X className="mt-0.5 size-4 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex-1" />

              <a
                href="https://wa.me/5511949643494?text=Quero%20adquirir%20o%20plano%20TRY%207"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-all ${
                  plan.popular
                    ? "bg-gradient-brand text-white shadow-lg hover:opacity-95"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
                style={plan.popular ? { boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)' } : undefined}
              >
                {plan.popular ? "Escolher Plano" : "Escolher Plano"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
