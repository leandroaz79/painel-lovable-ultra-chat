import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import MobileMenu from '../../components/MobileMenu'
import AdminLayout from '../../components/AdminLayout'
import BrandingGenerator from '../../components/BrandingGenerator'
import TemplateManager from '../../components/TemplateManager'

export default function AdminBranding() {
  const { user } = useAuth()

  return (
    <AdminLayout currentPage="/admin/branding">
      <header className="topbar">
        <MobileMenu currentPage="/admin/branding" />
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
            <h1>Branding da Extensão</h1>
            <p>Gere uma cópia da extensão com a marca, logo e cores da sua empresa.</p>
          </div>
        </section>

        <BrandingGenerator />

        <TemplateManager />
      </div>
    </AdminLayout>
  )
}
