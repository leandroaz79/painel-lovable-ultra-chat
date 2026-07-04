import { MessageCircleHeart } from "lucide-react"

const WHATSAPP_URL = "https://wa.me/556781880921?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Ultra%20Chat"

const sections = [
  {
    title: "Produto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Planos e Preços", href: "#planos" },
      { label: "Tutorial", href: "#tutorial" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "WhatsApp", href: WHATSAPP_URL, external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t py-16" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <a href="#top" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand shadow-lg" style={{ boxShadow: '0 0 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)' }}>
                <MessageCircleHeart className="size-5 text-white" />
              </span>
              <span className="text-base font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                Lovable<span className="text-gradient-brand"> Ultra Chat</span>
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              A extensão Chrome que tira o teto do seu fluxo no Lovable e devolve o que realmente importa: criar sem limites.
            </p>
          </div>

          {sections.map((s) => (
            <div key={s.title}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)', margin: 0 }}>{s.title}</p>
              <ul className="mt-4 space-y-2.5">
                {s.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm transition hover:opacity-80"
                      style={{ color: 'rgba(255,255,255,0.5)', minHeight: '44px', display: 'flex', alignItems: 'center' }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center text-sm sm:flex-row sm:text-left" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
          <span>© 2026 Lovable Ultra Chat. Todos os direitos reservados.</span>
          <span>Feito com 💜 para criadores Lovable</span>
        </div>
      </div>
    </footer>
  )
}
