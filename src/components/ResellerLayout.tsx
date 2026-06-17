import { type ReactNode } from 'react'
import ResellerSidebar from './ResellerSidebar'

interface ResellerLayoutProps {
  children: ReactNode
  currentPage: string
}

export default function ResellerLayout({ children, currentPage }: ResellerLayoutProps) {
  return (
    <div className="admin-layout">
      <ResellerSidebar currentPage={currentPage} />
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

        .admin-sidebar.collapsed ~ .admin-content {
          margin-left: 72px;
        }

        @media (max-width: 1023px) {
          .admin-content {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  )
}
