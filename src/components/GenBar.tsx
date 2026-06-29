import React, { useEffect, useState } from 'react';
import { ArrowRight, HelpCircle, Github, Download } from 'lucide-react';
import AiIcon from './AiIcon';
import type { GeneratorPayload } from '../services/api';

interface GenBarProps {
  onGenerate?: (payload: GeneratorPayload) => void;
}

const isNonEmptyJson = (value: string): boolean => {
  try {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const parsed = JSON.parse(trimmed);
    if (parsed === null || typeof parsed !== 'object') {
      return false;
    }
    if (Array.isArray(parsed)) {
      return parsed.length > 0;
    }
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
};

const ARABIC_JSON_ERROR = "الرجاء إدخال نص JSON غير فارغ وصالح.";

export const GenBar: React.FC<GenBarProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'text' | 'json'>('text');
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>('local_zip');
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // when switching to JSON mode validate existing prompt
    if (mode === 'json') {
      if (!prompt.trim()) {
        setIsJsonValid(false);
      } else if (!isNonEmptyJson(prompt)) {
        setIsJsonValid(false);
        setError(ARABIC_JSON_ERROR);
      } else {
        setIsJsonValid(true);
        if (error === ARABIC_JSON_ERROR) setError('');
      }
    } else {
      // clear json errors when in text mode
      setIsJsonValid(true);
      if (error === ARABIC_JSON_ERROR) setError('');
    }
  }, [mode]);

  useEffect(() => {
    // live-validate when in JSON mode
    if (mode === 'json') {
      if (!prompt.trim()) {
        setIsJsonValid(false);
      } else if (!isNonEmptyJson(prompt)) {
        setIsJsonValid(false);
        setError(ARABIC_JSON_ERROR);
      } else {
        setIsJsonValid(true);
        if (error === ARABIC_JSON_ERROR) setError('');
      }
    }
  }, [prompt]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const canGenerate = !!prompt.trim() && (deploymentStrategy !== 'github' || !!repoInput.trim()) && (mode !== 'json' || isJsonValid);

  const handleGenerate = () => {
    if (!onGenerate) return;

    if (!prompt.trim()) {
      setError('Please enter text before generating.');
      return;
    }

    if (mode === 'json' && !isJsonValid) {
      setError(ARABIC_JSON_ERROR);
      return;
    }

    if (deploymentStrategy === 'github' && !repoInput.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    setError('');

    const payload: GeneratorPayload = {
      moduleName: prompt.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'odoo_module',
      description: prompt,
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-6rem)] max-w-3xl z-50">
      {/* Toast Notification */}
      {error && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short">
          <div className="bg-[#18181b]/95 text-rose-400 border border-rose-500/30 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-[#0b0b0d] text-white rounded-3xl px-4 py-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 flex-1 bg-transparent rounded-2xl px-5 py-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5">
              <AiIcon className="w-5 h-5 text-white" />
            </div>

            <input
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe your Odoo module structure..."
              className={`flex-1 bg-transparent outline-none placeholder-white/40 text-white text-sm transition-all duration-300 ${
                mode === 'json' && prompt.trim() && !isJsonValid
                  ? 'border-2 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] rounded-2xl px-4 py-2'
                  : ''
              }`}
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`ml-3 rounded-full px-5 py-3 font-semibold flex items-center gap-2 shadow-lg ${canGenerate ? 'bg-white text-black' : 'bg-white/20 text-white/50 cursor-not-allowed'}`}
            >
              <span>Generate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full bg-white/5 p-1">
              <button
                onClick={() => setMode('text')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === 'text' ? 'bg-white text-black' : 'text-white/70'}`}
              >
                TEXT
              </button>
              <button
                onClick={() => setMode('json')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === 'json' ? 'bg-white text-black' : 'text-white/70'}`}
              >
                JSON
              </button>
            </div>

            <div className="inline-flex rounded-full bg-white/5 p-1">
              <button
                onClick={() => setDeploymentStrategy('github')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${deploymentStrategy === 'github' ? 'bg-white text-black' : 'text-white/70'}`}
              >
                <Github className="w-4 h-4" />
                GitHub
              </button>
              <button
                onClick={() => setDeploymentStrategy('local_zip')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${deploymentStrategy === 'local_zip' ? 'bg-white text-black' : 'text-white/70'}`}
              >
                <Download className="w-4 h-4" />
                ZIP
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/70" />
              <span>GPT-4 ADVANCED</span>
            </div>

            <button
              type="button"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {deploymentStrategy === 'github' && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">GitHub repository URL</label>
            <input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full bg-transparent outline-none placeholder-white/40 text-white text-sm"
            />
          </div>
        )}

        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
            <div className="w-full max-w-2xl rounded-3xl bg-[#0b0b0d] border border-white/10 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold">Input Help</h3>
                  <p className="mt-2 text-sm text-white/70 leading-6">
                    Enter your module requirements in plain text or paste JSON. Choose GitHub to deploy the generated module to a repository, or ZIP to download locally.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-white/70 hover:text-white"
                  onClick={() => setShowHelp(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenBar;
