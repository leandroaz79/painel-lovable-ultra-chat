import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, X, MessageCircleHeart, LayoutDashboard } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

const links = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#tutorial", label: "Tutorial" },
  { href: "#planos", label: "Planos" },
]

function dashboardPath(role: string | null) {
  if (role === 'admin') return '/admin'
  if (role === 'reseller') return '/reseller'
  return '/user'
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, role, loading } = useAuth()
  const isLoggedIn = !loading && !!user

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5" style={{ background: 'rgba(5, 11, 18, 0.82)', backdropFilter: 'blur(22px)' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-lg" style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}>
            <MessageCircleHeart className="size-5 text-white" />
          </span>
          <span className="truncate text-base font-extrabold tracking-tight sm:text-lg" style={{ color: 'var(--text)' }}>
            Lovable<span className="text-gradient-brand"> Ultra Chat</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm transition hover:bg-white/5"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <button
              onClick={() => navigate(dashboardPath(role))}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-sm font-bold text-white shadow-lg hover:opacity-95 transition-all"
              style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}
            >
              <LayoutDashboard className="size-4" />
              Painel
            </button>
          ) : (
            <>
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login') }}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                style={{ color: 'var(--muted)' }}>
                Entrar
              </a>
              <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}
                className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2 text-sm font-bold text-white shadow-lg hover:opacity-95 transition-all"
                style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}>
                Começar grátis
              </a>
            </>
          )}
        </div>

        <button
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 md:hidden"
          style={{ color: 'var(--text)' }}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 md:hidden" style={{ background: 'rgba(5, 11, 18, 0.95)' }}>
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm transition hover:bg-white/5"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              >
                {l.label}
              </a>
            ))}
            {isLoggedIn ? (
              <button
                onClick={() => { setOpen(false); navigate(dashboardPath(role)) }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-sm font-bold text-white mt-2 transition-all"
                style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}
              >
                <LayoutDashboard className="size-4" />
                Painel
              </button>
            ) : (
              <a href="/signup" onClick={(e) => { e.preventDefault(); setOpen(false); navigate('/signup') }}
                className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2 text-sm font-bold text-white mt-2 transition-all"
                style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}>
                Começar grátis
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
