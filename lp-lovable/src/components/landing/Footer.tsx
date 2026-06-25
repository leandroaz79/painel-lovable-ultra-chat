import { MessageCircleHeart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/60 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand">
              <MessageCircleHeart className="size-5 text-white" />
            </span>
            <span className="text-lg font-extrabold">
              Lovable<span className="text-gradient-brand"> Ultra Chat</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A extensão definitiva para quem leva a criação no Lovable a sério.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Navegação
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a className="hover:text-foreground/90" href="#funcionalidades">
                Funcionalidades
              </a>
            </li>
            <li>
              <a className="hover:text-foreground/90" href="#planos">
                Planos
              </a>
            </li>
            <li>
              <a className="hover:text-foreground/90" href="#tutorial">
                Tutorial
              </a>
            </li>
            <li>
              <a className="hover:text-foreground/90" href="#faq">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Suporte
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>WhatsApp 24/7</li>
            <li>Tutorial guiado</li>
            <li>contato@lovableultrachat.app</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lovable Ultra Chat. Todos os direitos
        reservados.
      </div>
    </footer>
  );
}
