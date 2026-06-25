import { MessageCircle } from "lucide-react";

export function WhatsAppFAB() {
  return (
    <a
      href="#planos"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 transition hover:scale-105"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
