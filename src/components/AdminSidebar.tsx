import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Key, Users, Store, DollarSign, Tag, Palette, Paintbrush, Zap, LogOut } from 'lucide-react'
import { Logo } from './ui/Logo'

interface AdminSidebarProps {
  currentPage: string
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <BarChart3 size={20} />,
  licenses: <Key size={20} />,
  customers: <Users size={20} />,
  resellers: <Store size={20} />,
  sales: <DollarSign size={20} />,
  products: <Tag size={20} />,
  branding: <Palette size={20} />,
  theme: <Paintbrush size={20} />,
}

export default function AdminSidebar({ currentPage }: AdminSidebarProps) {
  const { user, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { href: '/admin', icon: 'dashboard', label: 'Painel', key: '/admin' },
    { href: '/admin#licenses', icon: 'licenses', label: 'Licenças', key: '/admin#licenses' },
    { href: '/admin/customers', icon: 'customers', label: 'Clientes', key: '/admin/customers' },
    { href: '/admin/resellers', icon: 'resellers', label: 'Revendedores', key: '/admin/resellers' },
    { href: '/admin/sales', icon: 'sales', label: 'Vendas', key: '/admin/sales' },
    { href: '/admin/products', icon: 'products', label: 'Produtos', key: '/admin/products' },
    { href: '/admin/branding', icon: 'branding', label: 'Branding', key: '/admin/branding' },
    { href: '/admin/theme', icon: 'theme', label: 'Tema', key: '/admin/theme' },
  ]

  return (
    <>
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <Logo variant="admin" href="/admin" />
          <button 
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map(item => (
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
        </nav>

        {/* Footer */}
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
    </>
  )
}