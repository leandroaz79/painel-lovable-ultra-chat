import { useState, useRef, useEffect } from "react";
import { storeTemplate, removeStoredTemplate, getStoredTemplate } from "../utils/templateStorage";
import { Button } from "./ui/button";
import { Upload, Trash2 } from "lucide-react";

export default function TemplateManager() {
  const [customActive, setCustomActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const checkStatus = async () => {
    const stored = await getStoredTemplate();
    setCustomActive(!!stored);
  };

  useEffect(() => { void checkStatus(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      setMsg("O arquivo deve ser .zip");
      e.target.value = '';
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const buf = await file.arrayBuffer();
      await storeTemplate(buf);
      setCustomActive(true);
      setMsg(`Template atualizado: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Erro ao salvar template");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeStoredTemplate();
      setCustomActive(false);
      setMsg("Template padrão restaurado");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Erro ao remover template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>Template da Extensão</span>
        <span style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
          background: customActive ? 'rgba(34,197,94,0.15)' : 'var(--muted-bg)',
          color: customActive ? '#22c55e' : 'var(--muted)',
        }}>
          {customActive ? 'Personalizado' : 'Padrão'}
        </span>
      </div>
      <p style={{ color: 'var(--muted-2)', fontSize: '12px', marginBottom: '12px' }}>
        {customActive
          ? "Um template personalizado está sendo usado nas personalizações. Clique em \"Remover\" para voltar ao template padrão."
          : "Faça upload de uma nova versão do template .zip da extensão. Ele será usado por todas as personalizações."}
      </p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} isLoading={loading}>
          <Upload size={14} /> Upload .zip
        </Button>
        {customActive && (
          <Button variant="outline" size="sm" onClick={handleRemove} isLoading={loading} style={{ color: 'var(--danger)', borderColor: 'rgba(255,61,85,0.3)' }}>
            <Trash2 size={14} /> Remover
          </Button>
        )}
      </div>
      {msg && (
        <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>{msg}</p>
      )}
      <input ref={inputRef} type="file" accept=".zip" onChange={handleUpload} style={{ display: 'none' }} />
    </div>
  );
}
