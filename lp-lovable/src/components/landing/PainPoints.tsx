import { Repeat2, SlidersHorizontal, Gauge } from "lucide-react";

const items = [
  {
    icon: Repeat2,
    title: "Menos repetição",
    desc: "Atalhos inteligentes resolvem em um clique o que você antes refazia toda hora.",
  },
  {
    icon: SlidersHorizontal,
    title: "Mais controle",
    desc: "Manipule arquivos, imagens, elementos e prompts direto na interface do Lovable.",
  },
  {
    icon: Gauge,
    title: "Mais velocidade",
    desc: "Foco total na criação: nada de pausas para reescrever o mesmo comando.",
  },
];

export function PainPoints() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cansado de travar no meio da criação?
          </h2>
          <p className="mt-5 text-muted-foreground">
            Quem usa o Lovable de verdade sabe: repetir prompts, ajustar
            detalhes na mão e perder o ritmo cansa. O Lovable Ultra Chat
            existe para devolver o seu fluxo — mais rápido, mais prático e
            mais produtivo.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card rounded-2xl p-6 transition hover:-translate-y-1"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-white/5">
                <Icon className="size-5 text-brand-pink" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
