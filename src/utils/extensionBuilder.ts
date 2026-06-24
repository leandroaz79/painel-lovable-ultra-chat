import JSZip from 'jszip';

export interface BrandingData {
  companyName: string;
  whatsapp: string;
  communityLink: string;
  primaryColor: string;
  secondaryColor: string;
  logoFile?: File | null;
  iconFile?: File | null;
  templateFile?: File | null;
}

const PALETAS: Record<string, string> = {
  "Roxo": "#7C5AFF",
  "Azul": "#3B82F6",
  "Verde": "#22C55E",
  "Vermelho": "#EF4444",
  "Dourado": "#F59E0B",
  "Preto Elegante": "#1A1A1A",
};

function getHexColor(color: string): string {
  return PALETAS[color] || color;
}

function gerarBrandingConfig(data: BrandingData): string {
  const cor = getHexColor(data.primaryColor);
  const cor2 = getHexColor(data.secondaryColor);
  const wa = data.whatsapp.replace(/\D/g, '');
  const waUrl = `https://wa.me/${wa}`;
  const communityUrl = data.communityLink?.trim() || waUrl;

  return `// ============================================================
// TS Community - Central Branding Configuration
// ------------------------------------------------------------
// Gerado pelo painel de branding.
// ============================================================

(function () {
  if (window.__tsBrandingInstalled) return;
  window.__tsBrandingInstalled = true;

  var DEFAULTS = {
    extensionName: ${JSON.stringify(data.companyName)},
    brandName: ${JSON.stringify(data.companyName)},
    primaryColor: ${JSON.stringify(cor)},
    secondaryColor: ${JSON.stringify(cor2)},
    whatsappLinks: {
      support: ${JSON.stringify(waUrl)},
      sales: ${JSON.stringify(waUrl)},
      community: ${JSON.stringify(communityUrl)}
    }
  };

  function isValidHexColor(c) {
    return typeof c === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.trim());
  }
  function normalizeHex(c) {
    c = c.trim();
    if (c.length === 4) { c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; }
    return c.toLowerCase();
  }
  function hexToRgb(hex) {
    hex = normalizeHex(hex);
    var n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function adjustHexColor(hex, delta) {
    var rgb = hexToRgb(hex);
    var f = delta / 100;
    function adj(v) {
      if (f < 0) return Math.round(v * (1 + f));
      return Math.round(v + (255 - v) * f);
    }
    var r = clamp(adj(rgb.r), 0, 255).toString(16).padStart(2, "0");
    var g = clamp(adj(rgb.g), 0, 255).toString(16).padStart(2, "0");
    var b = clamp(adj(rgb.b), 0, 255).toString(16).padStart(2, "0");
    return "#" + r + g + b;
  }
  function isValidWaUrl(url) {
    if (typeof url !== "string") return false;
    return /^https:\\/\\/(wa\\.me|chat\\.whatsapp\\.com)\\//i.test(url.trim());
  }

  function applyBrandColor(primary, secondary) {
    var color = isValidHexColor(primary) ? normalizeHex(primary) : DEFAULTS.primaryColor;
    var color2 = isValidHexColor(secondary) ? normalizeHex(secondary) : DEFAULTS.secondaryColor;
    var rgb = hexToRgb(color);
    var hover = adjustHexColor(color, -12);
    var rgbStr = rgb.r + ", " + rgb.g + ", " + rgb.b;

    var root = document.documentElement;
    root.style.setProperty("--ts-brand-primary", color);
    root.style.setProperty("--ts-brand-primary-rgb", rgbStr);
    root.style.setProperty("--ts-brand-primary-hover", hover);
    root.style.setProperty("--ts-brand-primary-soft", "rgba(" + rgbStr + ", 0.12)");
    root.style.setProperty("--ts-brand-primary-border", "rgba(" + rgbStr + ", 0.35)");
    root.style.setProperty("--ts-brand-primary-glow", "rgba(" + rgbStr + ", 0.35)");
    root.style.setProperty("--ts-brand-secondary", color2);
    root.style.setProperty("--ts-brand-gradient", "linear-gradient(135deg, " + color + ", " + color2 + ")");
  }

  var BRAND_NAME_SELECTORS = [
    ".ql-title", ".ql-brand", ".sp-brand-text",
    "[data-ts-brand='name']", "[data-ts-brand-name]"
  ];
  var FOOTER_TEXT_SELECTORS = [".ql-badge-mz", ".sp-footer-badge", "[data-ts-brand='footer']"];
  var ORIGINAL_BRAND_REGEX = /(?:TS Community|Lovable Ultra Chat)/i;

  function applyBrandTexts(cfg) {
    try {
      if (document.title && ORIGINAL_BRAND_REGEX.test(document.title)) {
        document.title = document.title.replace(ORIGINAL_BRAND_REGEX, cfg.brandName);
      }
    } catch (_) {}
    function setText(el, value) {
      if (!el) return;
      var changed = false;
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var t = n.nodeValue;
          if (ORIGINAL_BRAND_REGEX.test(t)) {
            n.nodeValue = t.replace(ORIGINAL_BRAND_REGEX, value);
            changed = true;
          }
        }
      });
      if (!changed && !el.children.length) { el.textContent = value; }
    }
    BRAND_NAME_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { setText(el, cfg.brandName); });
    });
    FOOTER_TEXT_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.childNodes.forEach(function (n) {
          if (n.nodeType === 3 && ORIGINAL_BRAND_REGEX.test(n.nodeValue)) {
            n.nodeValue = n.nodeValue.replace(ORIGINAL_BRAND_REGEX, cfg.brandName);
          }
        });
      });
    });
  }

  function applyBrandLinks(links) {
    var attrs = { support: "support", sales: "sales", community: "community" };
    Object.keys(attrs).forEach(function (k) {
      var target = links && links[k];
      if (!target) return;
      document.querySelectorAll('[data-ts-wa="' + k + '"]').forEach(function (el) {
        var keepText = el.getAttribute("data-ts-wa-text");
        var url = target;
        if (keepText) url += (url.indexOf("?") === -1 ? "?" : "&") + "text=" + encodeURIComponent(keepText);
        el.setAttribute("href", url);
      });
    });
  }

  function applyBrandingConfig(config) {
    config = config || {};
    var merged = {
      extensionName: config.extensionName || DEFAULTS.extensionName,
      brandName: config.brandName || DEFAULTS.brandName,
      primaryColor: isValidHexColor(config.primaryColor) ? config.primaryColor : DEFAULTS.primaryColor,
      secondaryColor: isValidHexColor(config.secondaryColor) ? config.secondaryColor : DEFAULTS.secondaryColor,
      whatsappLinks: {
        support: isValidWaUrl(config.whatsappLinks && config.whatsappLinks.support)
          ? config.whatsappLinks.support : DEFAULTS.whatsappLinks.support,
        sales: isValidWaUrl(config.whatsappLinks && config.whatsappLinks.sales)
          ? config.whatsappLinks.sales : DEFAULTS.whatsappLinks.sales,
        community: isValidWaUrl(config.whatsappLinks && config.whatsappLinks.community)
          ? config.whatsappLinks.community : DEFAULTS.whatsappLinks.community
      }
    };
    window.TS_ACTIVE_BRANDING = merged;
    try { applyBrandColor(merged.primaryColor, merged.secondaryColor); } catch (e) {}
    try { applyBrandTexts(merged); } catch (_) {}
    try { applyBrandLinks(merged.whatsappLinks); } catch (_) {}
    return merged;
  }

  function getBrandWhatsappLink(type) {
    type = type || "support";
    var b = window.TS_ACTIVE_BRANDING || DEFAULTS;
    return (b.whatsappLinks && b.whatsappLinks[type]) || DEFAULTS.whatsappLinks[type] || DEFAULTS.whatsappLinks.support;
  }

  function tsBrandName() {
    return (window.TS_ACTIVE_BRANDING && window.TS_ACTIVE_BRANDING.brandName) || DEFAULTS.brandName;
  }

  window.TS_BRANDING_DEFAULTS = DEFAULTS;
  window.applyBrandingConfig = applyBrandingConfig;
  window.getBrandWhatsappLink = getBrandWhatsappLink;
  window.tsBrandName = tsBrandName;

  applyBrandingConfig(window.TS_BRANDING_CONFIG || {});

  try {
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        try {
          applyBrandTexts(window.TS_ACTIVE_BRANDING || DEFAULTS);
          applyBrandLinks((window.TS_ACTIVE_BRANDING || DEFAULTS).whatsappLinks);
        } catch (_) {}
      });
    });
    var startObserver = function () {
      if (document.body) obs.observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startObserver);
    } else {
      startObserver();
    }
  } catch (_) {}
})();
`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function adjustColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = percent / 100;
  const adj = (v: number) => f < 0 ? Math.round(v * (1 + f)) : Math.round(v + (255 - v) * f);
  return rgbToHex(Math.min(255, Math.max(0, adj(r))), Math.min(255, Math.max(0, adj(g))), Math.min(255, Math.max(0, adj(b))));
}

