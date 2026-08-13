import React, { useState, useEffect, useRef } from 'react';
import { Check, Monitor, Mic, Send, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

interface InteractiveTerminalProps {
  jobStatus?: { message?: string | null; status?: string | null } | null;
  onGenerate?: () => void;
  onTryDemo?: () => void;
  isGenerating?: boolean;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  jobStatus,
  onGenerate,
  onTryDemo,
  isGenerating = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  /* ── Stream real status messages into log ── */
  useEffect(() => {
    if (jobStatus?.message) {
      setLogs(prev => {
        const last = prev[prev.length - 1];
        if (last === jobStatus.message) return prev;
        return [...prev.slice(-49), jobStatus.message!];
      });
    }
  }, [jobStatus?.message]);

  /* ── Auto-scroll log ── */
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onGenerate?.();
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusColor = jobStatus?.status === 'done'
    ? '#4ade80'
    : jobStatus?.status === 'error'
    ? '#f87171'
    : isGenerating
    ? 'rgb(var(--accent))'
    : '#64748b';

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      style={{ width: 'calc(100% - 2rem)', maxWidth: '780px' }}
    >
      <div
        className="term-shell"
        style={{
          background: 'rgb(var(--term-bg) / 0.97)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgb(var(--term-border) / 0.16)',
          borderRadius: 'calc(var(--radius) * 1.1)',
          boxShadow: [
            '0 0 0 1px rgb(var(--term-border) / 0.06) inset',
            '0 28px 80px rgb(0 0 0 / 0.5)',
            '0 8px 32px rgb(0 0 0 / 0.3)',
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        {/* ── TASK PROGRESS header ─────────────────────── */}
        <div
          className="term-shell__divider"
          style={{ borderBottom: '1px solid rgb(var(--term-border) / 0.1)' }}
        >
          {/* label + controls */}
          <div
            className="flex items-center justify-between px-5 pt-4 pb-3"
          >
            <span
              className="term-shell__label"
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgb(var(--term-fg) / 0.5)',
              }}
            >
              Task Progress
            </span>
            <div className="flex items-center gap-3">
              {/* live status dot */}
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    width: '7px', height: '7px',
                    borderRadius: '50%',
                    background: statusColor,
                    boxShadow: isGenerating ? `0 0 8px ${statusColor}` : 'none',
                    display: 'inline-block',
                    transition: 'all 0.3s ease',
                  }}
                />
                <span className="term-shell__status" style={{ fontSize: '11px', color: 'rgb(var(--term-fg) / 0.6)', fontWeight: 500 }}>
                  {isGenerating ? 'Running' : jobStatus?.status === 'done' ? 'Done' : jobStatus?.status === 'error' ? 'Error' : 'Idle'}
                </span>
              </div>
              {/* collapse toggle */}
              <button
                onClick={() => setExpanded(v => !v)}
                style={{ color: 'rgb(var(--term-fg) / 0.4)', padding: '2px' }}
                className="hover:text-white/50 transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded
                  ? <ChevronUp size={14} strokeWidth={2} />
                  : <ChevronDown size={14} strokeWidth={2} />}
              </button>
            </div>
          </div>

          {/* ── Terminal log (collapsible) ────────────── */}
          {expanded && (
            <div
              className="px-5 pb-4"
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(var(--term-border) / 0.2) transparent',
              }}
            >
              {logs.length === 0 ? (
                /* empty state */
                <div
                  className="term-shell__log"
                  style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '11.5px',
                    color: 'rgb(var(--term-fg) / 0.4)',
                    lineHeight: '1.7',
                  }}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" style={{ color: 'rgb(var(--accent))' }} />
                      Waiting for server output...
                    </span>
                  ) : (
                    '▸ No output yet. Start generating to see live logs here.'
                  )}
                </div>
              ) : (
                <ul className="space-y-1">
                  {logs.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5"
                      style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '11px', lineHeight: '1.6' }}
                    >
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        style={{ color: 'rgb(var(--accent))', flexShrink: 0, marginTop: '3px' }}
                      />
                      <span className="term-shell__line" style={{ color: 'rgb(var(--term-fg) / 0.75)' }}>{line}</span>
                    </li>
                  ))}
                  <div ref={logsEndRef} />
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── CHAT INPUT row ───────────────────────────── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="صف الموديول اللي عايزه..."
              className="flex-1 bg-transparent outline-none"
              style={{
                color: 'rgb(var(--term-fg) / 0.9)',
                fontSize: '13.5px',
                caretColor: 'rgb(var(--accent))',
              }}
            />
            {/* sending indicator dot */}
            <span
              style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: isGenerating ? 'rgb(var(--accent))' : 'rgba(129,140,248,0.4)',
                boxShadow: isGenerating ? '0 0 10px #818cf8' : 'none',
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* ── BOTTOM TOOLBAR ───────────────────────────── */}
        <div className="flex items-center justify-between px-3 pb-3 pt-0.5">
          {/* left pills */}
          <div className="flex items-center gap-1.5">
            {/* mode tabs */}
            {['CHAT', 'JSON', 'DEMO', 'GitHub', 'ZIP'].map(label => (
              <button
                key={label}
                onClick={label === 'DEMO' ? onTryDemo : undefined}
                className="term-shell__pill"
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  color: 'rgb(var(--term-fg) / 0.55)',
                  background: 'rgb(var(--term-fg) / 0.05)',
                  border: '1px solid rgb(var(--term-border) / 0.12)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgb(var(--term-fg) / 0.1)';
                  (e.currentTarget as HTMLElement).style.color = 'rgb(var(--term-fg) / 0.9)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--term-border) / 0.22)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgb(var(--term-fg) / 0.05)';
                  (e.currentTarget as HTMLElement).style.color = 'rgb(var(--term-fg) / 0.55)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--term-border) / 0.12)';
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* right icons */}
          <div className="flex items-center gap-1.5">
            {/* Manus Desktop */}
            <button
              className="term-shell__btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px',
                borderRadius: '10px',
                fontSize: '11.5px', fontWeight: 500,
                color: 'rgb(var(--term-fg) / 0.55)',
                background: 'rgb(var(--term-fg) / 0.05)',
                border: '1px solid rgb(var(--term-border) / 0.12)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgb(var(--term-fg) / 0.09)';
                (e.currentTarget as HTMLElement).style.color = 'rgb(var(--term-fg) / 0.8)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgb(var(--term-fg) / 0.05)';
                (e.currentTarget as HTMLElement).style.color = 'rgb(var(--term-fg) / 0.55)';
              }}
            >
              <Monitor size={13} strokeWidth={1.8} />
              Manus Desktop
            </button>

            {/* Mic */}
            <button
              className="term-shell__btn"
              style={{
                width: '32px', height: '32px',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgb(var(--term-fg) / 0.5)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgb(var(--term-fg) / 0.08)';
                (e.currentTarget as HTMLElement).style.color = 'rgb(var(--term-fg) / 0.8)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'rgb(var(--term-fg) / 0.5)';
              }}
              aria-label="Voice input"
            >
              <Mic size={14} strokeWidth={1.8} />
            </button>

            {/* Send / Generate — accent circle */}
            <button
              onClick={handleSend}
              disabled={isGenerating}
              className="term-shell__send"
              style={{
                width: '34px', height: '34px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isGenerating ? 'rgb(var(--accent) / 0.3)' : 'rgb(var(--accent))',
                border: '1px solid rgb(var(--term-border) / 0.14)',
                color: isGenerating ? 'rgb(var(--accent-fg) / 0.5)' : 'rgb(var(--accent-fg))',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: isGenerating ? 'none' : '0 2px 12px rgb(var(--accent) / 0.35)',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isGenerating) {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.07) translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgb(var(--accent) / 0.45)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = isGenerating ? 'none' : '0 2px 12px rgb(var(--accent) / 0.35)';
              }}
              aria-label="Send"
            >
              {isGenerating
                ? <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                : <Send size={13} strokeWidth={2.2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
