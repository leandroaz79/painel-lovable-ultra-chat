import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import BrandingGenerator from '../../components/BrandingGenerator'
import TemplateManager from '../../components/TemplateManager'

export default function AdminBranding() {
  return (
    <AdminLayout currentPage="/admin/branding">
      <AdminTopbar currentPage="/admin/branding" />

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
