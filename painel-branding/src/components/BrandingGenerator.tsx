import { useState, useRef } from "react";
import { generateExtensionZip, downloadZip, BrandingData } from "./extensionBuilder";

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
  const [whatsapp, setWhatsapp] = useState("556781880921");
  const [communityLink, setCommunityLink] = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETA_CORES[0].hex);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
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
      const resp = await fetch(TEMPLATE_URL);
      if (!resp.ok) throw new Error("Falha ao baixar template da extensão");
      const templateBuffer = await resp.arrayBuffer();

      const data: BrandingData = {
        companyName: companyName.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        communityLink: communityLink.trim(),
        primaryColor: selectedColor,
        logoFile,
        iconFile,
      };

      const blob = await generateExtensionZip(templateBuffer, data);
      await downloadZip(blob, companyName);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar extensão");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo deve ter no máximo 2MB");
        return;
      }
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      if (img.width < 128 || img.height < 128) {
        setError("Ícone deve ter no mínimo 128×128 pixels");
        return;
      }
      setIconFile(file);
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Extensão Personalizada</h1>
        <p className="text-gray-500 text-sm">
          Gere uma cópia da extensão com a marca, logo e cores da sua empresa.
        </p>
      </div>

      <div className="space-y-4">
        {/* Nome da empresa */}
        <div>
          <label className="block text-sm font-medium mb-1">Nome da empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium mb-1">
            WhatsApp (com DDI+DDD, só números)
          </label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-400 mt-1">
            Link: {waUrl}
          </p>
        </div>

        {/* Comunidade */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Link da comunidade (opcional)
          </label>
          <input
            type="text"
            value={communityLink}
            onChange={(e) => setCommunityLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full px-3 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-400 mt-1">
            Link do grupo do WhatsApp que aparece na tela de licença.
          </p>
        </div>

        {/* Paleta de cores */}
        <div>
          <label className="block text-sm font-medium mb-2">Paleta de cores</label>
          <div className="flex gap-3 flex-wrap">
            {PALETA_CORES.map((cor) => (
              <button
                key={cor.label}
                onClick={() => setSelectedColor(cor.hex)}
                className={`w-14 h-14 rounded-full border-2 transition-all ${
                  selectedColor === cor.hex
                    ? "border-black scale-110 shadow-lg"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: cor.hex }}
                title={cor.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm">Ou cor personalizada:</span>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-10 h-10 cursor-pointer"
            />
            <span className="text-xs font-mono">{selectedColor}</span>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Logo (opcional)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => logoRef.current?.click()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Escolher logo
            </button>
            {logoFile && <span className="text-sm">{logoFile.name}</span>}
          </div>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-2 h-16 object-contain" />
          )}
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG, WEBP ou SVG. Máx. 2MB.
          </p>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>

        {/* Ícone Chrome */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Ícone Chrome (opcional)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => iconRef.current?.click()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Escolher ícone
            </button>
            {iconFile && <span className="text-sm">{iconFile.name}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            PNG quadrado, ≥128×128. Geramos 16/32/48/128 automaticamente.
          </p>
          <input
            ref={iconRef}
            type="file"
            accept="image/png"
            onChange={handleIconChange}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setCompanyName("Lovable Ultra Chat");
            setWhatsapp("556781880921");
            setCommunityLink("");
            setSelectedColor(PALETA_CORES[0].hex);
            setLogoFile(null);
            setIconFile(null);
            setPreviewUrl("");
            setError("");
          }}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 text-sm"
        >
          Salvar
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white font-medium text-sm flex-1 ${
            loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "⏳ Gerando..." : "Gerar e baixar .zip"}
        </button>
      </div>

      {/* Instruções */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer font-medium">Como funciona</summary>
        <ol className="list-decimal list-inside mt-2 space-y-1">
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
