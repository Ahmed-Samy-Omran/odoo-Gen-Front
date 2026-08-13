import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import type { GeneratorPayload, ChatMessage } from '../services/api';
import { isQuotaExceededError, notifyQuotaExceeded, sendChatMessage } from '../services/api';
import { buildPayloadFromJson, buildDemoPayload } from '../utils/demoGenerate';
import { TaskProgressTracker, type TaskProgressItem, type TaskStatus } from './TaskProgressTracker';

interface GenBarProps {
  onGenerate?: (payload: GeneratorPayload) => void;
  onTryDemo?: () => void;
  resetKey?: number;
  // lifted chat state (managed by App)
  messages?: ChatMessage[];
  setMessages?: (messages: ChatMessage[]) => void;
  isChatting?: boolean;
  setIsChatting?: (v: boolean) => void;
  readyToGenerate?: boolean;
  setReadyToGenerate?: (v: boolean) => void;
  requirementsSummary?: string;
  setRequirementsSummary?: (v: string) => void;
  error?: string;
  setError?: (v: string) => void;
  jobId?: string | null;
  repositoryUrl?: string;
  downloadUrl?: string;
  onCloudSync?: () => void;
  status?: 'idle' | 'generating' | 'success' | 'error';
  progress?: number;
  onRepositoryUrlChange?: (url: string) => void;
  isReady?: boolean;
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

export const GenBar: React.FC<GenBarProps> = ({ onGenerate, resetKey, repositoryUrl, status = 'idle', progress = 0, onRepositoryUrlChange, isReady = false, messages = [], setMessages, isChatting = false, setIsChatting, readyToGenerate = false, setReadyToGenerate, requirementsSummary = '', setRequirementsSummary, error = '', setError, jobId }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>('local_zip');
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState(repositoryUrl || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Support lifted chat state from App; fall back to internal state if not provided
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>(messages || []);
  const effectiveMessages = typeof setMessages === 'function' ? messages : internalMessages;
  const effectiveSetMessages = setMessages ?? setInternalMessages;

  const [internalIsChatting, setInternalIsChatting] = useState<boolean>(false);
  const effectiveIsChatting = typeof setIsChatting === 'function' ? isChatting : internalIsChatting;
  const effectiveSetIsChatting = setIsChatting ?? setInternalIsChatting;

  const [internalReadyToGenerate, setInternalReadyToGenerate] = useState<boolean>(false);
  const effectiveReadyToGenerate = typeof setReadyToGenerate === 'function' ? readyToGenerate : internalReadyToGenerate;
  const effectiveSetReadyToGenerate = setReadyToGenerate ?? setInternalReadyToGenerate;

  const [internalRequirementsSummary, setInternalRequirementsSummary] = useState<string>(requirementsSummary || '');
  const effectiveRequirementsSummary = typeof setRequirementsSummary === 'function' ? requirementsSummary : internalRequirementsSummary;
  const effectiveSetRequirementsSummary = setRequirementsSummary ?? setInternalRequirementsSummary;

  const [internalError, setInternalError] = useState<string>(error || '');
  const effectiveError = typeof setError === 'function' ? error : internalError;
  const effectiveSetError = setError ?? setInternalError;

  useEffect(() => {
    // keep internal messages synced when App provides initial messages
    if (effectiveMessages && !setMessages) {
      setInternalMessages(effectiveMessages);
    }
  }, [effectiveMessages, setMessages]);

  useEffect(() => {
    if (effectiveError) {
      const timer = setTimeout(() => effectiveSetError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [effectiveError]);

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
    effectiveSetMessages([]);
    effectiveSetReadyToGenerate(false);
    effectiveSetRequirementsSummary('');
    effectiveSetError('');
  }, [resetKey]);

  const tasks = React.useMemo<TaskProgressItem[]>(() => {
    const planStatus: TaskStatus = progress >= 25 || status === 'success'
      ? 'completed'
      : status === 'generating'
      ? 'running'
      : 'pending';

    const schemaStatus: TaskStatus = progress >= 50 || status === 'success'
      ? 'completed'
      : progress >= 26
      ? 'running'
      : 'pending';

    const fileStatus: TaskStatus = progress >= 85 || status === 'success'
      ? 'completed'
      : progress >= 51
      ? 'running'
      : 'pending';

    const deployStatus: TaskStatus = progress >= 100
      ? 'completed'
      : progress >= 86
      ? 'running'
      : 'pending';

    return [
      { id: 'plan', label: 'Analyzing Requirements', status: planStatus },
      { id: 'schema', label: 'Architecting Odoo Schema', status: schemaStatus },
      { id: 'files', label: 'Generating Python & XML Code', status: fileStatus },
      { id: 'deploy', label: 'Finalizing & Packaging Module', status: deployStatus },
    ];
  }, [progress, status]);

  const markSentMessages = (items: ChatMessage[]): ChatMessage[] => items.map((message) => {
    if (message.role === 'user' && message.status === 'sending') {
      return { ...message, status: 'sent' as const };
    }

    return message;
  });

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || effectiveIsChatting || inputMode !== 'chat') return;

    const userMessage: ChatMessage = { role: 'user', content: text, status: 'sending', createdAt: new Date().toISOString() };
    const nextMessages = [...effectiveMessages, userMessage];

    effectiveSetMessages(nextMessages);
    setInputValue('');
    effectiveSetIsChatting(true);
    effectiveSetReadyToGenerate(false);
    if (effectiveError) effectiveSetError('');

    try {
      // Add language hint: if a message contains Arabic characters prefer Arabic reply, else prefer English
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
      const preferred_language = arabicRegex.test(text) ? 'arabic' : 'english';

      const response = await sendChatMessage(nextMessages, jobId, { preferred_language });
      const nextAssistantMessages: ChatMessage[] = [
        ...markSentMessages(nextMessages),
        { role: 'assistant', content: response.reply, createdAt: new Date().toISOString() },
      ];
      effectiveSetMessages(nextAssistantMessages);
      effectiveSetReadyToGenerate(response.ready_to_generate);
      effectiveSetRequirementsSummary(response.requirements_summary);
    } catch (err) {
      effectiveSetMessages(markSentMessages(nextMessages));
      effectiveSetError(err instanceof Error ? err.message : 'Error communicating with AI');
      if (isQuotaExceededError(err)) notifyQuotaExceeded();
    } finally {
      effectiveSetIsChatting(false);
    }
  };

  const handleGenerate = (force: boolean | React.MouseEvent = false) => {
    const isForced = force === true;
    if (inputMode === 'chat') {
      if (!isForced && (!effectiveReadyToGenerate || !effectiveRequirementsSummary.trim())) {
        effectiveSetError('Please complete the conversation with AI until requirements are ready.');
        return;
      }
      
      const finalPrompt = effectiveRequirementsSummary.trim() 
        ? effectiveRequirementsSummary 
        : effectiveMessages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
        
      const payload = buildDefaultPayload(finalPrompt, deploymentMode, githubRepositoryUrl);
      payload.aiPrompt = finalPrompt;
      onGenerate?.(payload);
    } else {
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
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputMode === 'chat') {
        void handleSendMessage();
      } else {
        handleGenerate();
      }
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
    focusChat();
  };

  return (
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 sm:w-[calc(100%-2.5rem)]">
      {effectiveError && (
        <div className="fixed bottom-full mb-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short">
          <div className="bg-[#18181b]/95 text-rose-400 border border-rose-500/30 backdrop-blur-md px-6 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-medium text-center max-w-[92vw]">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{effectiveError}</span>
          </div>
        </div>
      )} 

      <div className="rounded-2xl bg-[#0d0d0d]/90 px-2.5 py-2.5 text-white sm:px-3 sm:py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="mb-2 hidden lg:block"
        >
          <TaskProgressTracker tasks={tasks} title="Task progress" className="w-full" />
        </motion.div>

        <div className="rounded-xl bg-[#0b0b0b]/80 px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={effectiveIsChatting}
              placeholder={
                inputMode === 'json'
                  ? 'Paste your Odoo module JSON configuration here...'
                  : inputMode === 'demo'
                  ? 'Demo configuration loaded — press Generate to build it.'
                  : 'Describe the Odoo module you want to build...'
              }
              rows={1}
              className="min-h-[44px] flex-1 resize-none overflow-hidden bg-transparent border-none text-[14px] leading-5 text-slate-200 outline-none placeholder:text-slate-500 focus:border-none focus:ring-0 disabled:opacity-50 sm:text-[13px]"
            />
            <button
              onClick={inputMode === 'chat' ? handleSendMessage : handleGenerate}
              disabled={inputMode === 'chat' ? (effectiveIsChatting || !inputValue.trim()) : !isReady}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-100 transition ${
                (inputMode === 'chat' ? (!effectiveIsChatting && inputValue.trim()) : isReady)
                  ? 'bg-white/10 hover:bg-white/20 opacity-100'
                  : 'bg-black/10 opacity-50 cursor-not-allowed'
              }`}
              aria-label={inputMode === 'chat' ? 'Send Message' : 'Generate'}
            >
              {effectiveIsChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {inputMode === 'demo' && (
              <div className="text-[11px] text-emerald-300/80">
                Demo module loaded. Press Generate to build it with the sample configuration.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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

            {inputMode === 'chat' && (
              <div className="flex flex-col gap-2 rounded-xl bg-[#0b0b0b]/80 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">
                    <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${effectiveReadyToGenerate ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className="truncate">{effectiveReadyToGenerate ? 'Ready to generate' : 'Awaiting AI guidance'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerate(effectiveReadyToGenerate ? false : true)}
                    className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/20"
                  >
                    {effectiveReadyToGenerate ? 'Generate Module' : 'Force Generate'}
                  </button>
                </div>
                <div className="hidden text-[12px] leading-5 text-slate-400 sm:block">
                  {effectiveReadyToGenerate
                    ? 'The AI has gathered enough requirements and the module is ready to generate.'
                    : 'Continue the chat until the AI confirms requirements are ready, or force generation.'}
                </div>
              </div>
            )}

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
