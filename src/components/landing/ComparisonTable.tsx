import { Check, X } from "lucide-react"

const rows = [
  { label: "Créditos ilimitados", free: false, ultra: true },
  { label: "Multi-dispositivo (até 2)", free: false, ultra: true },
  { label: "Refino automático de prompts", free: false, ultra: true },
  { label: "Raciocínio profundo", free: false, ultra: true },
  { label: "Edição visual instantânea", free: false, ultra: true },
  { label: "Comando por voz", free: false, ultra: true },
  { label: "Contexto com imagens e PDFs", free: false, ultra: true },
  { label: "Modo white-label", free: false, ultra: true },
  { label: "Mentor de IA 24/7", free: false, ultra: true },
  { label: "Ecossistema de skills", free: false, ultra: true },
  { label: "Suporte via WhatsApp", free: false, ultra: true },
  { label: "Suporte prioritário", free: false, ultra: true },
]

export function ComparisonTable() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
          Ultra Chat vs. {""}
          <span style={{ color: 'var(--muted)' }}>Lovable padrão</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: 'var(--muted)' }}>
          Compare os recursos e veja o que você ganha ao escolher a extensão.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-12 gap-0 text-sm">
            <div className="col-span-6 border-r px-4 py-3 text-xs font-bold uppercase tracking-wider md:col-span-7" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
              Funcionalidades
            </div>
            <div className="col-span-3 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Grátis
            </div>
            <div className="col-span-3 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider md:col-span-2" style={{ color: 'var(--brand-green)' }}>
              Ultra Chat
            </div>
          </div>

          {rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-12 gap-0 border-t text-sm" style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="col-span-6 border-r px-4 py-3.5 md:col-span-7" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}>
                {r.label}
              </div>
              <div className="col-span-3 flex items-center justify-center px-4 py-3.5">
                {r.free ? <Check className="size-4" style={{ color: 'var(--brand-green)' }} /> : <X className="size-4" style={{ color: 'rgba(255,255,255,0.15)' }} />}
              </div>
              <div className="col-span-3 flex items-center justify-center px-4 py-3.5 md:col-span-2">
                <div className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-2 py-0.5 text-xs font-bold text-white">
                  ✓
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
