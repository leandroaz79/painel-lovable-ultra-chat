import { type ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'

interface AdminLayoutProps {
  children: ReactNode
  currentPage: string
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      {/* Sidebar Desktop */}
      <AdminSidebar currentPage={currentPage} />
      
      {/* Content Area */}
      <div className="admin-content">
        {children}
      </div>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .admin-content {
          flex: 1;
          margin-left: 240px;
          transition: margin-left 0.3s ease;
        }

        /* Quando sidebar está colapsada */
        .admin-sidebar.collapsed ~ .admin-content {
          margin-left: 72px;
        }

        /* Mobile: sem margin (sidebar oculta) */
        @media (max-width: 1023px) {
          .admin-content {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  )
}
