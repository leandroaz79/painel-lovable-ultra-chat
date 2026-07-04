import { useNavigate } from "react-router-dom"
import { Zap, ShieldCheck, Headphones } from "lucide-react"

export function FinalCTA() {
  const navigate = useNavigate()

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div
          className="relative overflow-hidden rounded-3xl border p-8 text-center md:p-16"
          style={{
            borderColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12)',
            background: 'linear-gradient(135deg, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.08), rgba(109, 232, 255, 0.04), rgba(109, 232, 255, 0.06))',
          }}
        >
          <div className="absolute -left-20 -top-20 size-60 rounded-full bg-gradient-brand opacity-15 blur-3xl" />

          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
            Pronto para criar sem barreiras?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl" style={{ color: 'var(--muted)' }}>
            Junte-se a centenas de criadores que já turbinaram o Lovable e ganhe horas de produtividade todos os dias.
          </p>

          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}
              className="inline-flex items-center justify-center h-14 rounded-full bg-gradient-brand px-8 text-base font-bold text-white shadow-xl hover:opacity-95 transition-all"
              style={{ boxShadow: '0 10px 50px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.22)' }}>
              Liberar poder ilimitado
            </a>
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}
              className="inline-flex items-center justify-center h-14 rounded-full border border-white/15 bg-white/5 px-8 text-base font-semibold backdrop-blur hover:bg-white/10 transition-all"
              style={{ color: 'var(--text)' }}>
              Teste grátis por 30 min →
            </a>
          </div>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="inline-flex items-center gap-2">
              <Zap className="size-4" style={{ color: 'var(--accent)' }} /> Ativação imediata
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" style={{ color: 'var(--accent)' }} /> Pagamento seguro via Pix
            </span>
            <span className="inline-flex items-center gap-2">
              <Headphones className="size-4" style={{ color: 'var(--accent)' }} /> Suporte dedicado
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
