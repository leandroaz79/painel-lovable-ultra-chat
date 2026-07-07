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
      className="flex items-center justify-center gap-3"
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        inset: 0,
        background: fullScreen ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
        borderRadius: fullScreen ? undefined : '12px',
        zIndex: fullScreen ? 50 : 10,
      }}
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="relative w-8 h-8">
          <div
            className="absolute inset-0 border-2 rounded-full"
            style={{ borderColor: 'var(--line)' }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 border-2 border-transparent rounded-full animate-spin"
            aria-hidden="true"
            style={{
              borderTopColor: 'var(--accent)',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>

        {/* Message */}
        {message && (
          <p style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
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
