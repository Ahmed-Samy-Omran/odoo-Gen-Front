import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AiIcon from './AiIcon';
import { Sparkles, History, Settings, MessageCircle, Activity, LogOut, Shield, User } from 'lucide-react';

interface SidebarProps {
  activeView: 'generator' | 'history' | 'settings' | 'monitor';
  onViewChange: (view: 'generator' | 'history' | 'settings' | 'monitor') => void;
  onNewChat: () => void;
  onLogout?: () => void;
  showLogo?: boolean;
  isAdmin?: boolean;
  /** User's email address, or null when anonymous/guest. */
  userEmail?: string | null;
  /** True when the current session is an anonymous guest. */
  isGuest?: boolean;
  /** Admin Mode toggle state (controls Monitor + global usage scope). */
  adminMode?: boolean;
  onToggleAdminMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onNewChat,
  onLogout,
  showLogo = true,
  isAdmin = false,
  userEmail = null,
  isGuest = false,
  adminMode = true,
  onToggleAdminMode,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'generator' as const, icon: Sparkles, label: 'Generator' },
    { id: 'history' as const, icon: History, label: 'History' },
    ...(isAdmin && adminMode
      ? [{ id: 'monitor' as const, icon: Activity, label: 'Monitor' }]
      : []),
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  const displayName = isGuest ? 'Guest' : userEmail || 'User';
  const initial = (isGuest ? 'G' : (userEmail?.[0] || 'U')).toUpperCase();

  return (
    <nav className="w-16 h-full glass-card border-r border-glass-border flex flex-col items-center py-4 gap-2 z-50 relative flex-shrink-0">
      {showLogo && (
        <div className="mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/15">
            <Sparkles className="w-5 h-5 text-white" />
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="nav-icon-btn text-white/80 hover:text-white"
            title={displayName}
            aria-label={`Account: ${displayName}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-[11px] font-semibold text-white ring-1 ring-white/15">
              {initial}
            </span>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-[70]" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute bottom-0 left-14 z-[80] w-60 rounded-xl border border-white/10 bg-[#0d0d0d]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-sm font-semibold text-white ring-1 ring-white/15">
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                        {isGuest ? <User className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
                        {isAdmin ? 'Admin' : isGuest ? 'Guest' : 'User'}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                        <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        Admin Mode
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={adminMode}
                        onClick={onToggleAdminMode}
                        className={`relative h-4 w-8 rounded-full transition-colors ${adminMode ? 'bg-emerald-500/70' : 'bg-white/15'}`}
                        title="Toggle Admin Mode (Monitor + global usage)"
                      >
                        <span
                          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-200 ${adminMode ? 'left-4' : 'left-0.5'}`}
                        />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(false);
              onLogout?.();
            }}
            className="nav-icon-btn text-white/70 hover:text-rose-400"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="pt-4 border-t border-glass-border w-10 flex justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  );
};
