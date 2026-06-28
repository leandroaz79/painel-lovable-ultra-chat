import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Key, Users, Store, DollarSign, Tag, Palette, Paintbrush, Gem, ShoppingCart, Settings, LogOut } from 'lucide-react'
import { Logo } from './ui/Logo'

interface AdminSidebarProps {
  currentPage: string
}

const sections = [
  {
    label: 'Geral',
    items: [
      { href: '/admin', icon: 'dashboard', label: 'Painel', key: '/admin' },
      { href: '/admin#licenses', icon: 'licenses', label: 'Licenças', key: '/admin#licenses' },
      { href: '/admin/customers', icon: 'customers', label: 'Clientes', key: '/admin/customers' },
    ],
  },
  {
    label: 'Revendedores',
    items: [
      { href: '/admin/products', icon: 'products', label: 'Tabela de Preços', key: '/admin/products' },
      { href: '/admin/resellers', icon: 'resellers', label: 'Revendedores', key: '/admin/resellers' },
      { href: '/admin/sales', icon: 'sales', label: 'Vendas', key: '/admin/sales' },
    ],
  },
  {
    label: 'Clientes Finais',
    items: [
      { href: '/admin/endcustomer-products', icon: 'plans', label: 'Planos', key: '/admin/endcustomer-products' },
      { href: '/admin/customer-purchases', icon: 'purchases', label: 'Compras', key: '/admin/customer-purchases' },
    ],
  },
  {
    label: 'Personalização',
    items: [
      { href: '/admin/branding', icon: 'branding', label: 'Branding', key: '/admin/branding' },
      { href: '/admin/theme', icon: 'theme', label: 'Tema', key: '/admin/theme' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/profile', icon: 'profile', label: 'Perfil', key: '/profile' },
    ],
  },
]

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <BarChart3 size={20} />,
  licenses: <Key size={20} />,
  customers: <Users size={20} />,
  resellers: <Store size={20} />,
  sales: <DollarSign size={20} />,
  products: <Tag size={20} />,
  plans: <Gem size={20} />,
  purchases: <ShoppingCart size={20} />,
  branding: <Palette size={20} />,
  theme: <Paintbrush size={20} />,
  profile: <Settings size={20} />,
}

export default function AdminSidebar({ currentPage }: AdminSidebarProps) {
  const { user, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Logo variant="admin" href="/admin" showText={!isCollapsed} />
          <button 
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.label} className="sidebar-section">
              {!isCollapsed && <span className="sidebar-section-label">{section.label}</span>}
              {section.items.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className={`sidebar-item ${currentPage === item.key ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="sidebar-icon" aria-hidden="true">{iconMap[item.icon]}</span>
                  {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            {!isCollapsed && (
              <div className="user-info">
                <strong>{user?.email?.split('@')[0] || 'Admin'}</strong>
                <small>{user?.email || 'admin@ultra.com'}</small>
              </div>
            )}
          </div>
          <button 
            className="sidebar-logout"
            onClick={() => signOut()}
            title={isCollapsed ? 'Sair' : ''}
          >
            <span className="sidebar-icon" aria-hidden="true"><LogOut size={20} /></span>
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-section {
          margin-bottom: 8px;
        }
        .sidebar-section-label {
          display: block;
          padding: 12px 20px 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          opacity: 0.5;
        }
      `}</style>
    </>
  )
}
