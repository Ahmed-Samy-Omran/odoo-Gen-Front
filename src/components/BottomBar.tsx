import React, { useEffect, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import AiIcon from './AiIcon';
import type { GeneratorPayload } from '../services/api';

interface BottomBarProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  statusMessage?: string;
  deploymentStrategy?: 'github' | 'local_zip';
  progress?: number;
  downloadUrl?: string;
  repositoryUrl?: string;
  onGenerate?: (payload: GeneratorPayload) => void;
  isGenerating?: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onGenerate,
  downloadUrl,
  repositoryUrl = '',
  isGenerating = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>('local_zip');
  const [repoInput, setRepoInput] = useState(repositoryUrl);

  useEffect(() => {
    setRepoInput(repositoryUrl || '');
  }, [repositoryUrl]);

  const handleSubmit = () => {
    if (!prompt.trim() || !onGenerate) return;

    const payload: GeneratorPayload = {
      moduleName: prompt
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_\s]/g, '')
        .split(/\s+/)
        .slice(0, 3)
        .join('_') || 'odoo_module',
      description: prompt.trim(),
      version: '17.0',
      author: 'Coregen',
      category: 'Tools',
      depends: ['base'],
      features: [],
      models: [],
      deploymentStrategy,
      repositoryUrl: deploymentStrategy === 'github' ? repoInput.trim() : undefined,
    };

    onGenerate(payload);
    setPrompt('');
  };

  const isSubmitDisabled =
    isGenerating || !prompt.trim() || (deploymentStrategy === 'github' && !repoInput.trim());

  return (
    <div className="bottom-input-bar-container">
      <div className="bottom-input-bar">
        <div className="bottom-input-left">
          <div className="bottom-logo">
            <AiIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-white font-semibold tracking-wide">Coregen</span>
            <span className="text-[11px] text-white/50">AI module architect</span>
          </div>
        </div>

        <div className="bottom-input-center">
          <div className="input-action-shell">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your model architecture..."
              className="bottom-input-field"
            />

            <div className="strategy-btns">
              <button
                type="button"
                className={`strategy-btn ${deploymentStrategy === 'github' ? 'active' : ''}`}
                onClick={() => setDeploymentStrategy('github')}
              >
                GitHub
              </button>
              <button
                type="button"
                className={`strategy-btn ${deploymentStrategy === 'local_zip' ? 'active' : ''}`}
                onClick={() => setDeploymentStrategy('local_zip')}
              >
                ZIP file
              </button>
            </div>

            {deploymentStrategy === 'github' && (
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="GitHub repo URL"
                className="repo-input-field"
              />
            )}

            {deploymentStrategy === 'local_zip' && downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="download-btn"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <button
          type="button"
          className="bottom-submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
