import { Check, Minus } from "lucide-react";

const rows: Array<[string, string, string]> = [
  ["Ativação rápida", "Incluído", "Nem sempre"],
  ["Teste grátis", "Incluído", "Raramente"],
  ["Tutorial de instalação", "Passo a passo", "Pouco claro"],
  ["Suporte humano para ativação", "Incluído", "Limitado"],
  ["Skills inclusas", "+15 prontas", "Variável"],
  ["Recursos avançados", "Completo", "Básico"],
  ["Planos flexíveis", "7, 15 e 30 dias", "Mensalidade fixa"],
  ["Experiência premium", "Incluída", "Nem sempre"],
];

export function ComparisonTable() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Mais que uma chave: uma{" "}
            <span className="text-gradient-brand">experiência completa</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Lovable Ultra Chat junta ativação rápida, recursos avançados e
            suporte de verdade para você começar com tudo no lugar.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Recurso</th>
                  <th className="px-5 py-4 text-center">
                    <span className="text-gradient-brand">
                      Lovable Ultra Chat
                    </span>
                  </th>
                  <th className="px-5 py-4 text-center">Extensões comuns</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, ours, theirs], i) => (
                  <tr
                    key={label}
                    className={
                      i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                    }
                  >
                    <td className="px-5 py-3 font-medium">{label}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-emerald-300">
                        <Check className="size-4" /> {ours}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Minus className="size-4" /> {theirs}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