async function replaceColorsInZip(zip: JSZip, rootDir: string, primary: string) {
  const rgb = hexToRgb(primary);
  const lighter = adjustColor(primary, 20);
  const darker = adjustColor(primary, -15);
  const veryLight = adjustColor(primary, 40);
  const superLight = adjustColor(primary, 60);
  const darkerRgb = hexToRgb(darker);
  const lighterRgb = hexToRgb(lighter);

  const replacements: Array<[RegExp, string]> = [
    [/#7C5AFF/g, primary],
    [/#7c5aff/g, primary.toLowerCase()],
    [/124, 90, 255/g, `${rgb.r}, ${rgb.g}, ${rgb.b}`],
    [/124,58,237/g, `${darkerRgb.r},${darkerRgb.g},${darkerRgb.b}`],
    [/#6d28d9/g, darker],
    [/#A78BFA/g, lighter],
    [/#a78bfa/g, lighter.toLowerCase()],
    [/#c084fc/g, veryLight],
    [/#d8b4fe/g, superLight],
    [/168,85,247/g, `${lighterRgb.r},${lighterRgb.g},${lighterRgb.b}`],
    [/124,90,255/g, `${rgb.r},${rgb.g},${rgb.b}`],
    [/124, 58, 237/g, `${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}`],
    [/#C84CFF/g, lighter],
    [/#c84cff/g, lighter.toLowerCase()],
    [/#9819e6/g, darker],
    [/#9819E6/g, darker],
  ];

  const tasks: Promise<void>[] = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (!path.startsWith(rootDir)) return;
    if (path.endsWith('.png') || path.endsWith('.zip')) return;
    const ext = path.split('.').pop() || '';
    if (!['js', 'css', 'html', 'json'].includes(ext)) return;

    tasks.push(
      zip.file(path).async('string').then(content => {
        let modified = false;
        for (const [pattern, replacement] of replacements) {
          const newContent = content.replace(pattern, replacement);
          if (newContent !== content) {
            modified = true;
            content = newContent;
          }
        }
        if (modified) {
          zip.file(path, content);
        }
      })
    );
  });
  await Promise.all(tasks);
}

function resizePng(file: File, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao redimensionar'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = url;
  });
}

async function flattenZip(zip: JSZip) {
  const entriesToMove: Array<{ from: string; to: string; dir: boolean }> = [];
  let rootDir = '';
  zip.forEach((path) => {
    if (path.endsWith('/') && !rootDir) {
      rootDir = path;
    }
  });
  if (!rootDir) return rootDir;
  zip.forEach((path, entry) => {
    if (path.startsWith(rootDir) && path !== rootDir) {
      entriesToMove.push({ from: path, to: path.slice(rootDir.length), dir: entry.dir });
    }
  });
  const tasks = entriesToMove.filter(e => !e.dir).map(async (e) => {
    const content = await zip.file(e.from)!.async('arraybuffer');
    zip.file(e.to, content, { binary: true });
    zip.remove(e.from);
  });
  await Promise.all(tasks);
  // rebuild folders: create root entries for dirs (JSZip needs folder hint)
  entriesToMove.filter(e => e.dir).forEach(e => zip.file(e.to, null, { dir: true }));
  zip.remove(rootDir);
  return '';
}

async function updateManifest(zip: JSZip, companyName: string) {
  const entry = zip.file('manifest.json');
  if (!entry) return;
  const raw = await entry.async('string');
  try {
    const manifest = JSON.parse(raw);
    manifest.name = companyName;
    manifest.description = `Extensão ${companyName} — versão personalizada.`;
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  } catch (_) {}
}

export async function generateExtensionZip(
  templateZip: ArrayBuffer,
  data: BrandingData
): Promise<Blob> {
  const zip = await JSZip.loadAsync(templateZip);

  const _rootDir = await flattenZip(zip);
  const root = '';

  const novoBranding = gerarBrandingConfig(data);
  zip.file(`${root}branding.config.js`, novoBranding);

  if (data.iconFile) {
    const tamanhos = [16, 32, 48, 128];
    for (const size of tamanhos) {
      const resized = await resizePng(data.iconFile, size);
      zip.file(`${root}icons/icon${size}.png`, resized, { binary: true });
    }
  }

  if (data.logoFile) {
    zip.file(`${root}logo.png`, data.logoFile, { binary: true });
  }

  const hex = data.primaryColor.startsWith('#') ? data.primaryColor : '#' + data.primaryColor;
  await replaceColorsInZip(zip, root, hex);

  await updateManifest(zip, data.companyName);

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

export async function downloadZip(blob: Blob, companyName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `extensao-${companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
