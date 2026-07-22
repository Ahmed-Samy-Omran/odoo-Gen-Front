import React from 'react';
import AiIcon from './AiIcon';
import { Sparkles, History, Settings, Layers, MessageCircle } from 'lucide-react';

interface SidebarProps {
  activeView: 'generator' | 'history' | 'settings';
  onViewChange: (view: 'generator' | 'history' | 'settings') => void;
  onNewChat: () => void;
  showLogo?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onNewChat, showLogo = true }) => {
  const navItems = [
    { id: 'generator' as const, icon: Sparkles, label: 'Generator' },
    { id: 'history' as const, icon: History, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="w-16 h-full glass-card border-r border-glass-border flex flex-col items-center py-4 gap-2 z-50 relative flex-shrink-0">
      {showLogo && (
        <div className="mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
            <Layers className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <div className="flex-1" />

      <div className="mt-auto flex flex-col items-center gap-3 pb-4">
        <div className="flex flex-col gap-3">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`nav-icon-btn ${activeView === id ? 'active' : ''}`}
              title={label}
              aria-label={label}
            >
              {id === 'generator' ? (
                <AiIcon className="w-5 h-5 text-white" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onNewChat}
            className="nav-icon-btn text-white/70 hover:text-white"
            title="New Chat"
            aria-label="New Chat"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <div className="pt-4 border-t border-glass-border w-10 flex justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  );
};
