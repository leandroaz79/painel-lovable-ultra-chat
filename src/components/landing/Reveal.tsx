import { useRef, useEffect, useState, type ReactNode } from "react"

interface Props {
  children: ReactNode
  className?: string
  variant?: 'fade-up' | 'zoom' | 'slide-left'
}

const variantClasses: Record<string, { hidden: string; visible: string }> = {
  "fade-up": { hidden: "translate-y-10 opacity-0", visible: "translate-y-0 opacity-100" },
  zoom: { hidden: "scale-95 opacity-0", visible: "scale-100 opacity-100" },
  "slide-left": { hidden: "-translate-x-10 opacity-0", visible: "translate-x-0 opacity-100" },
}

export function Reveal({ children, className = "", variant = "fade-up" }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const vc = variantClasses[variant] ?? variantClasses["fade-up"]

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? vc.visible : vc.hidden
      } ${className}`}
    >
      {children}
    </div>
  )
}
