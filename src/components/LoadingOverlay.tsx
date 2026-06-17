interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  fullScreen?: boolean
}

export default function LoadingOverlay({
  isVisible,
  message = 'Carregando...',
  fullScreen = false,
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={`
        flex items-center justify-center gap-3
        ${
          fullScreen
            ? 'fixed inset-0 bg-black/60 z-50'
            : 'absolute inset-0 bg-black/40 rounded-lg z-10'
        }
      `}
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="relative w-8 h-8">
          <div
            className="absolute inset-0 border-2 border-slate-600 rounded-full"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
            style={{
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>

        {/* Message */}
        {message && (
          <p className="text-sm text-slate-200 font-medium">
            {message}
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*='animation: spin'] {
            animation: none !important;
            border-top-color: currentColor;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
