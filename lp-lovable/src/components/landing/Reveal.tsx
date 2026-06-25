import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Variant = "fade-up" | "fade" | "slide-left" | "slide-right" | "zoom";

interface RevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: ElementType;
}

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 700,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const initial: Record<Variant, string> = {
    "fade-up": "opacity-0 translate-y-6",
    fade: "opacity-0",
    "slide-left": "opacity-0 -translate-x-8",
    "slide-right": "opacity-0 translate-x-8",
    zoom: "opacity-0 scale-95",
  };
  const shown = "opacity-100 translate-x-0 translate-y-0 scale-100";

  const Comp = Tag as any;
  return (
    <Comp
      ref={ref as any}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionProperty: "opacity, transform",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity, transform",
      }}
      className={`${visible ? shown : initial[variant]} ${className}`}
    >
      {children}
    </Comp>
  );
}
