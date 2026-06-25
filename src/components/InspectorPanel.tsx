import React, { useState } from 'react';
import { Play, Github, FileArchive, Link, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { GeneratorPayload } from '../services/api';

interface InspectorPanelProps {
  onGenerate: (payload: GeneratorPayload) => void;
  isGenerating: boolean;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onGenerate, isGenerating }) => {
  const [moduleName, setModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>('local_zip');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState('Tools');
  const [author, setAuthor] = useState('');
  const [version, setVersion] = useState('17.0');
  const [depends, setDepends] = useState('base');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: GeneratorPayload = {
      moduleName: moduleName.trim().toLowerCase().replace(/\s+/g, '_'),
      description: description.trim(),
      version: version.trim(),
      author: author.trim(),
      category: category.trim(),
      depends: depends.split(',').map(d => d.trim()).filter(Boolean),
      features: [],
      models: [], // Models will be added by the App component from its state
      deploymentStrategy,
      repositoryUrl: deploymentStrategy === 'github' ? repositoryUrl.trim() : undefined,
    };

    onGenerate(payload);
  };

  const isValid = moduleName.trim().length >= 2;

  return (
    <div className="w-96 bg-dark-800/50 border-l border-dark-700/50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-dark-700/50">
        <h2 className="text-lg font-semibold text-white">Module Configuration</h2>
        <p className="text-sm text-dark-400 mt-0.5">Configure your Odoo module</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">
            Module Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="my_custom_module"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            placeholder="Describe what your module does..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">
            Deployment Strategy <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeploymentStrategy('github')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                deploymentStrategy === 'github'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-dark-700/30 border-dark-600 text-dark-400 hover:border-dark-500'
              }`}
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => setDeploymentStrategy('local_zip')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                deploymentStrategy === 'local_zip'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-dark-700/30 border-dark-600 text-dark-400 hover:border-dark-500'
              }`}
            >
              <FileArchive className="w-4 h-4" />
              <span className="text-sm font-medium">Local ZIP</span>
            </button>
          </div>
          <p className="text-xs text-dark-500 mt-1.5 flex items-start gap-1">
            <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {deploymentStrategy === 'github'
              ? 'Module will be automatically pushed to your GitHub repository'
              : 'Module will be prepared as a downloadable ZIP file'}
          </p>
        </div>

        {deploymentStrategy === 'github' && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Repository URL <span className="text-dark-500">(Optional)</span>
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="https://github.com/username/repo"
              />
            </div>
            <p className="text-xs text-dark-500 mt-1.5">
              Leave empty to create a new repository
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-dark-400 hover:text-dark-300 transition-colors"
        >
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-dark-700/50">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="Tools">Tools</option>
                <option value="Sales">Sales</option>
                <option value="Website">Website</option>
                <option value="Accounting">Accounting</option>
                <option value="Inventory">Inventory</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Odoo Version
              </label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="17.0">Odoo 17.0</option>
                <option value="16.0">Odoo 16.0</option>
                <option value="15.0">Odoo 15.0</option>
                <option value="14.0">Odoo 14.0</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Dependencies (comma separated)
              </label>
              <input
                type="text"
                value={depends}
                onChange={(e) => setDepends(e.target.value)}
                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="base, mail, contacts"
              />
            </div>
          </div>
        )}
      </form>

      <div className="p-4 border-t border-dark-700/50">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isGenerating}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isValid && !isGenerating
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:from-primary-600 hover:to-purple-600 shadow-lg shadow-primary-500/25'
              : 'bg-dark-700 text-dark-400 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate Module'}
        </button>
      </div>
    </div>
  );
};
