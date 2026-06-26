import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Logo } from './ui/Logo'
import MobileMenu from './MobileMenu'

interface AdminTopbarProps {
  currentPage: string
}

const navLinks = [
  { href: '/admin', label: 'Painel' },
  { href: '/admin#licenses', label: 'Licenças' },
  { href: '/admin/customers', label: 'Clientes' },
  { href: '/admin/resellers', label: 'Revendedores' },
  { href: '/admin/sales', label: 'Vendas' },
  { href: '/admin/products', label: 'Tabela de Preços' },
  { href: '/admin/endcustomer-products', label: 'Planos' },
  { href: '/admin/customer-purchases', label: 'Compras' },
  { href: '/admin/branding', label: 'Branding' },
  { href: '/admin/theme', label: 'Tema' },
]

export default function AdminTopbar({ currentPage }: AdminTopbarProps) {
  const { user } = useAuth()

  return (
    <header className="topbar">
      <MobileMenu currentPage={currentPage} />
      <Logo variant="admin" href="/admin" />
      <nav className="nav-links" aria-label="Navegação principal">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={currentPage === link.href ? { color: 'var(--text)' } : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="session-box">
        <span>{user?.email || 'Carregando...'}</span>
        <Button variant="ghost" onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</Button>
      </div>
    </header>
  )
}
