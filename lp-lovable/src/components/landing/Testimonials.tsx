import { Star } from "lucide-react";

const items = [
  {
    name: "Ricardo M.",
    role: "Desenvolvedor freelancer",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
    quote:
      "Comecei a entregar projetos em metade do tempo. O chat sem consumir crédito sozinho já pagou a assinatura do mês.",
  },
  {
    name: "Ana R.",
    role: "Criadora digital",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80",
    quote:
      "Instalação ridiculamente simples. Em dois minutos eu já estava usando os atalhos rápidos no dia a dia.",
  },
  {
    name: "Felipe S.",
    role: "Líder de agência",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80",
    quote:
      "Testei uma semana e renovei na hora. Meus clientes recebem entregas premium e nem percebem que uso Lovable.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          O que os criadores estão dizendo
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="glass-card flex flex-col rounded-2xl p-6"
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 grow text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img
                  src={t.photo}
                  alt={t.name}
                  loading="lazy"
                  className="size-11 rounded-full border border-white/10 object-cover"
                />
                <div>
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
