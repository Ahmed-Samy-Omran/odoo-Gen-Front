import React from 'react';
import { Sparkles, History, Settings, Zap } from 'lucide-react';

interface SidebarProps {
  activeView: 'generator' | 'history' | 'settings';
  onViewChange: (view: 'generator' | 'history' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'generator' as const, icon: Sparkles, label: 'Generator' },
    { id: 'history' as const, icon: History, label: 'History' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-16 lg:w-64 bg-dark-800/50 border-r border-dark-700/50 flex flex-col z-40">
      <div className="p-4 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white">Odoo Gen</h1>
            <p className="text-xs text-dark-400">AI Module Generator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'text-dark-400 hover:bg-dark-700/50 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : ''}`} />
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-700/50">
        <div className="hidden lg:block px-3 py-2 rounded-lg bg-dark-700/30">
          <p className="text-xs text-dark-400">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};
