import { Tag } from "lucide-react";

export function PromoBar() {
  return (
    <div className="relative w-full overflow-hidden shimmer-band text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:flex-row sm:gap-4 sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <Tag className="size-3.5" />
          Oferta de lançamento: 30% OFF em todos os planos
        </span>
        <span className="hidden sm:inline opacity-70">•</span>
        <span className="inline-flex items-center gap-2">
          Use o cupom:
          <span className="rounded-md bg-white/15 px-2 py-0.5 font-bold tracking-wider backdrop-blur">
            ULTRA30
          </span>
        </span>
      </div>
    </div>
  );
}
