import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: 'success' | 'error') => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastIdCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3600)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div 
        style={{
          position: 'fixed',
          right: '22px',
          bottom: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999,
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              maxWidth: '420px',
              padding: '14px 18px',
              borderRadius: '16px',
              color: 'var(--text)',
              background: toast.type === 'error' 
                ? 'rgba(255, 61, 85, 0.12)' 
                : 'var(--card-strong)',
              border: toast.type === 'error'
                ? '1px solid rgba(255,61,85,.42)'
                : '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              animation: 'slideUp 0.3s ease',
              fontSize: '14px',
              lineHeight: '1.4',
            }}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
