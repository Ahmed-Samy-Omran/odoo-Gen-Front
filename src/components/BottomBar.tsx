import React, { useEffect, useState } from 'react';
import { Download, Upload, HelpCircle } from 'lucide-react';
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
  const [jsonError, setJsonError] = useState('');
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [isJsonValid, setIsJsonValid] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setRepoInput(repositoryUrl || '');
  }, [repositoryUrl]);

  const validatePromptJson = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !/^[\[{]/.test(trimmed)) {
      setJsonError('');
      setIsJsonMode(false);
      setIsJsonValid(false);
      return;
    }

    setIsJsonMode(true);
    try {
      JSON.parse(trimmed);
      setJsonError('');
      setIsJsonValid(true);
    } catch {
      setJsonError('خطأ في صيغة الـ JSON');
      setIsJsonValid(false);
    }
  }; 

  const handleSubmit = () => {
    if (!prompt.trim() || !onGenerate || jsonError) return;

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
    isGenerating || !prompt.trim() || !!jsonError || (deploymentStrategy === 'github' && !repoInput.trim());

  return (
    <div className="bottom-input-bar-container">
      <div className="bottom-input-bar">
        <div className="bottom-input-left">
          <div className="bottom-logo">
            <AiIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-sm text-white font-semibold tracking-wide">Coregen</span>
              <span className="text-[11px] text-white/50 block">AI module architect</span>
            </div>
            <div className="mode-status-shell-left">
              <span className={`mode-dot ${isJsonMode ? 'red' : 'green'}`} />
            </div>
          </div>
        </div>

        <div className="bottom-input-center">
          <div className="input-action-shell">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  validatePromptJson(e.target.value);
                }}
                placeholder="Describe your model architecture or paste JSON..."
                className={`bottom-input-field ${isJsonMode ? (isJsonValid ? 'json-valid' : 'json-invalid') : ''}`}
              />

              <button
                type="button"
                aria-label="Help"
                onClick={() => setShowHelp(!showHelp)}
                className="help-icon"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {showHelp && (
                <div className="help-modal" role="dialog">
                  <div className="help-modal-content">
                    <h4 className="text-sm font-semibold text-white/90 mb-2">Input Help</h4>
                    <p className="text-xs text-white/60 mb-3">You can type your requirements in natural language OR paste a JSON structure.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="cyber-button-accent text-sm"
                        onClick={async () => {
                          const template = `{"modules":[{"module_name":"my_module","module_description":"Short description","depends":["base"],"git_deploy_target":"local_zip","models":[{"name":"my_module.my_model","description":"Model description","fields":[{"name":"name","type":"char","label":"Name","required":true}]}]}]}`;
                          try { await navigator.clipboard.writeText(template); } catch (e) { /* ignore */ }
                          setPrompt(template);
                          validatePromptJson(template);
                          setShowHelp(false);
                        }}
                      >
                        Copy Template
                      </button>
                      <button type="button" className="cyber-button" onClick={() => setShowHelp(false)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="strategy-btns">
              <div className="mode-status-shell">
                <div className={`mode-light ${isJsonMode ? 'red' : 'green'}`} />
                <span className="mode-label">
                  {isJsonMode ? 'JSON' : 'Text'}
                </span>
              </div>

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

          {jsonError && <p className="text-xs text-red-400 mt-2">{jsonError}</p>}
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
