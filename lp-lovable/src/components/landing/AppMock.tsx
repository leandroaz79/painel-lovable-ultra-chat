import {
  Bell,
  Sun,
  Plus,
  Minus,
  Square,
  Paperclip,
  Mic,
  Sparkles,
  Send,
  Wrench,
  Scale,
  Palette,
  Search,
  Rocket,
  ShieldCheck,
  Clipboard,
  Smartphone,
  Gem,
  Bug,
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  ArrowUpRight,
} from "lucide-react";

const shortcuts = [
  { icon: Wrench, label: "CORRIGIR" },
  { icon: Scale, label: "REFATOR" },
  { icon: Palette, label: "DESIGN" },
  { icon: Search, label: "EXPLIC." },
  { icon: Rocket, label: "OTIMIZ." },
  { icon: ShieldCheck, label: "SEGURO" },
  { icon: Clipboard, label: "COPYW." },
  { icon: Smartphone, label: "RESPON." },
  { icon: Gem, label: "CARDS" },
  { icon: Bug, label: "FIX ERR" },
  { icon: Database, label: "MIGRAR" },
  { icon: RefreshCw, label: "TRANSF." },
];

export function AppMock() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-brand opacity-30 blur-3xl" />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.18_0.04_275)] shadow-2xl shadow-brand-purple/30">
        {/* Window header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-gradient-brand">
              <Sparkles className="size-3.5 text-white" />
            </span>
            <span className="text-sm font-semibold">Lovable Ultra Chat</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="size-3.5" />
            <Bell className="size-3.5" />
            <Sun className="size-3.5" />
            <Minus className="size-3.5" />
            <Square className="size-3 rotate-45" />
          </div>
        </div>

        {/* User card */}
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 text-base">
                🎁
              </span>
              <div>
                <div className="text-sm font-semibold">Matheus L.</div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="rounded-md bg-gradient-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                    ULTRA_15D
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    SKILL ON
                  </span>
                </div>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>

          {/* Timer */}
          <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" /> Tempo restante
              </span>
              <span className="font-bold text-white">12d 03h 41m</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[78%] bg-gradient-brand" />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.04] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Zap className="size-3" /> Comandos
              </div>
              <div className="pt-1 text-xl font-extrabold sm:text-2xl">312</div>
            </div>
            <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.04] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <TrendingUp className="size-3" /> Economia
              </div>
              <div className="truncate pt-1 text-lg font-extrabold text-emerald-400 sm:text-2xl">
                R$ 612,00
              </div>
            </div>
          </div>

          {/* Shortcuts */}
          <div>
            <div className="flex items-center justify-between pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Atalhos rápidos</span>
              <span>▾</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {shortcuts.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-white/[0.04] p-2 transition hover:bg-white/10"
                >
                  <Icon className="size-4 text-brand-pink" />
                  <span className="text-[9px] font-semibold text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="size-4" />
            Comando processado <Zap className="size-3.5" />
          </div>

          {/* Input */}
          <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
            <div className="text-xs text-muted-foreground">
              Qual sua dúvida hoje? Digite seu comando…
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Paperclip className="size-4" />
                <Mic className="size-4" />
                <Sparkles className="size-4 text-brand-pink" />
              </div>
              <button className="grid size-8 place-items-center rounded-full bg-gradient-brand text-white">
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
