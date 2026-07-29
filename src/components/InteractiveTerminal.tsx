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
    ? '#818cf8'
    : '#64748b';

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      style={{ width: 'calc(100% - 2rem)', maxWidth: '780px' }}
    >
      <div
        style={{
          background: 'rgba(11, 13, 20, 0.97)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.075)',
          borderRadius: '22px',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.035) inset',
            '0 28px 80px rgba(0,0,0,0.65)',
            '0 8px 32px rgba(0,0,0,0.45)',
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        {/* ── TASK PROGRESS header ─────────────────────── */}
        <div
          style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
        >
          {/* label + controls */}
          <div
            className="flex items-center justify-between px-5 pt-4 pb-3"
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
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
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                  {isGenerating ? 'Running' : jobStatus?.status === 'done' ? 'Done' : jobStatus?.status === 'error' ? 'Error' : 'Idle'}
                </span>
              </div>
              {/* collapse toggle */}
              <button
                onClick={() => setExpanded(v => !v)}
                style={{ color: 'rgba(255,255,255,0.2)', padding: '2px' }}
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
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}
            >
              {logs.length === 0 ? (
                /* empty state */
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11.5px',
                    color: 'rgba(255,255,255,0.2)',
                    lineHeight: '1.7',
                  }}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" style={{ color: '#818cf8' }} />
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
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', lineHeight: '1.6' }}
                    >
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        style={{ color: '#818cf8', flexShrink: 0, marginTop: '3px' }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{line}</span>
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
                color: 'rgba(255,255,255,0.85)',
                fontSize: '13.5px',
                caretColor: '#818cf8',
              }}
            />
            {/* sending indicator dot */}
            <span
              style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: isGenerating ? '#818cf8' : 'rgba(129,140,248,0.4)',
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
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  color: 'rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
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
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px',
                borderRadius: '10px',
                fontSize: '11.5px', fontWeight: 500,
                color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
              }}
            >
              <Monitor size={13} strokeWidth={1.8} />
              Manus Desktop
            </button>

            {/* Mic */}
            <button
              style={{
                width: '32px', height: '32px',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
              }}
              aria-label="Voice input"
            >
              <Mic size={14} strokeWidth={1.8} />
            </button>

            {/* Send / Generate — accent white circle */}
            <button
              onClick={handleSend}
              disabled={isGenerating}
              style={{
                width: '34px', height: '34px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isGenerating ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: isGenerating ? 'rgba(255,255,255,0.4)' : '#111',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: isGenerating ? 'none' : '0 2px 10px rgba(0,0,0,0.4)',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isGenerating) {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.07) translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.45)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = isGenerating ? 'none' : '0 2px 10px rgba(0,0,0,0.4)';
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
