const STORAGE_KEY = 'ultra-branding-config';

export interface StoredBranding {
  companyName: string;
  whatsapp: string;
  communityLink: string;
  primaryColor: string;
  secondaryColor: string;
}

export function saveBrandingConfig(data: StoredBranding): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadBrandingConfig(): StoredBranding | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
