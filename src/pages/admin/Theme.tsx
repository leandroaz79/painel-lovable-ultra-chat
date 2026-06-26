import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import ThemeCustomizer from '../../components/ThemeCustomizer'

export default function AdminTheme() {
  return (
    <AdminLayout currentPage="/admin/theme">
      <AdminTopbar currentPage="/admin/theme" />

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
