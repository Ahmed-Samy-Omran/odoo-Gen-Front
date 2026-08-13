import React from 'react';
import AiIcon from './AiIcon';
import { Sparkles, History, Settings, Activity, MessageCircle } from 'lucide-react';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { useTheme } from '../theme/ThemeContext';

interface SidebarProps {
  activeView: 'generator' | 'history' | 'settings' | 'monitor';
  onViewChange: (view: 'generator' | 'history' | 'settings' | 'monitor') => void;
  onNewChat: () => void;
  showLogo?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onNewChat, showLogo = true }) => {
  const { theme } = useTheme();

  const navItems = [
    { id: 'generator' as const, icon: Sparkles, label: 'Generator' },
    { id: 'history' as const, icon: History, label: 'History' },
    { id: 'monitor' as const, icon: Activity, label: 'Monitor' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  if (theme === 'paper') {
    return (
      <header className="masthead" role="banner">
        <div className="masthead-brand">
          <span className="masthead-brand__mark">Odoo&nbsp;Gen</span>
          <span className="masthead-brand__meta">Vol. 01 — Module Foundry</span>
        </div>

        <nav className="masthead-nav" aria-label="Primary">
          {navItems.map(({ id, icon: Icon, label }, index) => (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              aria-current={activeView === id ? 'page' : undefined}
              className={`masthead-nav-btn ${activeView === id ? 'active' : ''}`}
            >
              <span className="mno">
                {String(index + 1).padStart(2, '0')}
              </span>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="masthead-actions">
          <div className="masthead-status">
            <span className="masthead-status__dot" aria-hidden="true" />
            <span>Online</span>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="ui-btn ui-btn--accent px-4 py-2"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            New chat
          </button>
          <ThemeSwitcher compact />
        </div>
      </header>
    );
  }

  return (
    <nav className="rail" aria-label="Primary">
      {showLogo && <div className="rail-logo">OG</div>}

      <div className="rail-nav">
        {navItems.map(({ id, icon: Icon, label }, index) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            aria-current={activeView === id ? 'page' : undefined}
            className={`rail-nav-btn ${activeView === id ? 'active' : ''}`}
            title={label}
            aria-label={label}
          >
            {id === 'generator' ? (
              <AiIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Icon className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="rail-nav-index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>

      <div className="rail-foot">
        <button
          type="button"
          onClick={onNewChat}
          className="rail-nav-btn"
          title="New Chat"
          aria-label="New Chat"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="rail-sep" />

        <div className="rail-status" title="Online" aria-label="Online" />

        <div className="mt-1">
          <ThemeSwitcher compact />
        </div>
      </div>
    </nav>
  );
};
