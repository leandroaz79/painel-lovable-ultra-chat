import { MessageCircleHeart } from "lucide-react"

const sections = [
  {
    title: "Produto",
    links: ["Funcionalidades", "Planos", "Preços", "Tutorial"],
  },
  {
    title: "Empresa",
    links: ["Sobre", "Blog", "Carreiras", "Contato"],
  },
  {
    title: "Suporte",
    links: ["FAQ", "WhatsApp", "Central de Ajuda", "Status"],
  },
  {
    title: "Legal",
    links: ["Termos de Uso", "Privacidade", "Cookies", "LGPD"],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t py-16" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <a href="#top" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand shadow-lg" style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}>
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
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{s.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {s.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm transition hover:opacity-80" style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center text-sm sm:flex-row sm:text-left" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
          <span>© 2025 Lovable Ultra Chat. Todos os direitos reservados.</span>
          <span>Feito com 💜 para criadores Lovable</span>
        </div>
      </div>
    </footer>
  )
}
