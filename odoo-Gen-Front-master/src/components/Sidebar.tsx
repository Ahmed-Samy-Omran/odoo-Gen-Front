import React from 'react';
import { Layout, History, Settings, Layers } from 'lucide-react';

type ViewType = 'canvas' | 'history' | 'settings';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'canvas' as const, icon: Layout, label: 'Canvas' },
    { id: 'history' as const, icon: History, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="w-16 h-full glass-card border-r border-glass-border flex flex-col items-center py-4 gap-2 z-50 relative">
      <div className="mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
          <Layers className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`nav-icon-btn ${activeView === id ? 'active' : ''}`}
            title={label}
            aria-label={label}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-glass-border w-10 flex justify-center">
        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
      </div>
    </nav>
  );
};

export default Sidebar;
