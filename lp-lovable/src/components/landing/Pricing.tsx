import { Check, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";


type Plan = {
  name: string;
  description: string;
  reviews: number;
  oldPrice: string;
  price: string;
  perDay: string;
  duration: string;
  discount: string;
  ribbon?: string;
  highlight?: boolean;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Professional",
    description:
      "Perfeito para quem quer experimentar a extensão e acelerar pequenos projetos.",
    reviews: 562,
    oldPrice: "R$ 79,90",
    price: "R$ 39,90",
    perDay: "Apenas R$ 5,70 / dia",
    duration: "7 dias",
    discount: "-50%",
    ribbon: "Ideal para testar",
    features: [
      "Comandos 100% ilimitados",
      "Chat Inteligente Pro",
      "Upload ilimitado de arquivos",
      "Tutorial guiado de instalação",
      "Suporte humano 24/7",
    ],
    cta: "Ativar 7 dias",
  },
  {
    name: "Business",
    description:
      "O equilíbrio ideal entre prazo e produtividade para quem entrega projetos toda semana.",
    reviews: 255,
    oldPrice: "R$ 99,90",
    price: "R$ 69,90",
    perDay: "Apenas R$ 4,66 / dia",
    duration: "15 dias",
    discount: "-30%",
    ribbon: "Mais escolhido",
    highlight: true,
    features: [
      "Tudo do plano Professional",
      "Atalhos rápidos de produtividade",
      "+15 skills premium Ultra Chat",
      "Prioridade no fluxo de comandos",
      "Suporte prioritário VIP",
    ],
    cta: "Escolher 15 dias",
  },
  {
    name: "Ultra Pro",
    description:
      "A experiência completa para quem vive de criação e quer o menor valor diário.",
    reviews: 152,
    oldPrice: "R$ 149,90",
    price: "R$ 99,90",
    perDay: "Apenas R$ 3,33 / dia",
    duration: "30 dias",
    discount: "-33%",
    ribbon: "Melhor custo-benefício",
    features: [
      "Tudo do plano Business",
      "Performance ultra-otimizada",
      "Suporte VIP dedicado",
      "Acesso vitalício às atualizações",
      "Menor valor diário garantido",
    ],
    cta: "Ativar 30 dias",
  },
];

export function Pricing() {
  return (
    <section id="planos" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Planos que cabem no{" "}
            <span className="text-gradient-brand">seu momento</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Flexíveis para você testar, criar e entregar mais — sem
            mensalidade obrigatória.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={[
                "relative flex flex-col rounded-3xl p-7 transition",
                p.highlight
                  ? "border-glow bg-[oklch(0.22_0.06_290)] lg:scale-[1.04]"
                  : "glass-card",
              ].join(" ")}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                    p.highlight
                      ? "bg-gradient-brand text-white"
                      : "bg-white/10 text-foreground",
                  ].join(" ")}
                >
                  {p.ribbon}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {p.discount}
                </span>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>({p.reviews} avaliações)</span>
                </div>
              </div>

              <h3 className="mt-4 text-2xl font-extrabold">
                Plano {p.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.description}
              </p>

              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {p.oldPrice}
                  </span>
                  <span className="text-xs font-semibold text-emerald-300">
                    economia ativa
                  </span>
                </div>
                <div className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">
                  {p.price}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {p.perDay} · sem fidelidade
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-brand">
                      <Check className="size-3 text-white" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Button
                  asChild
                  size="lg"
                  className={[
                    "h-12 w-full rounded-full text-base font-bold",
                    p.highlight
                      ? "bg-gradient-brand text-white shadow-xl shadow-brand-purple/30 hover:opacity-95"
                      : "bg-white/10 text-foreground hover:bg-white/15",
                  ].join(" ")}
                >
                  <Link to="/auth" search={{ mode: "signup" }}>{p.cta}</Link>
                </Button>

                <div className="mt-3 space-y-1 text-center text-xs text-muted-foreground">
                  <div>Pagamento seguro via Pix</div>
                  <div>Liberação rápida após confirmação</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
          Compra segura via Pix • Acesso liberado após confirmação • Suporte
          completo para ativação
        </p>
      </div>
    </section>
  );
}
