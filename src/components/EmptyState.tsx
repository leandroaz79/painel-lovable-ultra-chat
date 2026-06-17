import { Button } from './ui/button'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="text-5xl mb-4">{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex gap-3 flex-wrap justify-center">
          {actionLabel && (
            <Button
              onClick={onAction}
              aria-label={actionLabel}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              aria-label={secondaryActionLabel}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
