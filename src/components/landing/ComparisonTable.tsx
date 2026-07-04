import { Check, X } from "lucide-react"

const rows = [
  { label: "Créditos ilimitados", free: false, ultra: true },
  { label: "Uso em até 1 dispositivo", free: false, ultra: true },
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

        <div className="mt-10 overflow-x-auto rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="min-w-[480px] w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="border-r px-4 py-3 text-left text-xs font-bold uppercase tracking-wider md:w-[58%]" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                  Funcionalidades
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Grátis
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Ultra Chat
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <td className="border-r px-4 py-3.5" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}>
                    {r.label}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {r.free ? <Check className="size-4 inline" style={{ color: 'var(--accent)' }} aria-label="Sim" /> : <X className="size-4 inline" style={{ color: 'rgba(255,255,255,0.15)' }} aria-label="Não" />}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-2 py-0.5 text-xs font-bold text-white" aria-label="Sim">
                      ✓
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </section>
  )
}
