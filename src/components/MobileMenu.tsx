import { useState } from 'react'
import { Logo } from './ui/Logo'

interface MobileMenuProps {
  currentPage?: string
}

const sections = [
  {
    label: 'Geral',
    items: [
      { href: '/admin', label: 'Painel' },
      { href: '/admin#licenses', label: 'Licenças' },
      { href: '/admin/customers', label: 'Clientes' },
    ],
  },
  {
    label: 'Revendedores',
    items: [
      { href: '/admin/products', label: 'Tabela de Preços' },
      { href: '/admin/resellers', label: 'Revendedores' },
      { href: '/admin/sales', label: 'Vendas' },
    ],
  },
  {
    label: 'Clientes Finais',
    items: [
      { href: '/admin/endcustomer-products', label: 'Planos' },
      { href: '/admin/customer-purchases', label: 'Compras' },
    ],
  },
  {
    label: 'Personalização',
    items: [
      { href: '/admin/branding', label: 'Branding' },
      { href: '/admin/theme', label: 'Tema' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/profile', label: 'Perfil' },
    ],
  },
]

export default function MobileMenu({ currentPage }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
        type="button"
      >
        <span className={isOpen ? 'open' : ''}></span>
        <span className={isOpen ? 'open' : ''}></span>
        <span className={isOpen ? 'open' : ''}></span>
      </button>

      {isOpen && (
        <div
          className="mobile-menu-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        />
      )}

      <nav className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Logo variant="admin" href="/admin" />
          <button
            className="mobile-menu-close"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar"
            type="button"
          >
            ✕
          </button>
        </div>

        <ul className="mobile-menu-links">
          {sections.map((section) => (
            <li key={section.label}>
              <span className="mobile-menu-section-label">{section.label}</span>
              <ul>
                {section.items.map((link) => (
                  <li key={link.href}>
                    <a 
                      href={link.href}
                      className={currentPage === link.href ? 'active' : ''}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
          z-index: 1001;
        }

        .mobile-menu-btn span {
          width: 24px;
          height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: 0.3s;
        }

        .mobile-menu-btn span.open:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }

        .mobile-menu-btn span.open:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-btn span.open:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100vh;
          background: linear-gradient(145deg, rgba(15, 30, 44, 0.98), rgba(7, 17, 28, 0.95));
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--line);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
          z-index: 1002;
          transition: left 0.3s ease;
          overflow-y: auto;
        }

        .mobile-menu.open {
          left: 0;
        }

        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1001;
          animation: fadeIn 0.3s ease;
        }

        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
        }

        .mobile-menu-close {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--line);
          border-radius: 50%;
          color: var(--text);
          font-size: 20px;
          cursor: pointer;
        }

        .mobile-menu-links {
          list-style: none;
          padding: 8px 0;
          margin: 0;
        }

        .mobile-menu-links > li {
          margin: 0;
        }

        .mobile-menu-section-label {
          display: block;
          padding: 16px 20px 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          opacity: 0.5;
        }

        .mobile-menu-links ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .mobile-menu-links a {
          display: block;
          padding: 14px 20px;
          color: var(--muted);
          font-size: 15px;
          font-weight: 600;
          border-left: 3px solid transparent;
          transition: 0.2s;
        }

        .mobile-menu-links a:hover,
        .mobile-menu-links a.active {
          color: var(--accent);
          background: rgba(157, 255, 47, 0.08);
          border-left-color: var(--accent);
        }

        @media (max-width: 767px) {
          .mobile-menu-btn {
            display: flex;
          }

          .nav-links {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
