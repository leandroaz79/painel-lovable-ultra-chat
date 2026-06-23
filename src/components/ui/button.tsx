import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'tiny'
  isLoading?: boolean
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
    const variants = {
      default: 'primary-action',
      destructive: 'danger-action',
      outline: 'ghost-action',
      ghost: 'ghost-action',
      link: 'ghost-action',
    }

    const sizes = {
      default: '',
      sm: 'compact',
      lg: '',
      icon: '',
      tiny: 'tiny-action',
    }

    const classes = [
      variants[variant],
      sizes[size],
      className,
    ].filter(Boolean).join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="btn-spinner" />
            {children}
          </>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
