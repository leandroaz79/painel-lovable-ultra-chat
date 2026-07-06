const RESELLER_WHATSAPP_URL =
  'https://wa.me/556781880921?text=Ol%C3%A1!%20Vim%20pelo%20site%20do%20Lovable%20Ultra%20Chat%20e%20quero%20saber%20como%20posso%20me%20tornar%20revendedor%20oficial.'

const resellerBenefits = [
  'Painel exclusivo de revenda',
  'Compra no atacado para revender',
  'Sem mensalidade recorrente',
  'Suporte direto para operação',
]

export function ResellerCTA() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div
          className="relative overflow-hidden rounded-[28px] border px-6 py-8 md:px-9 md:py-10"
          style={{
            borderColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.34)',
            background:
              'linear-gradient(155deg, rgba(12, 24, 38, 0.94), rgba(8, 15, 26, 0.92))',
            boxShadow:
              '0 0 0 1px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.14), 0 28px 90px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-[-8%] w-[38%]"
            style={{
              background:
                'radial-gradient(circle at center, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.16), transparent 68%)',
              filter: 'blur(30px)',
            }}
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(250px,0.75fr)] lg:items-center">
            <div>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]"
                style={{
                  color: '#07110a',
                  background: 'var(--gradient-brand)',
                  boxShadow: '0 10px 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.22)',
                }}
              >
                Plano Revendedor
              </span>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
                Vire <span className="text-gradient-brand">revendedor oficial</span> do Ultra Chat
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg" style={{ color: 'var(--muted)' }}>
                Ative seu painel de revenda, compre licenças no atacado e venda com margem alta.
                Fluxo simples, pagamento único e operação sem mensalidade recorrente.
              </p>

              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 sm:text-base">
                {resellerBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2.5" style={{ color: 'var(--muted)' }}>
                    <span
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-black"
                      style={{
                        color: '#07110a',
                        background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.9)',
                      }}
                    >
                      ✓
                    </span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex flex-col items-start gap-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-6 backdrop-blur md:items-end md:text-right">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted-2)' }}>
                  Condição de entrada
                </p>
                <strong className="mt-2 block text-4xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text)' }}>
                  Pagamento único
                </strong>
                <p className="mt-2 text-sm leading-6 sm:text-base" style={{ color: 'var(--muted)' }}>
                  Fale com nosso time para receber valores, regras de ativação e processo para começar sua operação.
                </p>
              </div>

              <a
                href={RESELLER_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-action inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-6 text-sm font-black uppercase tracking-[0.12em] md:w-auto"
              >
                Quero Ser Revendedor
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
