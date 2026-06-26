import React from 'react';
import { Save, Info, Key, Database } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white/90">Settings</h1>
          <p className="text-white/30 text-sm mt-1">Configure your generator preferences</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
              <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center">
                <Database className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h3 className="text-white/80 font-medium">API Configuration</h3>
                <p className="text-white/30 text-sm">Backend connection settings</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Backend URL</label>
              <input
                type="text"
                className="w-full cyber-input"
                placeholder="http://localhost:8000"
                defaultValue="http://localhost:8000"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Info className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/40">API connection status will be shown here</span>
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
              <div className="w-10 h-10 rounded-lg bg-white/6 flex items-center justify-center">
                <Key className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-white/80 font-medium">GitHub Integration</h3>
                <p className="text-white/30 text-sm">Required for automatic deployment</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">GitHub Token (Optional)</label>
              <input
                type="password"
                className="w-full cyber-input font-mono"
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <p className="text-xs text-white/25">Required only if you want to use automatic GitHub deployment</p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
              <div className="w-10 h-10 rounded-lg bg-white/6 flex items-center justify-center">
                <Database className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-white/80 font-medium">Odoo Version</h3>
                <p className="text-white/30 text-sm">Target version for generated modules</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Target Odoo Version</label>
              <select className="w-full cyber-input cursor-pointer">
                <option value="17.0" className="bg-black">Odoo 17.0</option>
                <option value="16.0" className="bg-black">Odoo 16.0</option>
                <option value="15.0" className="bg-black">Odoo 15.0</option>
                <option value="14.0" className="bg-black">Odoo 14.0</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="cyber-button-primary gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
