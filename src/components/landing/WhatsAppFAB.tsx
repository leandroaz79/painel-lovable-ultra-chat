import { MessageCircle } from "lucide-react"

export function WhatsAppFAB() {
  return (
    <a
      href="https://wa.me/5511949643494"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-full bg-gradient-brand text-white shadow-2xl transition hover:scale-110"
      style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="size-7" />
    </a>
  )
}
