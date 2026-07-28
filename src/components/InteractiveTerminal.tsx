import React from 'react';
import { Check, Monitor, Paperclip, Plus, Send, Mic, HelpCircle } from 'lucide-react';

interface InteractiveTerminalProps {
  jobStatus?: { message?: string | null; status?: string | null } | null;
}

const tasks = [
  'Setup Dark Mode configuration and build the 3D animated toggle component',
  'Apply dark mode styles across all application components',
  'Implement Code Preview feature with file explorer and syntax highlighting',
  'Final integration and verification of all new features',
];

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = () => {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-[820px] -translate-x-1/2 overflow-hidden rounded-[30px] bg-[#0b0f18] text-slate-100">
      <div className="px-6 pt-6">
        <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">TASK PROGRESS</div>
        <div className="mt-2 text-lg font-semibold text-slate-100">Ongoing generation status</div>

        <ul className="mt-6 space-y-4">
          {tasks.map((task, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                <Check className="h-4 w-4" />
              </span>
              <span>{task}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-transparent px-6 pb-6">
        <div className="flex flex-col gap-5 text-slate-200">
          <div className="text-sm">I have s...</div>

          <div className="flex flex-col gap-4">
            <div className="text-sm text-slate-200">للإرسال ... صف الموديول اللي عايزه</div>
            <div className="inline-flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
                <Send className="h-4 w-4" />
                Generate
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200">
              <button className="rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">CHAT</button>
              <button className="rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">JSON</button>
              <button className="rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">DEMO</button>
              <button className="rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">GitHub</button>
              <button className="rounded-full bg-white/5 px-3 py-2 transition hover:bg-white/10">ZIP</button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <HelpCircle className="h-4 w-4" />
              <span>GATHERING</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-200 transition hover:bg-white/10">
              <Plus className="h-4 w-4" />
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-200 transition hover:bg-white/10">
              <Paperclip className="h-4 w-4" />
            </button>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10">
              <Monitor className="h-4 w-4" />
              Manus Desktop
            </div>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-200 transition hover:bg-white/10">
              <Mic className="h-4 w-4" />
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500 text-white transition hover:bg-violet-400">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
