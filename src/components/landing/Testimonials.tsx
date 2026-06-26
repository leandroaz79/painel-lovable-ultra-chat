const testimonials = [
  {
    name: "Matheus L.",
    role: "Designer de Produto",
    text: "A extensão mudou meu fluxo. Editar o visual diretamente na página sem descrever caminhos no chat é muito mais rápido.",
  },
  {
    name: "Rafaela M.",
    role: "CTO",
    text: "Uso Lovable todo dia e o Ultra Chat resolve o que mais me travava — os prompts longos. Agora é um clique e pronto.",
  },
  {
    name: "Lucas A.",
    role: "Full Stack Developer",
    text: "A skill de raciocínio profundo resolveu bugs que eu levaria horas debugando. Recomendo para quem quer produtividade real.",
  },
  {
    name: "Carla S.",
    role: "Product Manager",
    text: "White-label e mentor de IA são os diferenciais. Entrego para o cliente sem branding do Lovable e ainda tenho um sênior me guiando.",
  },
  {
    name: "Gustavo R.",
    role: "Indie Hacker",
    text: "Comprei o ULTRA 30 e já valeu na primeira semana. O limite sumiu — testei dezenas de variações sem pensar em créditos.",
  },
  {
    name: "Tatiane D.",
    role: "UX Writer",
    text: "As skills de SEO e Copy me ajudam a alinhar tom de voz com código. A IA entende que o texto precisa ser persuasivo dentro do layout.",
  },
]

const stars = Array.from({ length: 5 })

export function Testimonials() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
            Quem usa <span className="text-gradient-brand">aprova</span>
          </h2>
          <p className="mt-4" style={{ color: 'var(--muted)' }}>
            Veja o que a comunidade está falando sobre o Ultra Chat.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card rounded-2xl p-6 transition hover:-translate-y-1">
              <div className="flex gap-1">
                {stars.map((_, i) => (
                  <span key={i} className="text-base">★</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                "{t.text}"
              </p>
              <div className="mt-5 flex items-center gap-3 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="grid size-9 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
