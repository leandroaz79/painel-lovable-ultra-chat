import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge, toastError } from "@/lib/edge";
import { useAuth } from "@/hooks/useAuth";
import { pickPrimaryRole, roleHome, useRoles } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel — Cliente" }] }),
  component: DashboardPage,
});

type License = {
  id: string;
  license_key: string;
  status: string;
  license_type: string;
  lifetime?: boolean | null;
  expires_at?: string | null;
  activated_at?: string | null;
  device_id?: string | null;
};

function DashboardPage() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const qc = useQueryClient();
  const primaryRole = pickPrimaryRole(roles ?? []);

  const { data: licenses, isLoading, error } = useQuery({
    queryKey: ["user-licenses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ts_licenses")
        .select("id, license_key, status, license_type, lifetime, expires_at, activated_at, device_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as License[];
    },
  });

  const trial = useMutation({
    mutationFn: () => invokeEdge("user-create-trial", {}),
    onSuccess: () => {
      toast.success("Trial criado!");
      qc.invalidateQueries({ queryKey: ["user-licenses"] });
    },
    onError: toastError,
  });

  const list = licenses ?? [];
  const hasAny = list.length > 0;

  if (!rolesLoading && primaryRole !== "customer") {
    return <Navigate to={roleHome(primaryRole)} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Minhas Licenças</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Roles: {(roles ?? []).join(", ") || "(nenhum — tratando como cliente)"}
          </p>
        </div>
        <div className="flex gap-2">
          {roles?.includes("reseller") && (
            <Button asChild variant="secondary"><Link to="/reseller">Painel revendedor</Link></Button>
          )}
          {roles?.includes("admin") && (
            <Button asChild variant="secondary"><Link to="/admin">Painel admin</Link></Button>
          )}
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm mb-4">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && !hasAny && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Comece com um Trial gratuito</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Você ainda não possui licenças. Ative seu trial agora.
            </p>
            <Button onClick={() => trial.mutate()} disabled={trial.isPending}>
              {trial.isPending ? "Ativando…" : "Ativar trial"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {list.map((l) => (
          <Card key={l.id}>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={l.status === "active" ? "default" : l.status === "trial" ? "secondary" : "outline"}>
                    {l.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {l.lifetime ? "vitalícia" : l.license_type}
                  </span>
                </div>
                <button
                  className="font-mono text-sm hover:underline"
                  onClick={() => { navigator.clipboard.writeText(l.license_key); toast.success("Chave copiada."); }}
                >
                  {l.license_key}
                </button>
                <div className="text-xs text-muted-foreground">
                  {l.lifetime
                    ? "Sem expiração"
                    : l.expires_at
                      ? `Expira em ${new Date(l.expires_at).toLocaleDateString()}`
                      : "Sem data de expiração"}
                  {l.device_id ? " · HWID vinculado" : " · Sem HWID"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
