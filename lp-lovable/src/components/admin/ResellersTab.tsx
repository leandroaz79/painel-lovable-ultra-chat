import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge, toastError } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreateResellerDialog } from "./CreateResellerDialog";

type Reseller = {
  id: string;
  user_id: string;
  email?: string | null;
  name?: string | null;
  whatsapp?: string | null;
  status: string;
  credits: number;
  total_licenses_created?: number;
  total_credits_purchased?: number;
  activation_fee_paid?: boolean;
};


export function ResellersTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Reseller | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-resellers"],
    queryFn: async (): Promise<Reseller[]> => {
      // Edge admin-list-resellers está retornando 400; fallback para a view com email.
      const { data, error } = await supabase
        .from("resellers_with_email")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`resellers_with_email: ${error.message}`);
      return (data ?? []) as Reseller[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm text-muted-foreground">{data?.length ?? 0} revendedores</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Atualizando…" : "Atualizar"}
          </Button>
          <CreateResellerDialog />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {(error as Error).message}
        </div>
      )}

      <div className="rounded-md border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">Email</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Créditos</th>
              <th className="p-2 text-right">Vendas</th>
              <th className="p-2 text-right">Comprados</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Nenhum revendedor.</td></tr>
            )}
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2">{r.email ?? "—"}</td>
                <td className="p-2">
                  <div>{r.name ?? "—"}</div>
                  {r.whatsapp && <div className="text-xs text-muted-foreground">{r.whatsapp}</div>}
                </td>
                <td className="p-2">
                  <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
                  {r.activation_fee_paid === false && (
                    <Badge variant="outline" className="ml-1 text-xs">taxa pendente</Badge>
                  )}
                </td>
                <td className="p-2 text-right font-mono">{r.credits}</td>
                <td className="p-2 text-right font-mono">{r.total_licenses_created ?? 0}</td>
                <td className="p-2 text-right font-mono">{r.total_credits_purchased ?? 0}</td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Gerenciar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ManageResellerDialog
        reseller={editing}
        onClose={() => setEditing(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin-resellers"] })}
      />
    </div>
  );
}

function ManageResellerDialog({
  reseller, onClose, onSaved,
}: { reseller: Reseller | null; onClose: () => void; onSaved: () => void }) {
  const open = !!reseller;
  const [status, setStatus] = useState("active");
  const [creditsDelta, setCreditsDelta] = useState("0");

  useEffect(() => {
    if (reseller) setStatus(reseller.status);
  }, [reseller]);

  const m = useMutation({
    mutationFn: () =>
      invokeEdge("admin-manage-reseller", {
        reseller_id: reseller!.id,
        user_id: reseller!.user_id,
        status,
        credits_delta: Number(creditsDelta) || 0,
      }),
    onSuccess: () => {
      toast.success("Atualizado.");
      onSaved();
      onClose();
      setCreditsDelta("0");
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar {reseller?.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="suspended">suspended</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ajuste de créditos (positivo soma, negativo subtrai)</Label>
            <Input type="number" value={creditsDelta} onChange={(e) => setCreditsDelta(e.target.value)} />
            <p className="text-xs text-muted-foreground">Saldo atual: {reseller?.credits ?? 0}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
