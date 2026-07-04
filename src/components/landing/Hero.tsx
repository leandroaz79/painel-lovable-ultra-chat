import { useNavigate } from "react-router-dom"
import { Zap, ShieldCheck, MessageCircle, RefreshCcw } from "lucide-react"

const avatars = [11, 12, 13, 14, 15].map(
  (n) => `https://i.pravatar.cc/120?u=ultra-${n}`,
)

export function Hero() {
  const navigate = useNavigate()

  return (
    <section id="top" className="relative overflow-hidden bg-hero-radial">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pt-10 pb-16 md:gap-12 md:px-6 md:pt-24 md:pb-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur sm:text-left" style={{ color: 'var(--muted)' }}>
            <Zap className="size-3.5" style={{ color: 'var(--accent)' }} />
            Extensão para navegadores
          </span>

          <h1 className="mt-5 text-center text-balance text-4xl font-black leading-[1.1] tracking-tight sm:text-left sm:text-5xl md:text-6xl lg:text-7xl" style={{ color: 'var(--text)' }}>
            Use o Lovable com{" "}
            <span className="text-gradient-brand">poder ilimitado</span>{" "}
            e crie <span className="text-gradient-brand">sem barreiras</span>.
          </h1>

          <p className="mt-6 max-w-xl text-center text-base sm:text-left sm:text-lg" style={{ color: 'var(--muted)' }}>
            O Lovable Ultra Chat é a extensão Chrome que tira o teto do seu
            fluxo no Lovable: automatize prompts, edite a interface com um
            clique e converse com a IA sem queimar créditos.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}
              className="inline-flex items-center justify-center h-14 rounded-full bg-gradient-brand px-7 text-base font-bold text-white shadow-xl hover:opacity-95 transition-all"
              style={{ boxShadow: '0 10px 40px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)' }}>
              Liberar poder ilimitado
            </a>
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}
              className="inline-flex items-center justify-center h-14 rounded-full border border-white/15 bg-white/5 px-7 text-base font-semibold backdrop-blur hover:bg-white/10 transition-all"
              style={{ color: 'var(--text)' }}>
              Teste grátis por 30 min →
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="size-9 rounded-full border-2 object-cover"
                    style={{ borderColor: 'var(--bg)' }}
                  />
                ))}
              </div>
              <span className="ml-3 text-sm" style={{ color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--text)' }}>+800</strong> criadores
                ativos
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(109, 232, 255, 0.15)', background: 'rgba(109, 232, 255, 0.08)', color: 'var(--accent)' }}>
              <ShieldCheck className="size-4" /> 100% seguro e confiável
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 text-center text-sm sm:grid-cols-3 sm:text-left" style={{ color: 'var(--muted)' }}>
            <div className="inline-flex items-center gap-2">
              <Zap className="size-4" style={{ color: 'var(--accent)' }} /> Ativação em segundos
            </div>
            <div className="inline-flex items-center gap-2">
              <MessageCircle className="size-4" style={{ color: 'var(--accent)' }} /> Suporte por WhatsApp
            </div>
            <div className="inline-flex items-center gap-2">
              <RefreshCcw className="size-4" style={{ color: 'var(--accent)' }} /> Sem renovação automática
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center hidden lg:flex">
          <img
            src="/hero-preview.png"
            alt="Lovable Ultra Chat preview"
            className="w-4/5 sm:w-3/5 max-w-xs rounded-2xl shadow-2xl"
            style={{ boxShadow: '0 0 50px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.18)' }}
            loading="eager"
          />
        </div>
      </div>
    </section>
  )
}
