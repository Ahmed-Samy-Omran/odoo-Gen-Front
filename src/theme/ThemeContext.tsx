import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeId = 'classic' | 'carbon' | 'paper' | 'aurora';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  tagline: string;
  swatch: string[];
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'classic',
    label: 'Classic',
    tagline: 'Original dark',
    swatch: ['#050505', '#ffffff', '#9ca3af'],
  },
  {
    id: 'carbon',
    label: 'Carbon',
    tagline: 'Machined instrument',
    swatch: ['#0a0b09', '#ccff00', '#ecebe6'],
  },
  {
    id: 'paper',
    label: 'Paper',
    tagline: 'Editorial studio',
    swatch: ['#f6f2e9', '#de482c', '#201a13'],
  },
  {
    id: 'aurora',
    label: 'Aurora',
    tagline: 'Deep nebula',
    swatch: ['#06080f', '#8164ff', '#38bdf8'],
  },
];

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeMeta[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'odoo_theme';

function getInitialTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored as ThemeId;
    }
  } catch {
    // ignore storage errors
  }
  return 'classic';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
