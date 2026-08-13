import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme, type ThemeMeta } from './ThemeContext';

export const ThemeSwitcher: React.FC<{ compact?: boolean; vertical?: boolean }> = ({
  compact = false,
  vertical = false,
}) => {
  const { theme, setTheme, themes } = useTheme();

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-2xl border border-fg/10 bg-fg/[0.04] p-1.5 ${
          vertical ? 'flex-col' : ''
        }`}
        role="group"
        aria-label="Theme"
        title="Theme"
      >
        {themes.map((t: ThemeMeta) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-label={t.label}
            title={t.label}
            aria-pressed={theme === t.id}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
              theme === t.id
                ? 'scale-110 bg-fg/[0.16] shadow-[0_0_0_1px_rgb(var(--fg)/0.3)]'
                : 'hover:scale-105 hover:bg-fg/[0.07]'
            }`}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${t.swatch[1]}, ${t.swatch[2]})` }}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-faint">
        <Palette className="h-3 w-3" />
        <span>Studio Theme</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Theme">
        {themes.map((t: ThemeMeta) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={theme === t.id}
            className={`flex flex-col items-start gap-1.5 rounded-lg border px-2.5 py-2 text-left transition-all duration-200 ${
              theme === t.id
                ? 'border-fg/20 bg-fg/10'
                : 'border-fg/10 bg-fg/[0.03] hover:bg-fg/[0.06]'
            }`}
          >
            <span className="flex items-center gap-1">
              {t.swatch.map((color) => (
                <span
                  key={color}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color, boxShadow: theme === t.id ? `0 0 8px ${color}` : 'none' }}
                />
              ))}
            </span>
            <span className={`text-[10px] font-semibold leading-none ${theme === t.id ? 'text-fg' : 'text-fg-muted'}`}>
              {t.label}
            </span>
            <span className="text-[9px] leading-none text-fg-faint">{t.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
