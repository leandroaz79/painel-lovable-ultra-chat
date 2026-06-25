import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pickPrimaryRole, roleHome } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invokeEdge } from "@/lib/edge";
import { LicensesTab } from "@/components/admin/LicensesTab";
import { ResellersTab } from "@/components/admin/ResellersTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Admin" }] }),
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    const roles = (data ?? []).map((r: any) => r.role);
    if (!roles.includes("admin")) throw redirect({ to: roleHome(pickPrimaryRole(roles)) });
  },
  component: AdminPage,
});

function extractLicenses(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.licenses ?? d?.data ?? d?.items ?? [];
}
function extractResellers(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.resellers ?? d?.data ?? [];
}

function MetricsTab() {
  const licenses = useQuery({
    queryKey: ["admin-licenses"],
    queryFn: async () => extractLicenses(await invokeEdge("admin-list-licenses", { limit: 500 })),
  });
  const resellers = useQuery({
    queryKey: ["admin-resellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resellers_with_email")
        .select("id")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`resellers_with_email: ${error.message}`);
      return extractResellers(data);
    },
  });

  const l = licenses.data ?? [];
  const stats = {
    total: l.length,
    active: l.filter((x) => x.status === "active").length,
    trial: l.filter((x) => x.status === "trial" || x.license_type === "trial").length,
    lifetime: l.filter((x) => x.lifetime).length,
    expired: l.filter((x) => x.status === "expired").length,
    suspended: l.filter((x) => x.status === "suspended" || x.status === "revoked").length,
    resellers: resellers.data?.length ?? 0,
  };

  const cards = [
    { label: "Total de licenças", value: stats.total },
    { label: "Ativas", value: stats.active },
    { label: "Trial", value: stats.trial },
    { label: "Vitalícias", value: stats.lifetime },
    { label: "Expiradas", value: stats.expired },
    { label: "Suspensas/Revogadas", value: stats.suspended },
    { label: "Revendedores", value: stats.resellers },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-normal text-muted-foreground">{c.label}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{licenses.isLoading || resellers.isLoading ? "…" : c.value}</div></CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminPage() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="licenses">Licenças</TabsTrigger>
          <TabsTrigger value="resellers">Revendedores</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="mt-4"><MetricsTab /></TabsContent>
        <TabsContent value="licenses" className="mt-4"><LicensesTab /></TabsContent>
        <TabsContent value="resellers" className="mt-4"><ResellersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
