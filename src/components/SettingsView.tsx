import React from 'react';
import { Save, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-dark-400 mt-1">Configure your generator preferences</p>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">API Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Backend URL
                </label>
                <input
                  type="text"
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="http://localhost:8000"
                  defaultValue="http://localhost:8000"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30">
                <Info className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-dark-300">API connection status will be shown here</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">GitHub Integration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  GitHub Token (Optional)
                </label>
                <input
                  type="password"
                  className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>

              <p className="text-xs text-dark-400">
                Required only if you want to use automatic GitHub deployment
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Odoo Version</h3>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Target Odoo Version
              </label>
              <select className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-500 transition-colors">
                <option value="17.0">Odoo 17.0</option>
                <option value="16.0">Odoo 16.0</option>
                <option value="15.0">Odoo 15.0</option>
                <option value="14.0">Odoo 14.0</option>
              </select>
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
