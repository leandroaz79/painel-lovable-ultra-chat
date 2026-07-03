import { Tag } from "lucide-react"

export function PromoBar() {
  return (
    <div className="shimmer-band text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:flex-row sm:gap-4 sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <Tag className="size-3.5" />
          Oferta de lançamento: 30% OFF em todos os planos
        </span>

      </div>
    </div>
  )
}
