import { MessageCircle } from "lucide-react"

export function WhatsAppFAB() {
  return (
    <a
      href="https://wa.me/556781880921?text=Ol%C3%A1!%20Vim%20pelo%20site%20do%20Lovable%20Ultra%20Chat%20e%20preciso%20de%20suporte."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2 text-white transition hover:scale-[1.03]"
      style={{ filter: 'drop-shadow(0 0 26px rgba(168, 85, 247, 0.32))' }}
      aria-label="Fale conosco no WhatsApp"
    >
      <span
        className="grid size-14 place-items-center rounded-full bg-gradient-brand shadow-2xl"
        style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
      >
        <MessageCircle className="size-7" />
      </span>
      <span
        style={{
          fontSize: '11px',
          lineHeight: 1.2,
          color: 'rgba(255,255,255,0.82)',
          textAlign: 'center',
          maxWidth: '112px',
          textWrap: 'balance',
          padding: '6px 10px',
          borderRadius: '999px',
          background: 'rgba(5, 11, 18, 0.72)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
        }}
      >
        Falar com o Suporte
      </span>
    </a>
  )
}
