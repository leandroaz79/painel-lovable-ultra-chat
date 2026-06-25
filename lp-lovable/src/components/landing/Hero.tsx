import { Zap, ShieldCheck, MessageCircle, RefreshCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppMock } from "./AppMock";


const avatars = [11, 12, 13, 14, 15].map(
  (n) => `https://i.pravatar.cc/120?u=ultra-${n}`,
);

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-hero-radial"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
            <Zap className="size-3.5 text-brand-pink" />
            Extensão para navegadores · ~250ms
          </span>

          <h1 className="mt-5 text-balance text-3xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Use o Lovable com{" "}
            <span className="text-gradient-brand">poder ilimitado</span>{" "}
            e crie <span className="text-gradient-brand">sem barreiras</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            O Lovable Ultra Chat é a extensão Chrome que tira o teto do seu
            fluxo no Lovable: automatize prompts, edite a interface com um
            clique e converse com a IA sem queimar créditos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-gradient-brand px-7 text-base font-bold text-white shadow-xl shadow-brand-purple/30 hover:opacity-95"
            >
              <Link to="/auth" search={{ mode: "signup" }}>Liberar poder ilimitado</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-white/15 bg-white/5 px-7 text-base font-semibold backdrop-blur hover:bg-white/10"
            >
              <Link to="/auth" search={{ mode: "signup" }}>Testar grátis →</Link>
            </Button>

          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="size-9 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span className="ml-3 text-sm text-muted-foreground">
                <strong className="text-foreground">+800</strong> criadores
                ativos
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="size-4" /> 100% seguro e confiável
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="inline-flex items-center gap-2">
              <Zap className="size-4 text-brand-pink" /> Ativação em segundos
            </div>
            <div className="inline-flex items-center gap-2">
              <MessageCircle className="size-4 text-brand-pink" /> Suporte por
              WhatsApp
            </div>
            <div className="inline-flex items-center gap-2">
              <RefreshCcw className="size-4 text-brand-pink" /> Sem renovação
              automática
            </div>
          </div>
        </div>

        <div className="relative">
          <AppMock />
        </div>
      </div>
    </section>
  );
}
