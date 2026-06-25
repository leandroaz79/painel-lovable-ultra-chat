import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdge, toastError } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResellerCreditsTab() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(10);

  const buy = useMutation({
    mutationFn: () => invokeEdge("reseller-buy-credits", { amount }),
    onSuccess: (data: any) => {
      const url = data?.checkout_url ?? data?.url ?? data?.payment_url;
      if (url) {
        window.open(url, "_blank");
        toast.success("Redirecionando para o checkout…");
      } else {
        toast.success("Solicitação enviada.");
      }
      qc.invalidateQueries({ queryKey: ["reseller-dashboard"] });
    },
    onError: toastError,
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Comprar créditos</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Cada crédito permite emitir uma licença para um cliente.
        </p>
        <div className="space-y-1 max-w-xs">
          <Label>Quantidade</Label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <Button onClick={() => buy.mutate()} disabled={buy.isPending}>
          {buy.isPending ? "Processando…" : `Comprar ${amount} crédito(s)`}
        </Button>
      </CardContent>
    </Card>
  );
}
