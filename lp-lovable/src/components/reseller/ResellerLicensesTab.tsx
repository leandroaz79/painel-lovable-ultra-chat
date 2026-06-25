import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdge, toastError } from "@/lib/edge";
import { createLicenseByDuration } from "@/lib/licenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type License = {
  id: string;
  license_key: string;
  email?: string | null;
  user_name?: string | null;
  status: string;
  license_type: string;
  lifetime?: boolean | null;
  expires_at?: string | null;
  device_id?: string | null;
};

function extractList(data: any): License[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.licenses)) return data.licenses;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function ResellerLicensesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ["reseller-licenses"],
    queryFn: async () => extractList(await invokeEdge("reseller-list-licenses", {})),
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (l) =>
        l.license_key?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.user_name?.toLowerCase().includes(q),
    );
  }, [data, search]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["reseller-licenses"] });
    qc.invalidateQueries({ queryKey: ["reseller-dashboard"] });
  }

  const renew = useMutation({
    mutationFn: (license_key: string) => invokeEdge("reseller-renew-license", { license_key, days: 30 }),
    onSuccess: () => { toast.success("Renovada +30 dias."); invalidate(); },
    onError: toastError,
  });
  const reset = useMutation({
    mutationFn: (license_key: string) => invokeEdge("reseller-reset-hwid", { license_key }),
    onSuccess: () => { toast.success("HWID resetado."); invalidate(); },
    onError: toastError,
  });
  const revoke = useMutation({
    mutationFn: (license_key: string) => invokeEdge("reseller-revoke-license", { license_key }),
    onSuccess: () => { toast.success("Revogada."); invalidate(); },
    onError: toastError,
  });
  const del = useMutation({
    mutationFn: (license_key: string) => invokeEdge("reseller-delete-license", { license_key }),
    onSuccess: () => { toast.success("Licença excluída."); invalidate(); },
    onError: toastError,
  });


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Input
          placeholder="Buscar por chave, email ou nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Atualizando…" : "Atualizar"}
          </Button>
          <CreateLicenseDialog onCreated={invalidate} />
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
              <th className="p-2">Chave</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Status</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Expira</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhuma licença.</td></tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-2 font-mono text-xs">
                  <button
                    onClick={() => { navigator.clipboard.writeText(l.license_key); toast.success("Chave copiada."); }}
                    className="hover:underline"
                  >
                    {l.license_key}
                  </button>
                </td>
                <td className="p-2">
                  <div>{l.email ?? "—"}</div>
                  {l.user_name && <div className="text-xs text-muted-foreground">{l.user_name}</div>}
                </td>
                <td className="p-2"><Badge variant="outline">{l.status}</Badge></td>
                <td className="p-2">{l.lifetime ? "lifetime" : l.license_type}</td>
                <td className="p-2 text-xs">{l.lifetime ? "—" : l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => renew.mutate(l.license_key)}>Renovar</Button>
                  <Button size="sm" variant="ghost" onClick={() => reset.mutate(l.license_key)}>Reset HWID</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">Revogar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revogar licença?</AlertDialogTitle>
                        <AlertDialogDescription>A chave {l.license_key} será revogada.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revoke.mutate(l.license_key)}>Confirmar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Excluir</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir licença?</AlertDialogTitle>
                        <AlertDialogDescription>A chave {l.license_key} será apagada permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(l.license_key)}>Confirmar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateLicenseDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [days, setDays] = useState("30");
  const [lifetime, setLifetime] = useState(false);

  const create = useMutation({
    mutationFn: () => {
      if (!email.trim()) throw new Error("Email do cliente é obrigatório.");
      const duration = lifetime ? null : Number(days);
      if (!lifetime && (!duration || duration <= 0)) {
        throw new Error("Informe a quantidade de dias.");
      }
      return createLicenseByDuration("reseller-create-license", {
        email: email.trim(),
        user_name: userName.trim() || undefined,
      }, duration, lifetime);
    },

    onSuccess: () => {
      toast.success("Licença criada.");
      setOpen(false);
      setEmail(""); setUserName(""); setDays("30"); setLifetime(false);
      onCreated();
    },
    onError: toastError,
  });

  const presets = [7, 15, 30, 60, 90, 180, 365];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova licença</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar licença</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Email do cliente *</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" />
          </div>

          <div className="space-y-1">
            <Label>Nome (opcional)</Label>
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Duração (dias)</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={!lifetime && Number(days) === d ? "default" : "outline"}
                  onClick={() => { setLifetime(false); setDays(String(d)); }}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              disabled={lifetime}
              placeholder="Ex.: 30"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lifetime}
              onChange={(e) => setLifetime(e.target.checked)}
            />
            Licença vitalícia (sem expiração)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
