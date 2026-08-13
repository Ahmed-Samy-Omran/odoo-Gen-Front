import React from 'react';
import { Github, FileArchive, ArrowRight, Rocket, Play } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

interface WelcomeDashboardProps {
  onStartGenerating: () => void;
  onTryDemo?: () => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ onStartGenerating, onTryDemo }) => {
  const { theme } = useTheme();

  if (theme === 'paper') {
    return (
      <div className="h-full w-full overflow-y-auto">
        <div className="mx-auto grid max-w-5xl gap-10 px-8 py-14 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
          <section className="space-y-6">
            <p className="eyebrow">A journal of generated software</p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.02em] text-fg md:text-6xl">
              Odoo Gen
            </h1>
            <p className="max-w-md text-[15px] leading-relaxed text-fg-muted">
              Describe a module; the press prints production-ready Odoo code — shipped to GitHub or
              folded into a ZIP for direct deployment.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="button" onClick={onStartGenerating} className="ui-btn ui-btn--accent px-7 py-3">
                Start generating
                <ArrowRight className="h-4 w-4" />
              </button>
              {onTryDemo && (
                <button type="button" onClick={onTryDemo} className="ui-btn ui-btn--ghost px-7 py-3">
                  Try the demo
                </button>
              )}
            </div>
            <div className="flex items-center gap-6 pt-4 text-xs uppercase tracking-[0.18em] text-fg-faint">
              <span className="inline-flex items-center gap-2">
                <Github className="h-3.5 w-3.5" /> GitHub
              </span>
              <span className="h-3 w-px bg-fg/20" aria-hidden="true" />
              <span className="inline-flex items-center gap-2">
                <FileArchive className="h-3.5 w-3.5" /> ZIP
              </span>
            </div>
          </section>

          <aside className="border-t border-fg/15 pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            <p className="eyebrow mb-5">Contents</p>
            <ol className="divide-y divide-fg/[0.12]">
              {[
                { n: '01', title: 'AI-Powered Generation', body: 'Requirements gathered in conversation, then authored automatically.' },
                { n: '02', title: 'GitHub Integration', body: 'Push the finished module straight to a repository.' },
                { n: '03', title: 'Direct Download', body: 'Export a deployment-ready ZIP, no accounts required.' },
              ].map((item) => (
                <li key={item.n} className="py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="mno text-xs text-accent">{item.n}</span>
                    <h3 className="font-display text-lg font-semibold text-fg">{item.title}</h3>
                  </div>
                  <p className="mt-1 pl-9 text-[13px] leading-relaxed text-fg-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    );
  }

  if (theme === 'aurora') {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-y-auto px-6 py-8">
        <div className="w-full max-w-xl space-y-8">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-fg-faint">
            <span className="mno">OG-SYS // v17.0</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent))]" aria-hidden="true" />
              NOMINAL
            </span>
          </div>

          <div className="relative">
            {/* orbital rings */}
            <div
              className="pointer-events-none absolute -inset-8 rounded-[50%] border border-fg/[0.08]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -inset-16 rounded-[50%] border border-dashed border-fg/[0.06]"
              aria-hidden="true"
            />

            <div className="relative rounded-2xl border border-fg/10 bg-[rgb(var(--surface))/0.6] p-8 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <p className="eyebrow text-accent">Module generator</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg">Odoo Gen</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
                Conversational brief in, production Odoo module out. Route to GitHub or download the bundle.
              </p>

              <div className="mt-8 divide-y divide-fg/10 border-y border-fg/10">
                {[
                  { k: 'capabilities', v: 'AI chat / JSON / demo' },
                  { k: 'output', v: 'Python + XML module' },
                  { k: 'deploy', v: 'GitHub · local ZIP' },
                ].map((row) => (
                  <div key={row.k} className="flex items-baseline justify-between gap-6 py-3">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-fg-faint">{row.k}</span>
                    <span className="mno text-right text-xs text-fg">{row.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={onStartGenerating} className="ui-btn ui-btn--accent flex-1 px-6 py-3">
                  <Rocket className="h-4 w-4" />
                  Initiate generation
                </button>
                {onTryDemo && (
                  <button type="button" onClick={onTryDemo} className="ui-btn ui-btn--ghost px-6 py-3">
                    <Play className="h-4 w-4" />
                    Demo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-fg-faint">
            <span className="inline-flex items-center gap-2">
              <Github className="h-3.5 w-3.5" /> github
            </span>
            <span className="inline-flex items-center gap-2">
              <FileArchive className="h-3.5 w-3.5" /> zip
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* carbon — machined instrument */
  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto px-6 py-8">
      <div className="w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.26em] text-fg-faint">
          <span className="mno">OG//UNIT-01</span>
          <span className="mno">ODOO 17.0</span>
        </div>

        <div className="plate relative overflow-hidden p-0">
          {/* corner brackets */}
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-accent" aria-hidden="true" />
          <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-accent" aria-hidden="true" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-accent" aria-hidden="true" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-accent" aria-hidden="true" />

          {/* instrument header rail */}
          <div className="flex items-center justify-between border-b border-dashed border-fg/15 px-6 py-2.5 text-[9px] uppercase tracking-[0.24em] text-fg-faint">
            <span className="mno">module foundry // op-01</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="mno text-fg-muted">STANDBY</span>
            </span>
          </div>

          <div className="grid gap-px bg-fg/[0.1] md:grid-cols-[1.4fr_1fr]">
            {/* main */}
            <div className="bg-[rgb(var(--plate-soft))] p-7 sm:p-9">
              <p className="eyebrow text-accent">Module foundry</p>
              <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                ODOO GEN
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-plate-note">
                Describe the module in conversation, then route the output to a GitHub repository or a local ZIP.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="button" onClick={onStartGenerating} className="ui-btn ui-btn--accent px-7 py-3">
                  Initiate generation
                  <ArrowRight className="h-4 w-4" />
                </button>
                {onTryDemo && (
                  <button type="button" onClick={onTryDemo} className="ui-btn ui-btn--ghost px-6 py-3">
                    Run demo (no AI)
                  </button>
                )}
              </div>
            </div>

            {/* instrument readout */}
            <div className="flex flex-col justify-between gap-6 bg-[rgb(var(--plate))] p-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.24em] text-fg-faint">Built output</p>
                <div className="mt-3 space-y-px">
                  {[
                    { k: 'MODULES', v: '14' },
                    { k: 'LINES', v: '38.2k' },
                    { k: 'MEAN TIME', v: '2 min' },
                  ].map((row) => (
                    <div key={row.k} className="flex items-baseline justify-between border-b border-dashed border-fg/10 py-2">
                      <span className="text-[9px] tracking-[0.2em] text-fg-faint">{row.k}</span>
                      <span className="mno text-lg font-semibold tabular-nums text-accent">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-fg-faint">
                  <span className="inline-flex items-center gap-2">
                    <Github className="h-3 w-3" /> deploy: github
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileArchive className="h-3 w-3" /> export: zip
                  </span>
                </div>
                {/* meter */}
                <div className="flex h-1.5 gap-px" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <span key={i} className={`flex-1 ${i < 3 ? 'bg-accent/80' : 'bg-fg/10'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
