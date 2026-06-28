import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Key, PlusCircle, Clock, ClipboardList, Palette, Settings, LogOut } from 'lucide-react'
import { Logo } from './ui/Logo'

interface ResellerSidebarProps {
  currentPage: string
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <BarChart3 size={20} />,
  credits: <Key size={20} />,
  createLicense: <PlusCircle size={20} />,
  createTrial: <Clock size={20} />,
  licenses: <ClipboardList size={20} />,
  branding: <Palette size={20} />,
  profile: <Settings size={20} />,
}

export default function ResellerSidebar({ currentPage }: ResellerSidebarProps) {
  const { user, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { href: '/reseller', icon: 'dashboard', label: 'Painel', key: '/reseller' },
    { href: '/reseller#credits', icon: 'credits', label: 'Créditos', key: '/reseller#credits' },
    { href: '/reseller#create-license', icon: 'createLicense', label: 'Gerar licença', key: '/reseller#create-license' },
    { href: '/reseller#create-trial', icon: 'createTrial', label: 'Gerar trial', key: '/reseller#create-trial' },
    { href: '/reseller#licenses', icon: 'licenses', label: 'Licenças', key: '/reseller#licenses' },
    { href: '/reseller/branding', icon: 'branding', label: 'Branding', key: '/reseller/branding' },
    { href: '/profile', icon: 'profile', label: 'Perfil', key: '/profile' },
  ]

  return (
    <>
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Logo variant="reseller" href="/reseller" />
          <button
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

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

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'R'}
            </div>
            {!isCollapsed && (
              <div className="user-info">
                <strong>{user?.email?.split('@')[0] || 'Revendedor'}</strong>
                <small>{user?.email || 'revendedor@ultra.com'}</small>
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