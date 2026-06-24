import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import ThemeCustomizer from '../../components/ThemeCustomizer'

export default function AdminTheme() {
  const { user } = useAuth()

  return (
    <AdminLayout currentPage="/admin/theme">
      <header className="topbar">
        <MobileMenu currentPage="/admin/theme" />
        <a className="brand" href="/admin" aria-label="Ultra Admin">
          <span className="brand-bolt">⚡</span>
          <strong>Ultra<span>Admin</span></strong>
        </a>
        <nav className="nav-links" aria-label="Navegação principal">
          <a href="/admin">Painel</a>
          <a href="/admin#licenses">Licenças</a>
          <a href="/admin/customers">Clientes</a>
          <a href="/admin/resellers">Revendedores</a>
          <a href="/admin/sales">Vendas</a>
          <a href="/admin/products">Produtos</a>
          <a href="/admin/branding">Branding</a>
          <a href="/admin/theme">Tema</a>
        </nav>
        <div className="session-box">
          <span>{user?.email || 'Admin'}</span>
          <Button variant="ghost" onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</Button>
        </div>
      </header>

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Personalização</p>
            <h1>Cores do Sistema</h1>
            <p>Personalize as cores do painel administrativo e da landing page.</p>
          </div>
        </section>

        <ThemeCustomizer />
      </div>
    </AdminLayout>
  )
}
