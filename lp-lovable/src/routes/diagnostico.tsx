import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/client";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({ meta: [{ title: "Diagnóstico Supabase" }] }),
  component: DiagnosticoPage,
});

// Common table names to probe when introspection is blocked
const CANDIDATES = [
  "profiles", "users", "user_profiles", "accounts", "customers",
  "plans", "plan", "subscriptions", "subscription", "billing", "invoices", "payments",
  "products", "categories", "orders", "order_items",
  "conversations", "conversation", "chats", "chat", "messages", "message",
  "contacts", "contact", "leads", "lead",
  "campaigns", "campaign", "flows", "flow", "automations", "automation",
  "tickets", "ticket", "tags", "tag",
  "agents", "agent", "teams", "team", "departments", "department",
  "integrations", "integration", "channels", "channel", "instances", "instance",
  "templates", "template", "media", "files", "uploads",
  "settings", "preferences", "configs", "config",
  "events", "logs", "audit_logs", "webhooks", "webhook",
  "notes", "notifications", "notification",
  "whatsapp_instances", "whatsapp_messages", "whatsapp_contacts",
  "user_roles", "roles", "permissions",
];

type ProbeResult = {
  table: string;
  ok: boolean;
  count: number | null;
  columns: string[];
  error?: string;
};

async function probeTable(name: string): Promise<ProbeResult> {
  try {
    const { data, error, count } = await supabase
      .from(name)
      .select("*", { count: "exact" })
      .limit(1);
    if (error) return { table: name, ok: false, count: null, columns: [], error: error.message };
    const columns = data && data.length > 0 ? Object.keys(data[0] as object) : [];
    return { table: name, ok: true, count: count ?? 0, columns };
  } catch (e: any) {
    return { table: name, ok: false, count: null, columns: [], error: e?.message ?? String(e) };
  }
}

function DiagnosticoPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [custom, setCustom] = useState("");
  const [authInfo, setAuthInfo] = useState<string>("");

  async function runScan(list: string[]) {
    setLoading(true);
    const out: ProbeResult[] = [];
    // sequential to be gentle
    for (const t of list) out.push(await probeTable(t));
    setResults((prev) => {
      const map = new Map(prev.map((r) => [r.table, r]));
      for (const r of out) map.set(r.table, r);
      return Array.from(map.values()).sort((a, b) => Number(b.ok) - Number(a.ok) || a.table.localeCompare(b.table));
    });
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthInfo(data.session ? `Sessão ativa: ${data.session.user.email ?? data.session.user.id}` : "Sem sessão (anon)");
    });
    runScan(CANDIDATES);
  }, []);

  const accessible = results.filter((r) => r.ok);
  const blocked = results.filter((r) => !r.ok);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Diagnóstico Supabase</h1>
      <p className="text-sm text-muted-foreground mb-1">URL: {SUPABASE_URL}</p>
      <p className="text-xs text-muted-foreground mb-1 break-all">anon key: {SUPABASE_ANON_KEY.slice(0, 24)}…{SUPABASE_ANON_KEY.slice(-12)}</p>
      <p className="text-sm mb-6">{authInfo}</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="testar nomes separados por vírgula"
          className="flex-1 min-w-[240px] px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm"
        />
        <button
          onClick={() => {
            const list = custom.split(",").map((s) => s.trim()).filter(Boolean);
            if (list.length) runScan(list);
          }}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
        >
          Sondar
        </button>
        <button
          onClick={() => runScan(CANDIDATES)}
          className="px-4 py-2 rounded-md bg-white/10 text-sm"
        >
          Re-scan padrão
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">Sondando tabelas…</p>}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Acessíveis pela anon key ({accessible.length})
        </h2>
        {accessible.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">Nenhuma tabela acessível com a anon key entre os nomes sondados.</p>
        )}
        <div className="space-y-3">
          {accessible.map((r) => (
            <div key={r.table} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <code className="font-mono text-emerald-300">{r.table}</code>
                <span className="text-xs text-muted-foreground">linhas: {r.count}</span>
              </div>
              {r.columns.length > 0 ? (
                <p className="text-xs mt-1 break-words">colunas: {r.columns.join(", ")}</p>
              ) : (
                <p className="text-xs mt-1 text-muted-foreground">acessível, porém sem linhas para inspecionar colunas</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">
          Bloqueadas / inexistentes ({blocked.length})
        </h2>
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">mostrar lista</summary>
          <div className="mt-2 space-y-1 text-xs font-mono">
            {blocked.map((r) => (
              <div key={r.table} className="text-muted-foreground">
                <span className="text-red-400">{r.table}</span> — {r.error}
              </div>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
