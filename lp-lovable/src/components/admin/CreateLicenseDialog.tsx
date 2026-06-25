import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeEdge, toastError } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateLicenseDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseType, setLicenseType] = useState("monthly");
  const [durationDays, setDurationDays] = useState("30");
  const [lifetime, setLifetime] = useState(false);

  const m = useMutation({
    mutationFn: () =>
      invokeEdge("admin-create-license", {
        email,
        user_name: userName || undefined,
        phone: phone || undefined,
        license_type: licenseType,
        duration_days: lifetime ? null : Number(durationDays),
        lifetime,
      }),
    onSuccess: () => {
      toast.success("Licença criada.");
      qc.invalidateQueries({ queryKey: ["admin-licenses"] });
      setOpen(false);
      setEmail("");
      setUserName("");
      setPhone("");
    },
    onError: toastError,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Criar licença</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar nova licença</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Email do cliente</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">trial</SelectItem>
                  <SelectItem value="monthly">monthly</SelectItem>
                  <SelectItem value="quarterly">quarterly</SelectItem>
                  <SelectItem value="yearly">yearly</SelectItem>
                  <SelectItem value="lifetime">lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Duração (dias)</Label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                disabled={lifetime}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} />
            Vitalícia
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !email}>
            {m.isPending ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
