import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import ResellerMobileMenu from '../../components/ResellerMobileMenu'
import ResellerLayout from '../../components/ResellerLayout'
import BrandingGenerator from '../../components/BrandingGenerator'

export default function ResellerBranding() {
  const { user } = useAuth()

  return (
    <ResellerLayout currentPage="/reseller/branding">
      <header className="topbar">
        <ResellerMobileMenu currentPage="/reseller/branding" />
        <a className="brand" href="/reseller" aria-label="Ultra Revenda">
          <span className="brand-bolt">⚡</span>
          <strong>Ultra<span>Revenda</span></strong>
        </a>
        <nav className="nav-links" aria-label="Navegação principal">
          <a href="/reseller">Painel</a>
          <a href="/reseller#credits">Créditos</a>
          <a href="/reseller#create-license">Gerar licença</a>
          <a href="/reseller#create-trial">Gerar trial</a>
          <a href="/reseller#licenses">Licenças</a>
          <a href="/reseller/branding">Branding</a>
        </nav>
        <div className="session-box">
          <span>{user?.email || 'Revendedor'}</span>
          <Button variant="ghost" onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}>Sair</Button>
        </div>
      </header>

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Personalização</p>
            <h1>Branding da Extensão</h1>
            <p>Gere uma cópia da extensão com a sua marca, logo e cores.</p>
          </div>
        </section>

        <BrandingGenerator />
      </div>
    </ResellerLayout>
  )
}
