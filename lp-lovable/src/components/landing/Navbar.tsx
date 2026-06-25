import { useState } from "react";
import { Menu, X, MessageCircleHeart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#tutorial", label: "Tutorial" },
  { href: "#planos", label: "Planos" },
];


export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-lg shadow-brand-purple/30">
            <MessageCircleHeart className="size-5 text-white" />
          </span>
          <span className="truncate text-base font-extrabold tracking-tight sm:text-lg">
            Lovable<span className="text-gradient-brand"> Ultra Chat</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild className="rounded-full">
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-gradient-brand text-white shadow-lg shadow-brand-purple/30 hover:opacity-95"
          >
            <Link to="/auth" search={{ mode: "signup" }}>Começar grátis</Link>
          </Button>

        </div>

        <button
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-background/95 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Button
              asChild
              className="mt-2 rounded-full bg-gradient-brand text-white"
            >
              <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>
                Começar grátis
              </Link>
            </Button>

          </div>
        </div>
      )}
    </header>
  );
}
