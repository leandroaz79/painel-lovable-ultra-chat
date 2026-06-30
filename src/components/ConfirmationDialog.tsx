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
        onClick={onCancel}
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
        className="relative z-10 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-sm w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: '1px',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '32rem',
          width: '100%',
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b border-slate-700"
          style={{
            padding: '1.5rem',
            borderBottomColor: '#334155',
            borderBottomWidth: '1px',
          }}
        >
          <h2
            id="dialog-title"
            className="text-lg font-semibold text-white"
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#ffffff',
            }}
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div 
          className="p-6"
          style={{
            padding: '1.5rem',
          }}
        >
          <p
            id="dialog-message"
            className="text-sm text-slate-300 leading-relaxed"
            style={{
              fontSize: '0.875rem',
              color: '#cbd5e1',
              lineHeight: '1.5',
            }}
          >
            {message}
          </p>
          {children}
        </div>

        {/* Actions */}
        <div 
          className="p-6 border-t border-slate-700 flex gap-3 justify-end"
          style={{
            padding: '1.5rem',
            borderTopColor: '#334155',
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
