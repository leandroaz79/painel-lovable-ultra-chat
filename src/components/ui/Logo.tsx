import { MessageCircleHeart } from "lucide-react"

type LogoVariant = "landing" | "admin" | "reseller" | "user" | "login"

const variantConfig: Record<LogoVariant, { icon: React.ReactNode; text: React.ReactNode; label: string }> = {
  landing: {
    icon: <MessageCircleHeart className="size-5 text-white" />,
    text: <>Lovable<span className="text-gradient-brand"> Ultra Chat</span></>,
    label: "Lovable Ultra Chat",
  },
  admin: {
    icon: <MessageCircleHeart className="size-5 text-white" />,
    text: <>Ultra<span style={{ color: 'var(--accent)' }}>Admin</span></>,
    label: "Ultra Admin",
  },
  reseller: {
    icon: <MessageCircleHeart className="size-5 text-white" />,
    text: <>Ultra<span style={{ color: 'var(--accent)' }}>Revenda</span></>,
    label: "Ultra Revenda",
  },
  user: {
    icon: <MessageCircleHeart className="size-5 text-white" />,
    text: <>Ultra<span style={{ color: 'var(--accent)' }}>Chat</span></>,
    label: "Ultra Chat",
  },
  login: {
    icon: <MessageCircleHeart className="size-5 text-white" />,
    text: <>Ultra<span style={{ color: 'var(--accent)' }}>Admin</span></>,
    label: "Ultra Admin",
  },
}

interface LogoProps {
  variant?: LogoVariant
  href?: string
  className?: string
  showText?: boolean
}

export function Logo({ variant = "landing", href, className = "", showText = true }: LogoProps) {
  const { icon, text, label } = variantConfig[variant]

  const inner = (
    <>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand"
        style={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.3)" }}
      >
        {icon}
      </span>
      {showText && (
        <span className="truncate text-base font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          {text}
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <a href={href} className={`flex items-center gap-2 ${className}`} aria-label={label}>
        {inner}
      </a>
    )
  }

  return <div className={`flex items-center gap-2 ${className}`}>{inner}</div>
}