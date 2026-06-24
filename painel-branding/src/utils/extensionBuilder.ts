import JSZip from 'jszip';

export interface BrandingData {
  companyName: string;
  whatsapp: string;
  communityLink: string;
  primaryColor: string;
  logoFile?: File | null;
  iconFile?: File | null;
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
  const wa = data.whatsapp.replace(/\D/g, '');
  const waUrl = `https://wa.me/${wa}`;
  const communityUrl = data.communityLink?.trim() || waUrl;

  return `(function(){if(window.__tsBrandingInstalled)return;window.__tsBrandingInstalled=true;
var DEFAULTS={
  extensionName:${JSON.stringify(data.companyName)},
  brandName:${JSON.stringify(data.companyName)},
  primaryColor:${JSON.stringify(cor)},
  whatsappLinks:{
    support:${JSON.stringify(waUrl)},
    sales:${JSON.stringify(waUrl)},
    community:${JSON.stringify(communityUrl)}
  }
};
function isValidHexColor(c){return typeof c==="string"&&/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.trim())}
function normalizeHex(c){c=c.trim();if(c.length===4)c="#"+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return c.toLowerCase()}
function hexToRgb(hex){hex=normalizeHex(hex);var n=parseInt(hex.slice(1),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255}}
function clamp(v,lo,hi){return Math.min(hi,Math.max(lo,v))}
function adjustHexColor(hex,delta){var rgb=hexToRgb(hex);var f=delta/100;function adj(v){if(f<0)return Math.round(v*(1+f));return Math.round(v+(255-v)*f)}var r=clamp(adj(rgb.r),0,255).toString(16).padStart(2,"0");var g=clamp(adj(rgb.g),0,255).toString(16).padStart(2,"0");var b=clamp(adj(rgb.b),0,255).toString(16).padStart(2,"0");return "#"+r+g+b}
function isValidWaUrl(url){if(typeof url!=="string")return false;return /^https:\\/\\/(wa\\.me|chat\\.whatsapp\\.com)\\//i.test(url.trim())}
function applyBrandColor(hexColor){var color=isValidHexColor(hexColor)?normalizeHex(hexColor):DEFAULTS.primaryColor;var rgb=hexToRgb(color);var hover=adjustHexColor(color,-12);var rgbStr=rgb.r+", "+rgb.g+", "+rgb.b;var root=document.documentElement;root.style.setProperty("--ts-brand-primary",color);root.style.setProperty("--ts-brand-primary-rgb",rgbStr);root.style.setProperty("--ts-brand-primary-hover",hover);root.style.setProperty("--ts-brand-primary-soft","rgba("+rgbStr+", 0.12)");root.style.setProperty("--ts-brand-primary-border","rgba("+rgbStr+", 0.35)");root.style.setProperty("--ts-brand-primary-glow","rgba("+rgbStr+", 0.35)");root.style.setProperty("--ts-brand-gradient","linear-gradient(135deg, "+color+", "+hover+")")}
var BRAND_NAME_SELECTORS=[".ql-title",".ql-brand",".sp-brand-text","[data-ts-brand=\"name\"]","[data-ts-brand-name]"];
var FOOTER_TEXT_SELECTORS=[".ql-badge-mz",".sp-footer-badge","[data-ts-brand=\"footer\"]"];
function applyBrandTexts(cfg){try{if(document.title&&/TS Community/i.test(document.title))document.title=document.title.replace(/TS Community/gi,cfg.brandName)}catch(_){}
function setText(el,value){if(!el)return;var changed=false;el.childNodes.forEach(function(n){if(n.nodeType===3){var t=n.nodeValue;if(/TS Community/i.test(t)){n.nodeValue=t.replace(/TS Community/gi,value);changed=true}}});if(!changed&&!el.children.length)el.textContent=value}
BRAND_NAME_SELECTORS.forEach(function(sel){document.querySelectorAll(sel).forEach(function(el){setText(el,cfg.brandName)})});
FOOTER_TEXT_SELECTORS.forEach(function(sel){document.querySelectorAll(sel).forEach(function(el){el.childNodes.forEach(function(n){if(n.nodeType===3&&/TS Community/i.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/TS Community/gi,cfg.brandName)})})})}
function applyBrandLinks(links){var attrs={support:"support",sales:"sales",community:"community"};Object.keys(attrs).forEach(function(k){var target=links&&links[k];if(!target)return;document.querySelectorAll('[data-ts-wa="'+k+'"]').forEach(function(el){var keepText=el.getAttribute("data-ts-wa-text");var url=target;if(keepText)url+=(url.indexOf("?")===-1?"?":"&")+"text="+encodeURIComponent(keepText);el.setAttribute("href",url)})})}
function applyBrandingConfig(config){config=config||{};var merged={extensionName:config.extensionName||DEFAULTS.extensionName,brandName:config.brandName||DEFAULTS.brandName,primaryColor:isValidHexColor(config.primaryColor)?config.primaryColor:DEFAULTS.primaryColor,whatsappLinks:{support:isValidWaUrl(config.whatsappLinks&&config.whatsappLinks.support)?config.whatsappLinks.support:DEFAULTS.whatsappLinks.support,sales:isValidWaUrl(config.whatsappLinks&&config.whatsappLinks.sales)?config.whatsappLinks.sales:DEFAULTS.whatsappLinks.sales,community:isValidWaUrl(config.whatsappLinks&&config.whatsappLinks.community)?config.whatsappLinks.community:DEFAULTS.whatsappLinks.community}};
window.TS_ACTIVE_BRANDING=merged;try{applyBrandColor(merged.primaryColor)}catch(e){}
try{applyBrandTexts(merged)}catch(_){}try{applyBrandLinks(merged.whatsappLinks)}catch(_){}return merged}
function getBrandWhatsappLink(type){type=type||"support";var b=window.TS_ACTIVE_BRANDING||DEFAULTS;return(b.whatsappLinks&&b.whatsappLinks[type])||DEFAULTS.whatsappLinks[type]||DEFAULTS.whatsappLinks.support}
function tsBrandName(){return(window.TS_ACTIVE_BRANDING&&window.TS_ACTIVE_BRANDING.brandName)||DEFAULTS.brandName}
window.TS_BRANDING_DEFAULTS=DEFAULTS;window.applyBrandingConfig=applyBrandingConfig;window.getBrandWhatsappLink=getBrandWhatsappLink;window.tsBrandName=tsBrandName;
applyBrandingConfig(window.TS_BRANDING_CONFIG||{});
try{var pending=false;var obs=new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;try{applyBrandTexts(window.TS_ACTIVE_BRANDING||DEFAULTS);applyBrandLinks((window.TS_ACTIVE_BRANDING||DEFAULTS).whatsappLinks)}catch(_){}})});var startObserver=function(){if(document.body)obs.observe(document.body,{childList:true,subtree:true})};if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",startObserver)}else{startObserver()}}catch(_){}})();`;
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

export async function generateExtensionZip(
  templateZip: ArrayBuffer,
  data: BrandingData
): Promise<Blob> {
  const zip = await JSZip.loadAsync(templateZip);

  // 1. Substitui branding.config.js
  const novoBranding = gerarBrandingConfig(data);
  zip.file('branding.config.js', novoBranding);

  // 2. Substitui ícones se enviou arquivo
  if (data.iconFile) {
    const tamanhos = [16, 32, 48, 128];
    for (const size of tamanhos) {
      const resized = await resizePng(data.iconFile, size);
      zip.file(`icons/icon${size}.png`, resized, { binary: true });
    }
  }

  // 3. Adiciona logo (opcional)
  if (data.logoFile) {
    zip.file('logo.png', data.logoFile, { binary: true });
  }

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
