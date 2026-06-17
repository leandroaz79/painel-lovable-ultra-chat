import { Button } from './ui/button'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
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
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        role="presentation"
        aria-hidden="true"
        style={{
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
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <h2
            id="dialog-title"
            className="text-lg font-semibold text-white"
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p
            id="dialog-message"
            className="text-sm text-slate-300 leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
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

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-spin {
            animation: none;
            border: 2px solid currentColor;
          }
        }
      `}</style>
    </div>
  )
}
