import React, { useState, useEffect } from 'react';
import { Plus, Slash, ArrowUp, Loader2, ChevronDown, Zap } from 'lucide-react';

interface BottomBarProps {
  onExecute: (prompt: string) => Promise<void>;
  isLoading: boolean;
  initialPrompt?: string;
}

const BottomBar: React.FC<BottomBarProps> = ({ onExecute, isLoading, initialPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [showContextDropdown, setShowContextDropdown] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (prompt.trim() && !isLoading) {
      await onExecute(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="command-bar-container">
      <div className="command-bar">
        {/* Quick Action Buttons */}
        <button
          type="button"
          className="command-action-btn"
          title="Add attachment"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="command-action-btn"
          title="Slash commands"
        >
          <Slash className="w-4 h-4" />
        </button>

        <div className="command-divider" />

        {/* Main Input */}
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Describe your Odoo module..."
            className="command-input"
          />
        </div>

        {/* Context Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowContextDropdown(!showContextDropdown)}
            className="command-context-badge"
          >
            <Zap className="w-3 h-3" />
            <span>3 Flash</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showContextDropdown && (
            <div className="absolute bottom-full right-0 mb-2 p-1 rounded-lg bg-black/95 border border-white/10 backdrop-blur-xl min-w-[120px]">
              {['3 Flash', '3.5 Sonnet', '4 Opus'].map((model) => (
                <button
                  key={model}
                  onClick={() => setShowContextDropdown(false)}
                  className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Execute Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!prompt.trim() || isLoading}
          className={`command-execute-btn ${isLoading ? 'loading' : ''}`}
          title="Execute"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
        <kbd className="px-2 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-white/40 font-mono">
          Enter
        </kbd>
      </div>
    </div>
  );
};

export default BottomBar;
