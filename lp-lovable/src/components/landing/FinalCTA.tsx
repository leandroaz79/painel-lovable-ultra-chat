import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";


export function FinalCTA() {
  return (
    <section className="px-4 pb-24 md:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.22_0.06_290)] p-8 text-center md:p-14">
        <div className="absolute -inset-1 -z-10 bg-hero-radial opacity-90" />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ainda na dúvida?
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Comece agora com o{" "}
          <span className="text-gradient-brand">teste grátis</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Explore todos os recursos do Lovable Ultra Chat sem compromisso e
          sinta na prática a diferença no seu fluxo de criação.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full bg-gradient-brand px-7 text-base font-bold text-white shadow-xl shadow-brand-purple/30 hover:opacity-95"
          >
            <Link to="/auth" search={{ mode: "signup" }}>Começar teste grátis</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-white/15 bg-white/5 px-7 text-base font-semibold backdrop-blur hover:bg-white/10"
          >
            <a href="#planos">Ver planos</a>
          </Button>

        </div>
      </div>
    </section>
  );
}
