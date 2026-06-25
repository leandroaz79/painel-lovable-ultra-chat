import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pickPrimaryRole, roleHome, useRoles } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResellerOverview } from "@/components/reseller/ResellerOverview";
import { ResellerLicensesTab } from "@/components/reseller/ResellerLicensesTab";
import { ResellerCreditsTab } from "@/components/reseller/ResellerCreditsTab";

export const Route = createFileRoute("/_authenticated/reseller")({
  head: () => ({ meta: [{ title: "Painel — Revendedor" }] }),
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    const roles = (data ?? []).map((r: any) => r.role);
    if (!roles.includes("reseller")) throw redirect({ to: roleHome(pickPrimaryRole(roles)) });
  },
  component: ResellerPage,
});

function ResellerPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const isReseller = roles?.includes("reseller") ?? false;

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Painel do Revendedor</h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>

        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!isReseller) return <Navigate to={roleHome(pickPrimaryRole(roles ?? []))} replace />;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Painel do Revendedor</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="licenses">Licenças</TabsTrigger>
          <TabsTrigger value="credits">Créditos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><ResellerOverview /></TabsContent>
        <TabsContent value="licenses"><ResellerLicensesTab /></TabsContent>
        <TabsContent value="credits"><ResellerCreditsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
