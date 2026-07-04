import { useEffect } from 'react';
import { loadTheme, applyTheme, DEFAULT_THEME } from '../utils/themeStorage';
import type { ThemeColors } from '../utils/themeStorage';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'ultra-theme-colors';

export function useTheme(): void {
  useEffect(() => {
    // 1. Apply cached theme immediately (from localStorage)
    const cached = loadTheme();
    applyTheme(cached);

    // 2. Fetch latest from Supabase (background)
    fetchThemeFromSupabase();
  }, []);
}

async function fetchThemeFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('get-site-settings', {
      method: 'GET',
    });

    if (error || !data?.theme_colors) return;

    const remoteColors: ThemeColors = { ...DEFAULT_THEME, ...data.theme_colors };
    applyTheme(remoteColors);

    // Cache locally for faster future loads
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteColors));
    } catch {}
  } catch {
    // Silently fail — use cached/default theme
  }
}
