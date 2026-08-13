import React, { useEffect, useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { GeneratorPayload, ChatMessage } from '../services/api';
import { sendChatMessage } from '../services/api';
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

  const canSend = inputMode === 'chat' ? (!effectiveIsChatting && !!inputValue.trim()) : isReady;

  return (
    <div className="genbar-wrap">
      {effectiveError && (
        <div className="fixed bottom-full mb-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short">
          <div className="plate px-6 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-medium text-center text-[rgb(var(--error))] max-w-[92vw]">
            <div className="w-2 h-2 rounded-full bg-[rgb(var(--error))] animate-pulse" />
            <span>{effectiveError}</span>
          </div>
        </div>
      )}

      <div className="genbar">
        <div className="genbar-progress hidden lg:block">
          <TaskProgressTracker tasks={tasks} title="Task progress" className="w-full" />
        </div>

        <div className="genbar-field-row">
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
            className="genbar-field"
          />
          <button
            onClick={inputMode === 'chat' ? handleSendMessage : handleGenerate}
            disabled={!canSend}
            className="genbar-send"
            aria-label={inputMode === 'chat' ? 'Send Message' : 'Generate'}
          >
            {effectiveIsChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <div className="genbar-sub">
          {inputMode === 'demo' && (
            <div className="w-full text-[11px] text-accent">
              Demo module loaded. Press Generate to build it with the sample configuration.
            </div>
          )}

          <button
            onClick={() => {
              setInputMode('chat');
              focusChat();
            }}
            aria-pressed={inputMode === 'chat'}
            className={`mode-chip ${inputMode === 'chat' ? 'active' : ''}`}
          >
            <span className="mode-chip__dot" aria-hidden="true" />
            Chat
          </button>
          <button
            onClick={() => {
              setInputMode('json');
              focusChat();
            }}
            aria-pressed={inputMode === 'json'}
            className={`mode-chip ${inputMode === 'json' ? 'active' : ''}`}
          >
            <span className="mode-chip__dot" aria-hidden="true" />
            JSON
          </button>
          <button
            onClick={handleDemoMode}
            aria-pressed={inputMode === 'demo'}
            className={`mode-chip ${inputMode === 'demo' ? 'active' : ''}`}
          >
            <span className="mode-chip__dot" aria-hidden="true" />
            Demo
          </button>

          <span className="genbar-sep" aria-hidden="true" />

          <button
            onClick={() => setDeploymentMode('github')}
            aria-pressed={deploymentMode === 'github'}
            className={`mode-chip ${deploymentMode === 'github' ? 'active' : ''}`}
          >
            <span className="mode-chip__dot" aria-hidden="true" />
            GitHub
          </button>
          <button
            onClick={() => setDeploymentMode('local_zip')}
            aria-pressed={deploymentMode === 'local_zip'}
            className={`mode-chip ${deploymentMode === 'local_zip' ? 'active' : ''}`}
          >
            <span className="mode-chip__dot" aria-hidden="true" />
            ZIP
          </button>
        </div>

        {inputMode === 'chat' && (
          <div className="genbar-status mt-2">
            <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${effectiveReadyToGenerate ? 'bg-[rgb(var(--accent))]' : 'bg-[rgb(var(--warning))] animate-pulse'}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="genbar-status__label">{effectiveReadyToGenerate ? 'Ready to generate' : 'Awaiting AI guidance'}</div>
              <div className="genbar-status__hint hidden sm:block">
                {effectiveReadyToGenerate
                  ? 'The AI has gathered enough requirements and the module is ready to generate.'
                  : 'Continue the chat until the AI confirms requirements are ready, or force generation.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleGenerate(effectiveReadyToGenerate ? false : true)}
              className={`genbar-status__go ui-btn px-4 py-2 ${effectiveReadyToGenerate ? 'ui-btn--accent' : 'ui-btn--ghost'}`}
            >
              {effectiveReadyToGenerate ? 'Generate Module' : 'Force Generate'}
            </button>
          </div>
        )}

        {deploymentMode === 'github' && (
          <div className="genbar-repo mt-2">
            <label className="genbar-repo__label" htmlFor="genbar-github-url">
              GitHub Repository URL
            </label>
            <input
              id="genbar-github-url"
              value={githubRepositoryUrl}
              onChange={(event) => updateRepositoryUrl(event.target.value)}
              placeholder="https://github.com/username/repo"
              className="genbar-repo__input"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenBar;
