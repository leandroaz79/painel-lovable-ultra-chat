import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface ResellerSidebarProps {
  currentPage: string
}

export default function ResellerSidebar({ currentPage }: ResellerSidebarProps) {
  const { user, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { href: '/reseller', icon: '📊', label: 'Painel', key: '/reseller' },
    { href: '/reseller#credits', icon: '🔑', label: 'Créditos', key: '/reseller#credits' },
    { href: '/reseller#create-license', icon: '➕', label: 'Gerar licença', key: '/reseller#create-license' },
    { href: '/reseller#create-trial', icon: '⏱️', label: 'Gerar trial', key: '/reseller#create-trial' },
    { href: '/reseller#licenses', icon: '📋', label: 'Licenças', key: '/reseller#licenses' },
  ]

  return (
    <>
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-bolt">⚡</span>
            {!isCollapsed && <strong>Ultra<span>Revenda</span></strong>}
          </div>
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
              <span className="sidebar-icon">{item.icon}</span>
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
            <span className="sidebar-icon">🚪</span>
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <style>{`
        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 240px;
          background: linear-gradient(180deg, rgba(15, 30, 44, 0.98), rgba(7, 17, 28, 0.95));
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: width 0.3s ease;
        }

        .admin-sidebar.collapsed {
          width: 72px;
        }

        .sidebar-header {
          padding: 20px 16px;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-brand .brand-bolt {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          background: var(--accent);
          color: #000;
          border-radius: 8px;
          font-size: 18px;
          flex-shrink: 0;
        }

        .sidebar-brand strong {
          font-size: 18px;
          color: var(--text);
          white-space: nowrap;
        }

        .sidebar-brand strong span {
          color: var(--accent);
        }

        .sidebar-toggle {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--muted);
          font-size: 16px;
          cursor: pointer;
          transition: 0.2s;
          flex-shrink: 0;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--accent);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          color: var(--muted);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.2s;
          border: 2px solid transparent;
        }

        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }

        .sidebar-item.active {
          background: rgba(157, 255, 47, 0.1);
          color: var(--accent);
          border-color: var(--accent);
        }

        .sidebar-icon {
          font-size: 20px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }

        .sidebar-label {
          white-space: nowrap;
        }

        .collapsed .sidebar-item {
          justify-content: center;
        }

        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: #000;
          display: grid;
          place-items: center;
          font-weight: bold;
          font-size: 16px;
          flex-shrink: 0;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .user-info strong {
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-info small {
          font-size: 11px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 61, 85, 0.1);
          border: 1px solid rgba(255, 61, 85, 0.3);
          border-radius: 10px;
          color: #ff8a98;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
          width: 100%;
        }

        .sidebar-logout:hover {
          background: rgba(255, 61, 85, 0.2);
        }

        .collapsed .sidebar-logout {
          justify-content: center;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 4px;
        }

        @media (max-width: 1023px) {
          .admin-sidebar {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
