import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import type { GeneratorPayload, ChatMessage } from '../services/api';
import { sendChatMessage } from '../services/api';
import { buildPayloadFromJson, buildDemoPayload } from '../utils/demoGenerate';
import { TaskProgressTracker, type TaskProgressItem, type TaskStatus } from './TaskProgressTracker';
import AiIcon from './AiIcon';

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

export const GenBar: React.FC<GenBarProps> = ({ onGenerate, resetKey, repositoryUrl, status = 'idle', progress = 0, onRepositoryUrlChange, isReady = false, initialMessages = [], onMessagesChange, jobId }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>('local_zip');
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState(repositoryUrl || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isChatting, setIsChatting] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [requirementsSummary, setRequirementsSummary] = useState('');
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatting]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    setMessages([]);
    setReadyToGenerate(false);
    setRequirementsSummary('');
    setError('');
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

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isChatting || inputMode !== 'chat') return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInputValue('');
    setIsChatting(true);
    setReadyToGenerate(false);
    if (error) setError('');

    try {
      const response = await sendChatMessage(nextMessages, jobId);
      const nextAssistantMessages: ChatMessage[] = [
        ...nextMessages,
        { role: 'assistant', content: response.reply },
      ];
      setMessages(nextAssistantMessages);
      onMessagesChange?.(nextAssistantMessages);
      setReadyToGenerate(response.ready_to_generate);
      setRequirementsSummary(response.requirements_summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error communicating with AI');
    } finally {
      setIsChatting(false);
    }
  };

  const handleGenerate = (force: boolean | React.MouseEvent = false) => {
    const isForced = force === true;
    if (inputMode === 'chat') {
      if (!isForced && (!readyToGenerate || !requirementsSummary.trim())) {
        setError('Please complete the conversation with AI until requirements are ready.');
        return;
      }
      
      const finalPrompt = requirementsSummary.trim() 
        ? requirementsSummary 
        : messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
        
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
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 sm:w-[calc(100%-2.5rem)]">
      {error && (
        <div className="fixed bottom-full mb-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short">
          <div className="bg-[#18181b]/95 text-rose-400 border border-rose-500/30 backdrop-blur-md px-6 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-medium whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] px-2.5 py-2.5 text-white sm:px-3 sm:py-3 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="mb-2"
        >
          <TaskProgressTracker tasks={tasks} title="Task progress" className="w-full" />
        </motion.div>

        {inputMode === 'chat' && messages.length > 0 && (
          <div className="mb-3 max-h-[30vh] overflow-y-auto space-y-2 px-2 py-2">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.content.slice(0, 12)}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/85 border border-white/10'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">
                      <AiIcon className="w-3 h-3" />
                      <span>AI</span>
                    </div>
                  )}
                  {message.content}
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/50 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <div className="rounded-xl border border-white/5 bg-[#0b0b0b] px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isChatting}
              placeholder={
                inputMode === 'json'
                  ? 'Paste your Odoo module JSON configuration here...'
                  : inputMode === 'demo'
                  ? 'Demo configuration loaded — press Generate to build it.'
                  : 'Describe the Odoo module you want to build...'
              }
              rows={1}
              className="min-h-[44px] flex-1 resize-none overflow-hidden bg-transparent text-[13px] leading-5 text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              onClick={inputMode === 'chat' ? handleSendMessage : handleGenerate}
              disabled={inputMode === 'chat' ? (isChatting || !inputValue.trim()) : !isReady}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-100 transition ${
                (inputMode === 'chat' ? (!isChatting && inputValue.trim()) : isReady)
                  ? 'bg-white/10 hover:bg-white/20 opacity-100'
                  : 'bg-black/10 opacity-50 cursor-not-allowed'
              }`}
              aria-label={inputMode === 'chat' ? 'Send Message' : 'Generate'}
            >
              {isChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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

              {inputMode === 'chat' && messages.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium mr-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${readyToGenerate ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={readyToGenerate ? 'text-emerald-400' : 'text-amber-400/80'}>
                      {readyToGenerate ? 'Ready' : 'Gathering Info'}
                    </span>
                  </div>

                  {!readyToGenerate ? (
                    <button
                      onClick={() => handleGenerate(true)}
                      className="shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/50 transition hover:bg-rose-500/20 hover:text-rose-300 flex items-center gap-1.5"
                      title="Force generation even if AI needs more details"
                    >
                      FORCE GENERATE
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerate(false)}
                      className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      GENERATE MODULE
                    </button>
                  )}
                </div>
              )}
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
