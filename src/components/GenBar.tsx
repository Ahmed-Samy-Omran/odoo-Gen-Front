import React, { useEffect, useState } from 'react';
import { Plus, Paperclip, Monitor, Mic, Send } from 'lucide-react';
import type { GeneratorPayload, ChatMessage } from '../services/api';

interface GenBarProps {
  onGenerate?: (payload: GeneratorPayload) => void;
  onTryDemo?: () => void;
  resetKey?: number;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  jobId?: string | null;
}

function buildDefaultPayload(): GeneratorPayload {
  return {
    moduleName: 'generated_module',
    description: 'Module generated from the current prompt',
    version: '17.0',
    author: 'Coregen',
    category: 'Tools',
    depends: ['base'],
    features: [],
    models: [],
    deploymentStrategy: 'local_zip',
  };
}

export const GenBar: React.FC<GenBarProps> = ({ onGenerate, onTryDemo, resetKey }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    setCollapsed(false);
  }, [resetKey]);

  const handleGenerate = () => {
    setIsWorking(true);
    onGenerate?.(buildDefaultPayload());
    setTimeout(() => setIsWorking(false), 600);
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 sm:w-[calc(100%-2.5rem)]">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-white sm:px-4 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-400">TASK PROGRESS</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">I have s...</div>
            <div className="text-sm leading-5 text-slate-400">للإرسال ... صف الموديول اللي عايزه</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-200">
              <span className={`h-2.5 w-2.5 rounded-full ${isWorking ? 'bg-white/80 animate-pulse' : 'bg-slate-600'}`} />
              <span>{isWorking ? 'Working' : 'Pending'}</span>
            </div>
            <button onClick={handleGenerate} className="ml-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
              Generate →
            </button>
          </div>
        </div>

        <div className={`${collapsed ? 'hidden' : 'mt-3'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">CHAT</button>
            <button className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">JSON</button>
            <button onClick={onTryDemo} className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">DEMO</button>
            <button className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">GitHub</button>
            <button className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">ZIP</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200"><Plus className="h-4 w-4"/></button>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200"><Paperclip className="h-4 w-4"/></button>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-200">
              <Monitor className="h-4 w-4" />
              <span className="truncate">Manus Desktop</span>
            </div>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200"><Mic className="h-4 w-4"/></button>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90"><Send className="h-4 w-4"/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenBar;
