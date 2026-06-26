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
      models: [],
      deploymentStrategy,
      repositoryUrl: deploymentStrategy === 'github' ? repositoryUrl.trim() : undefined,
    };

    onGenerate(payload);
  };

  const isValid = moduleName.trim().length >= 2;

  return (
    <div className="w-96 glass-card border-l border-glass-border flex flex-col overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-glass-border">
        <h2 className="text-lg font-semibold text-white/90">Module Configuration</h2>
        <p className="text-sm text-white/30 mt-0.5">Configure your Odoo module</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
            Module Name <span className="text-white/60">*</span>
          </label>
          <input
            type="text"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className="w-full cyber-input"
            placeholder="my_custom_module"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
            AI Prompt / Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full cyber-input resize-none"
            placeholder="Describe your module in detail — models, fields, views, workflows..."
            rows={5}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
            Deployment Strategy <span className="text-white/60">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeploymentStrategy('github')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                deploymentStrategy === 'github'
                  ? 'bg-white/10 border-white/20 text-white/90'
                  : 'bg-black border-white/10 text-white/40 hover:border-white/15'
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
                  ? 'bg-white/10 border-white/20 text-white/90'
                  : 'bg-black border-white/10 text-white/40 hover:border-white/15'
              }`}
            >
              <FileArchive className="w-4 h-4" />
              <span className="text-sm font-medium">Local ZIP</span>
            </button>
          </div>
          <p className="text-xs text-white/25 mt-1.5 flex items-start gap-1">
            <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {deploymentStrategy === 'github'
              ? 'Module will be automatically pushed to your GitHub repository'
              : 'Module will be prepared as a downloadable ZIP file'}
          </p>
        </div>

        {deploymentStrategy === 'github' && (
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
              Repository URL <span className="text-white/25">(Optional)</span>
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="w-full cyber-input pl-10"
                placeholder="https://github.com/username/repo"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-glass-border">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full cyber-input"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cyber-input cursor-pointer"
              >
                <option value="Tools" className="bg-black">Tools</option>
                <option value="Sales" className="bg-black">Sales</option>
                <option value="Website" className="bg-black">Website</option>
                <option value="Accounting" className="bg-black">Accounting</option>
                <option value="Inventory" className="bg-black">Inventory</option>
                <option value="Human Resources" className="bg-black">Human Resources</option>
                <option value="Marketing" className="bg-black">Marketing</option>
                <option value="Project" className="bg-black">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">Odoo Version</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full cyber-input cursor-pointer"
              >
                <option value="17.0" className="bg-black">Odoo 17.0</option>
                <option value="16.0" className="bg-black">Odoo 16.0</option>
                <option value="15.0" className="bg-black">Odoo 15.0</option>
                <option value="14.0" className="bg-black">Odoo 14.0</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
                Dependencies (comma separated)
              </label>
              <input
                type="text"
                value={depends}
                onChange={(e) => setDepends(e.target.value)}
                className="w-full cyber-input"
                placeholder="base, mail, contacts"
              />
            </div>
          </div>
        )}
      </form>

      <div className="p-4 border-t border-glass-border">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isGenerating}
          className={`w-full cyber-button-accent ${!isValid || isGenerating ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Play className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate Module'}
        </button>
      </div>
    </div>
  );
};
