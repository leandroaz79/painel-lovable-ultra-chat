import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdge, toastError } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreateLicenseDialog } from "./CreateLicenseDialog";

type License = {
  id: string;
  license_key: string;
  email?: string | null;
  user_name?: string | null;
  status: string;
  license_type: string;
  lifetime?: boolean | null;
  expires_at?: string | null;
  activated_at?: string | null;
  device_id?: string | null;
  reseller_id?: string | null;
};

function extractList(data: any): License[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.licenses)) return data.licenses;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function statusVariant(s: string) {
  if (s === "active") return "default";
  if (s === "trial") return "secondary";
  if (s === "expired" || s === "suspended" || s === "revoked") return "destructive";
  return "outline";
}

export function LicensesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-licenses"],
    queryFn: async () => extractList(await invokeEdge("admin-list-licenses", { limit: 200 })),
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
    qc.invalidateQueries({ queryKey: ["admin-licenses"] });
  }

  const renew = useMutation({
    mutationFn: (license_key: string) => invokeEdge("admin-renew-license", { license_key, days: 30 }),
    onSuccess: () => { toast.success("Renovada +30 dias."); invalidate(); },
    onError: toastError,
  });
  const reset = useMutation({
    mutationFn: (license_key: string) => invokeEdge("admin-reset-hwid", { license_key }),
    onSuccess: () => { toast.success("HWID resetado."); invalidate(); },
    onError: toastError,
  });
  const revoke = useMutation({
    mutationFn: (license_key: string) => invokeEdge("admin-revoke-license", { license_key }),
    onSuccess: () => { toast.success("Revogada."); invalidate(); },
    onError: toastError,
  });
  const del = useMutation({
    mutationFn: (license_key: string) => invokeEdge("admin-delete-license", { license_key }),
    onSuccess: () => { toast.success("Excluída."); invalidate(); },
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
          <CreateLicenseDialog />
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
              <th className="p-2">HWID</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Nenhuma licença.</td></tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-2 font-mono text-xs">
                  <button
                    onClick={() => { navigator.clipboard.writeText(l.license_key); toast.success("Chave copiada."); }}
                    className="hover:underline"
                    title="Copiar"
                  >
                    {l.license_key}
                  </button>
                </td>
                <td className="p-2">
                  <div>{l.email ?? "—"}</div>
                  {l.user_name && <div className="text-xs text-muted-foreground">{l.user_name}</div>}
                </td>
                <td className="p-2"><Badge variant={statusVariant(l.status) as any}>{l.status}</Badge></td>
                <td className="p-2">{l.lifetime ? "lifetime" : l.license_type}</td>
                <td className="p-2 text-xs">{l.lifetime ? "—" : l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-2 text-xs">{l.device_id ? "✓" : "—"}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => renew.mutate(l.license_key)}>Renovar</Button>
                  <Button size="sm" variant="ghost" onClick={() => reset.mutate(l.license_key)}>Reset HWID</Button>
                  <ConfirmButton
                    label="Revogar"
                    title="Revogar licença?"
                    desc={`A chave ${l.license_key} será revogada.`}
                    onConfirm={() => revoke.mutate(l.license_key)}
                  />
                  <ConfirmButton
                    label="Excluir"
                    title="Excluir licença?"
                    desc={`A chave ${l.license_key} será apagada permanentemente.`}
                    variant="destructive"
                    onConfirm={() => del.mutate(l.license_key)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfirmButton({
  label, title, desc, onConfirm, variant = "ghost",
}: { label: string; title: string; desc: string; onConfirm: () => void; variant?: "ghost" | "destructive" }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={variant === "destructive" ? "ghost" : "ghost"} className={variant === "destructive" ? "text-destructive hover:text-destructive" : ""}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
