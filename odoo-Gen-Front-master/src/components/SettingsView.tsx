import React, { useState } from 'react';
import { Key, Database, AlertTriangle, Trash2, Eye, EyeOff, Check, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  onSave: (settings: { apiKey: string; odooVersion: string }) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [odooVersion, setOdooVersion] = useState('17');
  const [saved, setSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = () => {
    onSave({ apiKey, odooVersion });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetCache = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 1500);
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Settings</h1>
          <p className="text-white/30 text-sm mt-1">Configure your AI-powered Odoo Module Architect</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
              <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center">
                <Key className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h3 className="text-white/80 font-medium">LLM API Configuration</h3>
                <p className="text-white/30 text-sm">Connect your AI service provider</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full cyber-input pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/25">Your API key is stored locally and never sent to third parties</p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
              <div className="w-10 h-10 rounded-lg bg-white/6 flex items-center justify-center">
                <Database className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-white/80 font-medium">Odoo Configuration</h3>
                <p className="text-white/30 text-sm">Target version for generated modules</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Target Odoo Version</label>
              <select
                value={odooVersion}
                onChange={(e) => setOdooVersion(e.target.value)}
                className="w-full cyber-input cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="15" className="bg-obsidian text-white">Odoo v15</option>
                <option value="16" className="bg-obsidian text-white">Odoo v16</option>
                <option value="17" className="bg-obsidian text-white">Odoo v17</option>
              </select>
            </div>
          </div>

          <div className="glass-card p-6 space-y-5 border-white/10">
            <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white/50" />
              </div>
              <div>
                <h3 className="text-white/80 font-medium">Danger Zone</h3>
                <p className="text-white/30 text-sm">Irreversible actions</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Reset Database Cache</p>
                <p className="text-white/30 text-xs mt-1">Clear all cached module structures</p>
              </div>
              <button
                onClick={handleResetCache}
                className="cyber-button-danger gap-2"
              >
                {isResetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button className="px-6 py-3 rounded-lg text-white/40 hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`cyber-button-primary gap-2`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-white/80" />
                <span className="text-white/80">Saved</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
