import { useQuery } from "@tanstack/react-query";
import { invokeEdge } from "@/lib/edge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResellerOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reseller-dashboard"],
    queryFn: () => invokeEdge<any>("reseller-dashboard", {}),
    retry: false,
  });

  const errMsg = (error as Error | null)?.message ?? "";
  const notReseller = /não encontrado|not found/i.test(errMsg);


  const d = data?.dashboard ?? data?.data ?? data ?? {};
  const credits = d.credits ?? d.balance ?? d.credit_balance ?? 0;
  const totalLicenses = d.total_licenses ?? d.licenses_count ?? d.total ?? 0;
  const activeLicenses = d.active_licenses ?? d.active ?? 0;
  const sales = d.total_sales ?? d.sales ?? 0;

  const cards = [
    { label: "Créditos disponíveis", value: credits },
    { label: "Licenças totais", value: totalLicenses },
    { label: "Licenças ativas", value: activeLicenses },
    { label: "Vendas", value: sales },
  ];

  return (
    <div className="space-y-4">
      {error && !notReseller && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {errMsg}
        </div>
      )}
      {notReseller && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Sua conta ainda não está cadastrada como revendedor. Solicite ao administrador para habilitar seu cadastro.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "…" : String(c.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
