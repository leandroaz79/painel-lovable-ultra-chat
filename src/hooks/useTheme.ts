import { useEffect } from 'react';
import { loadTheme, applyTheme } from '../utils/themeStorage';

export function useTheme(): void {
  useEffect(() => {
    const colors = loadTheme();
    applyTheme(colors);
  }, []);
}
