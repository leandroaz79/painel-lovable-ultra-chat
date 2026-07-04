import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/button'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  children?: React.ReactNode
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  isDangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Criar ou obter portal container fora do app root
    let container = document.getElementById('dialog-portal')
    if (!container) {
      container = document.createElement('div')
      container.id = 'dialog-portal'
      document.body.appendChild(container)
    }
    setPortalElement(container)

    return () => {
      // Container compartilhado entre múltiplas instâncias — não remover
    }
  }, [])

  if (!isOpen || !portalElement) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
        role="presentation"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Modal Container */}
      <div
        className="relative z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor: 'var(--card-strong)',
          borderColor: 'var(--line)',
          borderWidth: '1px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
          maxWidth: '32rem',
          width: '100%',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.5rem',
            borderBottomColor: 'var(--line)',
            borderBottomWidth: '1px',
          }}
        >
          <h2
            id="dialog-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div 
          style={{
            padding: '1.5rem',
          }}
        >
          <p
            id="dialog-message"
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted)',
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            {message}
          </p>
          {children}
        </div>

        {/* Actions */}
        <div 
          style={{
            padding: '1.5rem',
            borderTopColor: 'var(--line)',
            borderTopWidth: '1px',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            aria-label={cancelText}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDangerous ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            aria-label={confirmText}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>,
    portalElement
  )
}
