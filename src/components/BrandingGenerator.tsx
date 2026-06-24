import { useState, useRef } from "react";
import { generateExtensionZip, downloadZip } from "../utils/extensionBuilder";
import type { BrandingData } from "../utils/extensionBuilder";
import { Button } from "./ui/button";
import { Palette, Upload, Image, Smartphone } from "lucide-react";
import { getStoredTemplate } from "../utils/templateStorage";
import { saveBrandingConfig } from "../utils/brandingStorage";

const TEMPLATE_URL = "/templates/lovable-ultra-chat-5.4-1R.zip";

const PALETA_CORES = [
  { label: "Roxo", hex: "#7C5AFF" },
  { label: "Azul", hex: "#3B82F6" },
  { label: "Verde", hex: "#22C55E" },
  { label: "Vermelho", hex: "#EF4444" },
  { label: "Dourado", hex: "#F59E0B" },
  { label: "Preto Elegante", hex: "#1A1A1A" },
];

export default function BrandingGenerator() {
  const [companyName, setCompanyName] = useState("Lovable Ultra Chat");
  const [whatsapp, setWhatsapp] = useState("5511912345678");
  const [communityLink, setCommunityLink] = useState("");
  const [primaryColor, setPrimaryColor] = useState(PALETA_CORES[0].hex);
  const [secondaryColor, setSecondaryColor] = useState("#6DE8FF");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [iconPreviewUrl, setIconPreviewUrl] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const waUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      setError("Nome da empresa é obrigatório");
      return;
    }
    if (!whatsapp.replace(/\D/g, "")) {
      setError("WhatsApp é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const stored = await getStoredTemplate();
      let templateBuffer: ArrayBuffer;
      if (stored) {
        templateBuffer = stored;
      } else {
        const resp = await fetch(TEMPLATE_URL);
        if (!resp.ok) throw new Error("Falha ao baixar template da extensão");
        templateBuffer = await resp.arrayBuffer();
      }

      const data: BrandingData = {
        companyName: companyName.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        communityLink: communityLink.trim(),
        primaryColor,
        secondaryColor,
        logoFile,
        iconFile,
      };

      const blob = await generateExtensionZip(templateBuffer, data);
      await downloadZip(blob, companyName);
      saveBrandingConfig({
        companyName: companyName.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        communityLink: communityLink.trim(),
        primaryColor,
        secondaryColor,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar extensão");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo deve ter no máximo 2MB");
      return;
    }
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
    const previewUrl = URL.createObjectURL(file);
    setIconFile(file);
    setIconPreviewUrl(previewUrl);
    e.target.value = '';
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <div className="card-heading">
        <span className="icon-pill" aria-hidden="true"><Palette size={20} /></span>
        <h2>Personalizar Extensão</h2>
      </div>

      <div className="stack-form">
        <div className="split-fields">
          <label>
            <span>Nome da empresa</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Ultra Chat"
            />
          </label>

          <label>
            <span>WhatsApp (só números, com DDI+DDD)</span>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511912345678"
            />
          </label>
        </div>

        <label>
          <span>Link da comunidade (opcional)</span>
          <input
            type="text"
            value={communityLink}
            onChange={(e) => setCommunityLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
          />
          <p style={{ color: 'var(--muted-2)', fontSize: '12px', margin: '6px 0 0' }}>
            Link do grupo que aparece na tela de licença. {waUrl && `Padrão: ${waUrl}`}
          </p>
        </label>

        <div>
          <label style={{ marginBottom: '12px', display: 'block' }}>
            <span>Paleta de cores</span>
          </label>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Cor primária</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PALETA_CORES.map((cor) => (
                  <button
                    key={cor.label}
                    onClick={() => setPrimaryColor(cor.hex)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: cor.hex,
                      border: primaryColor === cor.hex
                        ? '3px solid var(--accent)'
                        : '3px solid transparent',
                      boxShadow: primaryColor === cor.hex
                        ? '0 0 0 3px rgba(157,255,47,0.25)'
                        : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                    }}
                    title={cor.label}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    width: '36px',
                    height: '36px',
                    padding: '2px',
                    borderRadius: '50%',
                    border: '2px solid var(--line)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  title="Cor personalizada"
                />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Cor secundária</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{
                    width: '36px',
                    height: '36px',
                    padding: '2px',
                    borderRadius: '50%',
                    border: '2px solid var(--line)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  title="Cor secundária"
                />
                <button
                  onClick={() => setSecondaryColor("#6DE8FF")}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#6DE8FF',
                    border: secondaryColor === '#6DE8FF' ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title="Ciano"
                />
                <button
                  onClick={() => setSecondaryColor("#9DFF2F")}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#9DFF2F',
                    border: secondaryColor === '#9DFF2F' ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title="Verde lima"
                />
                <button
                  onClick={() => setSecondaryColor("#FF6B9D")}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#FF6B9D',
                    border: secondaryColor === '#FF6B9D' ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title="Rosa"
                />
                <button
                  onClick={() => setSecondaryColor("#FFA500")}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#FFA500',
                    border: secondaryColor === '#FFA500' ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title="Laranja"
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              height: '32px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              border: '1px solid var(--line)',
              transition: 'background 0.3s',
            }}
          />
        </div>

        <div className="split-fields">
          <div>
            <label style={{ marginBottom: '8px', display: 'block' }}>
              <span>Logo <small style={{ color: 'var(--muted-2)' }}>(opcional)</small></span>
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button
                variant="outline"
                onClick={() => logoRef.current?.click()}
                size="sm"
              >
                <Upload size={16} /> Escolher
              </Button>
              {logoFile && <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{logoFile.name}</span>}
            </div>
            {logoPreviewUrl && (
              <img
                src={logoPreviewUrl}
                alt="Preview"
                style={{ height: '48px', marginTop: '10px', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}
            <p style={{ color: 'var(--muted-2)', fontSize: '11px', margin: '8px 0 0' }}>
              PNG, JPG, WEBP ou SVG. Máx. 2MB.
            </p>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
          </div>

          <div>
            <label style={{ marginBottom: '8px', display: 'block' }}>
              <span>Ícone Chrome <small style={{ color: 'var(--muted-2)' }}>(opcional)</small></span>
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button
                variant="outline"
                onClick={() => iconRef.current?.click()}
                size="sm"
              >
                <Image size={16} /> Escolher
              </Button>
              {iconFile && <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{iconFile.name}</span>}
            </div>
            {iconPreviewUrl && (
              <img
                src={iconPreviewUrl}
                alt="Ícone preview"
                style={{ height: '48px', width: '48px', marginTop: '10px', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}
            <p style={{ color: 'var(--muted-2)', fontSize: '11px', margin: '8px 0 0' }}>
              PNG quadrado, ≥128×128. Geramos 16/32/48/128 automaticamente.
            </p>
            <input
              ref={iconRef}
              type="file"
              accept="image/png"
              onChange={handleIconChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px',
          marginTop: '20px',
          borderRadius: '14px',
          background: 'rgba(255, 61, 85, 0.12)',
          border: '1px solid rgba(255, 61, 85, 0.25)',
          color: 'var(--danger)',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <Button
          variant="outline"
          onClick={() => {
            setCompanyName("Lovable Ultra Chat");
            setWhatsapp("5511912345678");
            setCommunityLink("");
            setPrimaryColor(PALETA_CORES[0].hex);
            setSecondaryColor("#6DE8FF");
            setLogoFile(null);
            setIconFile(null);
            setLogoPreviewUrl("");
            setIconPreviewUrl("");
            setError("");
          }}
        >
          Limpar
        </Button>
        <Button
          onClick={handleGenerate}
          isLoading={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Gerando..." : <><Smartphone size={18} /> Gerar e baixar .zip</>}
        </Button>
      </div>

      <details style={{ marginTop: '20px', color: 'var(--muted-2)', fontSize: '12px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Como funciona</summary>
        <ol style={{ marginTop: '10px', paddingLeft: '20px', display: 'grid', gap: '6px' }}>
          <li>Preencha os dados, escolha logo e paleta.</li>
          <li>Clique em Gerar e baixar .zip.</li>
          <li>Descompacte e instale em modo desenvolvedor.</li>
          <li>Em chrome://extensions, remova a extensão antiga antes de carregar a nova pasta.</li>
          <li>Se o ícone não atualizar: F12 → Network → Disable cache → reload.</li>
        </ol>
      </details>
    </div>
  );
}
