import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, HelpCircle, Github, Download, Send, Loader2 } from 'lucide-react';
import AiIcon from './AiIcon';
import type { ChatMessage, GeneratorPayload } from '../services/api';
import { sendChatMessage } from '../services/api';
import { deriveModuleName } from '../utils/promptValidation';
import { buildPayloadFromJson } from '../utils/demoGenerate';

interface GenBarProps {
  onGenerate?: (payload: GeneratorPayload) => void;
  onTryDemo?: () => void;
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

const ARABIC_JSON_ERROR = 'الرجاء إدخال نص JSON غير فارغ وصالح.';

export const GenBar: React.FC<GenBarProps> = ({ onGenerate, onTryDemo }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [requirementsSummary, setRequirementsSummary] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [mode, setMode] = useState<'text' | 'json'>('text');
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>('local_zip');
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      setIsJsonValid(true);
      if (error === ARABIC_JSON_ERROR) setError('');
    }
  }, [mode]);

  useEffect(() => {
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
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatting]);

  const canGenerate =
    mode === 'json'
      ? !!prompt.trim() &&
        (deploymentStrategy !== 'github' || !!repoInput.trim()) &&
        isJsonValid
      : readyToGenerate &&
        !!requirementsSummary.trim() &&
        (deploymentStrategy !== 'github' || !!repoInput.trim()) &&
        !isChatting;

  const handleSendMessage = async () => {
    const text = prompt.trim();
    if (!text || isChatting || mode !== 'text') return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setPrompt('');
    setIsChatting(true);
    setReadyToGenerate(false);
    if (error) setError('');

    try {
      const response = await sendChatMessage(nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      setReadyToGenerate(response.ready_to_generate);
      setRequirementsSummary(response.requirements_summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الاتصال بالـ AI');
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode !== 'text' || e.key !== 'Enter' || e.shiftKey || isChatting) return;
    e.preventDefault();
    void handleSendMessage();
  };

  const handleGenerate = () => {
    if (!onGenerate) return;

    if (mode === 'json') {
      if (!prompt.trim()) {
        setError('Please enter JSON before generating.');
        return;
      }
      if (!isJsonValid) {
        setError(ARABIC_JSON_ERROR);
        return;
      }
    } else if (!readyToGenerate || !requirementsSummary.trim()) {
      setError('كمل المحادثة مع الـ AI لحد ما يقولك إن المتطلبات جاهزة.');
      return;
    }

    if (deploymentStrategy === 'github' && !repoInput.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    setError('');

    if (mode === 'json') {
      const jsonPayload = buildPayloadFromJson(prompt.trim());
      if (!jsonPayload) {
        setError('JSON: use { "prompt": "..." } for AI, or { "modules": [...] } without AI.');
        return;
      }
      onGenerate(jsonPayload);
    } else {
      const payload: GeneratorPayload = {
        moduleName: deriveModuleName(requirementsSummary),
        description: requirementsSummary,
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
    }

    setPrompt('');
    setMessages([]);
    setReadyToGenerate(false);
    setRequirementsSummary('');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-6rem)] max-w-3xl z-50">
      {error && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] animate-bounce-short">
          <div className="bg-[#18181b]/95 text-rose-400 border border-rose-500/30 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-[#0b0b0d] text-white rounded-3xl px-4 py-5 shadow-2xl backdrop-blur-md">
        {mode === 'text' && messages.length > 0 && (
          <div className="mb-3 max-h-52 overflow-y-auto space-y-2 px-2">
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
                  <span>بيفكر...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {mode === 'text' && readyToGenerate && (
          <div className="mb-3 mx-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">
            المتطلبات جاهزة — اضغط Generate لبناء الموديول
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 flex-1 bg-transparent rounded-2xl px-5 py-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5">
              <AiIcon className="w-5 h-5 text-white" />
            </div>

            <textarea
              value={prompt}
              rows={mode === 'text' ? 2 : 1}
              disabled={isChatting}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'json'
                  ? '{ "prompt": "..." } or { "modules": [...] }'
                  : 'صف الموديول اللي عايزه... Enter للإرسال'
              }
              className={`flex-1 resize-none bg-transparent outline-none placeholder-white/40 text-white text-sm transition-all duration-300 disabled:opacity-50 ${
                mode === 'json' && prompt.trim() && !isJsonValid
                  ? 'border-2 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] rounded-2xl px-4 py-2'
                  : ''
              }`}
            />

            {mode === 'text' && (
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={!prompt.trim() || isChatting}
                className="ml-2 rounded-full p-3 bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send (Enter)"
              >
                {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`ml-3 rounded-full px-5 py-3 font-semibold flex items-center gap-2 shadow-lg ${
                canGenerate ? 'bg-white text-black' : 'bg-white/20 text-white/50 cursor-not-allowed'
              }`}
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
                CHAT
              </button>
              <button
                onClick={() => setMode('json')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === 'json' ? 'bg-white text-black' : 'text-white/70'}`}
              >
                JSON
              </button>
              {onTryDemo && (
                <button
                  type="button"
                  onClick={onTryDemo}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-400/90 hover:bg-emerald-500/10"
                  title="Try demo without AI"
                >
                  DEMO
                </button>
              )}
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
              <div className={`w-2 h-2 rounded-full ${readyToGenerate ? 'bg-emerald-400' : 'bg-white/70'}`} />
              <span>{readyToGenerate ? 'READY' : 'GATHERING'}</span>
            </div>

            <button
              type="button"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-5 h-5 text-white" />
            </button>
            {/* sidebar toggle moved to top-left icon in App */}
          </div>
        </div>

        {deploymentStrategy === 'github' && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">
              GitHub repository URL
            </label>
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
                  <h3 className="text-white font-semibold">Chat Help</h3>
                  <p className="mt-2 text-sm text-white/70 leading-6">
                    In CHAT mode the AI asks clarifying questions before building anything. Press Enter to
                    send a message. Short replies like &quot;ايك&quot; or &quot;ok&quot; are acknowledged but
                    won&apos;t start generation. When requirements are complete, you&apos;ll see a green
                    ready badge — then click Generate.
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
