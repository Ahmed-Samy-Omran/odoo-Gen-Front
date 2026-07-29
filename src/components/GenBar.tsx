import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import type { GeneratorPayload, ChatMessage } from '../services/api';
import { buildPayloadFromJson, buildDemoPayload } from '../utils/demoGenerate';
import { TaskProgressTracker, type TaskProgressItem, type TaskStatus } from './TaskProgressTracker';

interface GenBarProps {
  onGenerate?: (payload: GeneratorPayload) => void;
  onTryDemo?: () => void;
  resetKey?: number;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  jobId?: string | null;
  repositoryUrl?: string;
  downloadUrl?: string;
  onCloudSync?: () => void;
  status?: 'idle' | 'generating' | 'success' | 'error';
  onRepositoryUrlChange?: (url: string) => void;
}

type InputMode = 'chat' | 'json' | 'demo';
type DeploymentMode = 'github' | 'local_zip';

function buildDefaultPayload(prompt?: string, deploymentStrategy: DeploymentMode = 'local_zip', repositoryUrl?: string): GeneratorPayload {
  return {
    moduleName: 'generated_module',
    description: prompt?.trim() || 'Module generated from the current prompt',
    version: '17.0',
    author: 'Coregen',
    category: 'Tools',
    depends: ['base'],
    features: [],
    models: [],
    deploymentStrategy,
    repositoryUrl: deploymentStrategy === 'github' ? repositoryUrl?.trim() : undefined,
  };
}

export const GenBar: React.FC<GenBarProps> = ({ onGenerate, onTryDemo, resetKey, repositoryUrl, status = 'idle', onRepositoryUrlChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>('local_zip');
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState(repositoryUrl || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setGithubRepositoryUrl(repositoryUrl || '');
  }, [repositoryUrl]);

  useEffect(() => {
    if (!resetKey) {
      return;
    }

    setInputValue('');
    setInputMode('chat');
    setDemoLoaded(false);
    setDeploymentMode('local_zip');
  }, [resetKey]);

  const tasks = React.useMemo<TaskProgressItem[]>(() => {
    const planStatus: TaskStatus = status === 'success' ? 'completed' : status === 'generating' ? 'running' : 'pending';
    const schemaStatus: TaskStatus = status === 'generating' ? 'running' : status === 'success' ? 'completed' : 'pending';
    const fileStatus: TaskStatus = status === 'success' ? 'completed' : 'pending';
    const deployStatus: TaskStatus = status === 'success' ? 'completed' : 'pending';

    return [
      { id: 'plan', label: 'Reviewing module requirements', status: planStatus },
      { id: 'schema', label: 'Generating schema', status: schemaStatus },
      { id: 'files', label: 'Preparing files', status: fileStatus },
      { id: 'deploy', label: 'Packaging output', status: deployStatus },
    ];
  }, [status]);

  const handleGenerate = () => {
    const trimmed = inputValue.trim();
    if (!trimmed && inputMode !== 'demo') {
      return;
    }

    let payload: GeneratorPayload;

    if (inputMode === 'demo' || demoLoaded) {
      payload = {
        ...buildDemoPayload(),
        deploymentStrategy: deploymentMode,
        repositoryUrl: deploymentMode === 'github' ? githubRepositoryUrl.trim() : undefined,
      };
    } else if (inputMode === 'json') {
      const parsedPayload = buildPayloadFromJson(trimmed);
      payload = parsedPayload
        ? {
            ...parsedPayload,
            deploymentStrategy: deploymentMode,
            repositoryUrl: deploymentMode === 'github' ? githubRepositoryUrl.trim() : undefined,
          }
        : {
            ...buildDefaultPayload(trimmed, deploymentMode, githubRepositoryUrl),
            aiPrompt: trimmed,
            rawConfig: undefined,
          };
    } else {
      payload = buildDefaultPayload(trimmed, deploymentMode, githubRepositoryUrl);
    }

    onGenerate?.(payload);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleGenerate();
    }
  };

  const focusChat = () => textareaRef.current?.focus();

  const updateRepositoryUrl = (value: string) => {
    setGithubRepositoryUrl(value);
    onRepositoryUrlChange?.(value);
  };

  const handleDemoMode = () => {
    setInputMode('demo');
    setDemoLoaded(true);
    setInputValue('');
    onTryDemo?.();
    focusChat();
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 sm:w-[calc(100%-2.5rem)]">
      <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] px-2.5 py-2.5 text-white sm:px-3 sm:py-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="mb-2"
        >
          <TaskProgressTracker tasks={tasks} title="Task progress" className="w-full" />
        </motion.div>

        <div className="rounded-xl border border-white/5 bg-[#0b0b0b] px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                inputMode === 'json'
                  ? 'Paste your Odoo module JSON configuration here...'
                  : inputMode === 'demo'
                  ? 'Demo configuration loaded — press Generate to build it.'
                  : 'Describe the Odoo module you want to build...'
              }
              rows={1}
              className="min-h-[44px] flex-1 resize-none overflow-hidden bg-transparent text-[13px] leading-5 text-slate-200 outline-none placeholder:text-slate-500"
            />
            <button
              onClick={handleGenerate}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-100 transition hover:bg-white/15"
              aria-label="Generate"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {inputMode === 'demo' && (
              <div className="text-[11px] text-emerald-300/80">
                Demo module loaded. Press Generate to build it with the sample configuration.
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setInputMode('chat');
                    focusChat();
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] transition ${
                    inputMode === 'chat'
                      ? 'bg-white/12 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${inputMode === 'chat' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  CHAT
                </button>
                <button
                  onClick={() => {
                    setInputMode('json');
                    focusChat();
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] transition ${
                    inputMode === 'json'
                      ? 'bg-white/12 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${inputMode === 'json' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  JSON
                </button>
                <button
                  onClick={handleDemoMode}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] transition ${
                    inputMode === 'demo'
                      ? 'bg-white/12 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${inputMode === 'demo' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  DEMO
                </button>
                <button
                  onClick={() => setDeploymentMode('github')}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] transition ${
                    deploymentMode === 'github'
                      ? 'bg-white/12 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${deploymentMode === 'github' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  GitHub
                </button>
                <button
                  onClick={() => setDeploymentMode('local_zip')}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] transition ${
                    deploymentMode === 'local_zip'
                      ? 'bg-white/12 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${deploymentMode === 'local_zip' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  ZIP
                </button>
              </div>
            </div>

            {deploymentMode === 'github' && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  GitHub Repository URL
                </label>
                <input
                  value={githubRepositoryUrl}
                  onChange={(event) => updateRepositoryUrl(event.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-[13px] text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenBar;
