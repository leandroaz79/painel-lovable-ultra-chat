export interface ThemeColors {
  accent: string;
  accent2: string;
  bg: string;
  bgSoft: string;
  card: string;
  cardStrong: string;
  line: string;
  text: string;
  muted: string;
  muted2: string;
  danger: string;
  warning: string;
  cyan: string;
}

const STORAGE_KEY = 'ultra-theme-colors';

export const DEFAULT_THEME: ThemeColors = {
  accent: '#9dff2f',
  accent2: '#62d11f',
  bg: '#050b12',
  bgSoft: '#07111c',
  card: 'rgba(13, 27, 40, 0.78)',
  cardStrong: 'rgba(17, 33, 48, 0.94)',
  line: 'rgba(137, 180, 209, 0.18)',
  text: '#f4fbff',
  muted: '#b0c8db',
  muted2: '#5f7688',
  danger: '#ff3d55',
  warning: '#f5b83d',
  cyan: '#6de8ff',
};

const CSS_MAP: Record<keyof ThemeColors, string> = {
  accent: '--accent',
  accent2: '--accent-2',
  bg: '--bg',
  bgSoft: '--bg-soft',
  card: '--card',
  cardStrong: '--card-strong',
  line: '--line',
  text: '--text',
  muted: '--muted',
  muted2: '--muted-2',
  danger: '--danger',
  warning: '--warning',
  cyan: '--cyan',
};

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function adjustHex(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const adj = (v: number) => {
    if (percent < 0) return Math.round(v * (1 + percent / 100));
    return Math.round(v + (255 - v) * percent / 100);
  };
  const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
}

export function loadTheme(): ThemeColors {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_THEME };
}

export function saveTheme(colors: ThemeColors): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {}
}

const DERIVED_VARS = ['--accent-rgb', '--accent-light', '--accent-bg', '--accent-glow'] as const;

export function applyTheme(colors: ThemeColors): void {
  const root = document.documentElement;
  for (const [key, varName] of Object.entries(CSS_MAP)) {
    root.style.setProperty(varName, colors[key as keyof ThemeColors]);
  }
  const { r, g, b } = hexToRgb2(colors.accent);
  root.style.setProperty('--accent-r', String(r));
  root.style.setProperty('--accent-g', String(g));
  root.style.setProperty('--accent-b', String(b));
  root.style.setProperty('--accent-light', adjustHex(colors.accent, 24));
  root.style.setProperty('--accent-bg', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.28)`);
}

function hexToRgb2(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function resetTheme(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  const root = document.documentElement;
  for (const [, varName] of Object.entries(CSS_MAP)) {
    root.style.removeProperty(varName);
  }
  for (const varName of DERIVED_VARS) {
    root.style.removeProperty(varName);
  }
  root.style.removeProperty('--accent-r');
  root.style.removeProperty('--accent-g');
  root.style.removeProperty('--accent-b');
}
