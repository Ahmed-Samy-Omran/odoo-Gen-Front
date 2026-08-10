import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronDown,
  Cloud,
  Cpu,
  Globe,
  Layers,
  PieChart as PieChartIcon,
  RefreshCw,
  Sparkles,
  Trash2,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  clearTestUsageData,
  fetchUsageStats,
  type ModelIntelligence,
  type QuotaStatus,
  type UsageStatsResponse,
} from '../services/api';

type RangeKey = 'today' | '7d' | '30d' | 'all';

const RANGE_PRESETS: Array<{ id: RangeKey; label: string; days: number }> = [
  { id: 'today', label: 'Today', days: 0 },
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: 'all', label: 'All time', days: 3650 },
];

const PROVIDER_PALETTE = ['#38bdf8', '#a855f7', '#34d399', '#fb923c', '#f472b6', '#22d3ee', '#a3e635', '#c084fc'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PROVIDER_ICONS: Array<[string, LucideIcon]> = [
  ['gemini', Sparkles],
  ['openrouter', Globe],
  ['openai', Brain],
  ['ollama', Cpu],
  ['deepseek', Waves],
  ['anthropic', Layers],
  ['claude', Layers],
];
const DEFAULT_PROVIDER_ICON: LucideIcon = Cloud;

const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return compactFormatter.format(value);
}

function quotaColor(percent: number): string {
  if (percent >= 90) return '#f87171';
  if (percent >= 75) return '#fbbf24';
  return '#34d399';
}

function quotaUsageLabel(entry: QuotaStatus): string {
  return `${formatCompact(entry.current_usage)} / ${formatCompact(entry.limit)} ${entry.unit}`;
}

function rangeLabel(range: RangeKey): string {
  const preset = RANGE_PRESETS.find((p) => p.id === range);
  if (range === 'today') return "Today's usage";
  if (range === 'all' || !preset) return 'Usage over all time';
  return `Usage over the last ${preset.days} days`;
}

function usageValueLabel(
  name: string,
  requests: number,
  tokens: number,
  quotaUnitMap: Record<string, 'Requests' | 'Tokens'>,
): string {
  if (quotaUnitMap[name] === 'Requests') {
    return `${formatCompact(requests)} Requests`;
  }
  return `${formatCompact(tokens)} Tokens`;
}

function SuccessBadge({ successRate, requests }: { successRate: number; requests?: number }) {
  if (requests === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/30">
        No calls
      </span>
    );
  }
  const pct = Math.round(Number(successRate) || 0);
  const tone =
    pct >= 90
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      : pct >= 70
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
        : 'border-rose-500/20 bg-rose-500/10 text-rose-400';
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>
      {pct}% Success
    </span>
  );
}

function ModelCard({
  model,
  color,
  icon: Icon,
  delay,
  mode,
}: {
  model: ModelIntelligence;
  color: string;
  icon: LucideIcon;
  delay: number;
  mode: 'total' | 'today';
}) {
  const unit = model.unit ?? 'Tokens';
  const isToday = mode === 'today';
  const totalUsage = unit === 'Requests' ? (model.requests ?? 0) : (model.total_tokens ?? 0);
  const shownUsage = isToday ? (model.today_usage ?? 0) : totalUsage;
  const successRate = isToday ? (model.today_success_rate ?? model.success_rate) : model.success_rate;
  const requestCount = isToday ? (model.today_requests ?? model.requests ?? 0) : (model.requests ?? 0);

  const percent = Math.max(0, isToday ? (model.today_percent_used ?? model.percent_used) : model.percent_used);
  const barColor = quotaColor(percent);
  const remaining = Math.max(
    0,
    isToday ? (model.today_remaining_quota ?? model.remaining_quota) : model.remaining_quota,
  );
  const low = percent >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className="glass-card-hover flex flex-col p-4 sm:p-5"
      style={
        low
          ? { borderColor: 'rgba(248,113,113,0.45)', boxShadow: '0 0 24px rgba(248,113,113,0.28), inset 0 1px 0 rgba(255,255,255,0.06)' }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-white/90">{model.model_name}</span>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10"
          style={{ background: `${color}14`, color, boxShadow: `0 0 12px ${color}22` }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 text-xl font-semibold tracking-tight text-white">
        {formatCompact(shownUsage)}
        <span className="ml-1.5 text-xs font-medium text-white/40">{unit}</span>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <SuccessBadge successRate={successRate} requests={requestCount} />
      {isToday ? (
        <span className="truncate text-[11px] text-white/40">
          Remaining: <span className="font-semibold text-white/70">{formatCompact(remaining)}</span>
        </span>
      ) : (
        <span className="truncate text-[11px] text-white/40">
          {formatCompact(requestCount)} requests
        </span>
      )}
    </div>

    <div className="mt-auto pt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percent)}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: delay + 0.08 }}
          style={{ background: barColor, boxShadow: `0 0 8px ${barColor}55` }}
        />
      </div>
    </div>
  </motion.div>
);
}

function formatDayLabel(value: string): string {
  const [year, month, day] = value.split('-');
  const monthIndex = Number(month) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11 || !day) return value;
  return `${MONTHS[monthIndex]} ${Number(day)}`;
}

function providerColor(name: string): string {
  const safe = String(name ?? '');
  let hash = 0;
  for (let i = 0; i < safe.length; i += 1) {
    hash = (hash * 31 + safe.charCodeAt(i)) >>> 0;
  }
  return PROVIDER_PALETTE[hash % PROVIDER_PALETTE.length];
}

function getProviderIcon(name: string): LucideIcon {
  const key = String(name ?? '').toLowerCase();
  const match = PROVIDER_ICONS.find(([needle]) => key.includes(needle));
  return match ? match[1] : DEFAULT_PROVIDER_ICON;
}

function shadeColor(hex: string, ratio: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const num = parseInt(value, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const adjust = (c: number): number => {
    const next = ratio < 0 ? c * (1 + ratio) : c + (255 - c) * ratio;
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  r = adjust(r);
  g = adjust(g);
  b = adjust(b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function inferProviderFromModel(name: string): string {
  const key = String(name ?? '').toLowerCase();
  if (key.includes('gemini')) return 'Gemini';
  if (key.includes('claude')) return 'Anthropic';
  if (key.includes('gpt') || key.includes('openai') || key.includes('davinci')) return 'OpenAI';
  if (key.includes('llama') || key.includes('mistral') || key.includes('mixtral')) return 'Ollama';
  if (key.includes('deepseek')) return 'DeepSeek';
  if (key.includes('grok')) return 'xAI';
  return 'unknown';
}

interface DayModelInfo {
  name: string;
  provider: string;
  color: string;
  tokens: number;
}

function ChartTooltip(props: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number | string;
    color?: string;
    payload?: { date?: string | number; models?: DayModelInfo[] };
  }>;
  label?: string | number;
  showDayModels?: boolean;
}) {
  const { active, payload, label, showDayModels = true } = props;
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const dayModels = (row?.models ?? []).slice(0, 6);
  return (
    <div className="max-w-xs rounded-xl border border-white/10 bg-[#0d0d0d]/95 px-3 py-2 shadow-2xl backdrop-blur-md">
      <div className="mb-1.5 text-xs font-medium text-white/60">{label}</div>
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <div key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-1.5 text-white/70">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-white">{formatCompact(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
      {showDayModels && dayModels.length > 0 && (
        <>
          <div className="mt-2 border-t border-white/10 pt-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">
            Models
          </div>
          <div className="mt-1 flex flex-col gap-1">
            {dayModels.map((m) => (
              <div key={m.name} className="flex items-center justify-between gap-5 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-white/70">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }}
                  />
                  <span className="truncate">{m.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-white">{formatCompact(m.tokens)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ModelPieTooltip(props: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; payload?: { color?: string; name?: string } }>;
}) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0d0d]/95 px-3 py-2 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
        <span className="h-2 w-2 rounded-full" style={{ background: entry.payload?.color }} />
        {entry.name}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{formatCompact(Number(entry.value ?? 0))} tokens</div>
    </div>
  );
}

interface RankingItemProps {
  index: number;
  name: string;
  subtitle?: string;
  color: string;
  percent: number;
  valueLabel: string;
  successRate: number;
  requests: number;
  icon: LucideIcon;
  delay: number;
}

function RankingItem({ index, name, subtitle, color, percent, valueLabel, successRate, requests, icon: Icon, delay }: RankingItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      <div className="flex items-center gap-3">
        <span className="w-5 shrink-0 text-xs font-semibold text-white/25">{index + 1}</span>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10"
          style={{ background: `${color}14`, color, boxShadow: `0 0 12px ${color}22` }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium text-white/85">{name}</span>
              {subtitle && <span className="shrink-0 text-[11px] font-normal text-white/35">{subtitle}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="text-xs font-semibold text-white/85">{valueLabel}</span>
              <SuccessBadge successRate={successRate} requests={requests} />
            </div>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent)}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: delay + 0.05 }}
              style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card animate-pulse p-4 sm:p-5">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-3 h-7 w-28 rounded bg-white/10" />
            <div className="mt-3 h-3 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
        <div className="glass-card animate-pulse h-96 p-5 lg:col-span-7" />
        <div className="glass-card animate-pulse h-96 p-5 lg:col-span-3" />
      </div>
    </div>
  );
}

export function MonitorView() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [model, setModel] = useState<string>('all');
  const [cardMode, setCardMode] = useState<'total' | 'today'>('total');
  const [rankingMode, setRankingMode] = useState<'provider' | 'model'>('provider');
  const [chartMode, setChartMode] = useState<'provider' | 'model'>('provider');
  const [clearing, setClearing] = useState(false);
  const [data, setData] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const preset = RANGE_PRESETS.find((p) => p.id === range) ?? RANGE_PRESETS[1];
    setLoading(true);
    setError(null);
    fetchUsageStats(preset.days, model === 'all' ? null : model)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load usage stats');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, model, refreshKey]);

  const handleRetry = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleClearTestData = useCallback(async () => {
    const confirmed = window.confirm(
      'Delete all usage logs recorded with provider_name "test_usage_tracking"? This cannot be undone.',
    );
    if (!confirmed) return;
    setClearing(true);
    try {
      const result = await clearTestUsageData();
      setRefreshKey((k) => k + 1);
      toast.success(result.deleted > 0 ? `Deleted ${result.deleted} test usage row${result.deleted === 1 ? '' : 's'}` : 'No test usage rows found');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear test data');
    } finally {
      setClearing(false);
    }
  }, []);

  const providers = useMemo(() => {
    const totals = data?.totals;
    if (!totals) return [];
    return Object.entries(totals.providers)
      .map(([name, stat]) => ({ name, ...stat }))
      .sort((a, b) => b.total_tokens - a.total_tokens);
  }, [data]);

  const modelBreakdown = useMemo(() => {
    const source = data?.models_breakdown ?? {};
    return Object.entries(source)
      .map(([name, stat]) => ({
        name,
        provider: stat.provider || inferProviderFromModel(name),
        total_tokens: stat.total_tokens,
        requests: stat.requests,
        success: stat.success,
      }))
      .sort((a, b) => b.total_tokens - a.total_tokens);
  }, [data]);

  const modelMetaMap = useMemo(() => {
    const map: Record<string, { provider: string; color: string }> = {};
    const perProvider: Record<string, Array<{ name: string }>> = {};
    for (const m of modelBreakdown) {
      if (!perProvider[m.provider]) perProvider[m.provider] = [];
      perProvider[m.provider].push({ name: m.name });
      map[m.name] = { provider: m.provider, color: '#ffffff' };
    }
    for (const [provider, models] of Object.entries(perProvider)) {
      const base = providerColor(provider);
      const count = models.length;
      models.forEach((m, i) => {
        const spread = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
        map[m.name] = { ...map[m.name], color: shadeColor(base, spread * 0.22) };
      });
    }
    return map;
  }, [modelBreakdown]);

  const chartData = useMemo(() => {
    return (data?.daily ?? []).map((day) => {
      const row: Record<string, number | string | DayModelInfo[]> = { date: formatDayLabel(day.date) };
      for (const p of providers) {
        row[p.name] = day.providers[p.name]?.total_tokens ?? 0;
      }
      for (const m of modelBreakdown) {
        row[m.name] = day.models[m.name]?.total_tokens ?? 0;
      }
      row.models = Object.entries(day.models ?? {})
        .map(([name, stat]) => ({
          name,
          provider: modelMetaMap[name]?.provider ?? 'unknown',
          color: modelMetaMap[name]?.color ?? providerColor('unknown'),
          tokens: stat.total_tokens,
        }))
        .sort((a, b) => b.tokens - a.tokens);
      return row;
    });
  }, [data, providers, modelBreakdown, modelMetaMap]);

  const pieData = useMemo(() => {
    return modelBreakdown.map((m) => ({
      name: m.name,
      value: m.total_tokens,
      color: modelMetaMap[m.name]?.color ?? providerColor(m.provider),
    }));
  }, [modelBreakdown, modelMetaMap]);

  const totalTokens = data?.totals.total_tokens ?? 0;
  const hasData = (data?.daily.length ?? 0) > 0 || providers.length > 0;

  const quotaStatus = useMemo(() => (data?.quota_status ?? []), [data]);

  const quotaUnitMap = useMemo(() => {
    const map: Record<string, 'Requests' | 'Tokens'> = {};
    for (const q of quotaStatus) {
      map[q.model_name] = q.unit;
    }
    return map;
  }, [quotaStatus]);

  const modelCards = useMemo(() => {
    const unitOf = (m: ModelIntelligence): 'Requests' | 'Tokens' => m.unit ?? 'Tokens';
    const usageOf = (m: ModelIntelligence): number =>
      cardMode === 'today'
        ? m.today_usage ?? 0
        : unitOf(m) === 'Requests'
          ? (m.requests ?? 0)
          : (m.total_tokens ?? 0);

    return (data?.models ?? [])
      .filter((m): m is ModelIntelligence => typeof m === 'object' && m !== null && typeof m.model_name === 'string')
      .map((m) => {
        const provider = modelMetaMap[m.model_name]?.provider ?? inferProviderFromModel(m.model_name);
        return {
          model: m,
          color: modelMetaMap[m.model_name]?.color ?? providerColor(provider),
          icon: getProviderIcon(provider),
        };
      })
      .sort((a, b) => usageOf(b.model) - usageOf(a.model));
  }, [data, modelMetaMap, cardMode]);

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-wrap items-start justify-between gap-3"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">API Monitor</h1>
            <p className="mt-0.5 text-sm text-white/35">Provider usage, tokens and success across the gateway</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRange(preset.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    range === preset.id ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="appearance-none rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-3 pr-8 text-xs font-medium text-white/70 outline-none transition-colors hover:text-white focus:border-white/25"
              >
                <option value="all" className="bg-[#111] text-white/80">
                  All models
                </option>
                {(data?.model_names ?? []).map((m) => (
                  <option key={m} value={m} className="bg-[#111] text-white/80">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            </div>

            <button
              type="button"
              onClick={handleClearTestData}
              disabled={clearing || loading}
              title="Clear test data (provider_name = test_usage_tracking)"
              aria-label="Clear test data"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 text-[11px] font-medium text-rose-300/90 transition hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-40"
            >
              <Trash2 className={`h-3.5 w-3.5 ${clearing ? 'animate-pulse' : ''}`} />
              {clearing ? 'Clearing…' : 'Clear test data'}
            </button>

            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {error ? (
          <div className="glass-card flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
            <p className="max-w-md text-sm text-white/60">{error}</p>
            <button type="button" onClick={handleRetry} className="cyber-button-accent px-4 py-2 text-sm">
              Try again
            </button>
          </div>
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {hasData ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                {modelCards.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white/80">Model Intelligence</h2>
                        <p className="text-xs text-white/30">
                          {cardMode === 'today'
                            ? "Today's usage per model against its daily quota"
                            : 'Total usage per model in the selected range'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                        <button
                          type="button"
                          onClick={() => setCardMode('total')}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                            cardMode === 'total' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                          }`}
                        >
                          Total usage
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardMode('today')}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                            cardMode === 'today' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                          }`}
                        >
                          Today only
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {modelCards.map((mc, index) => (
                        <ModelCard
                          key={mc.model.model_name}
                          model={mc.model}
                          color={mc.color}
                          icon={mc.icon}
                          delay={index * 0.06}
                          mode={cardMode}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {quotaStatus.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.16 }}
                    className="glass-card flex flex-col p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white/80">Free Tier Health</h2>
                        <p className="text-xs text-white/30">{rangeLabel(range)} against each model's quota</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {quotaStatus.map((q) => {
                        const color = quotaColor(q.percent_used);
                        return (
                          <div key={q.model_name} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-medium text-white/80">{q.model_name}</span>
                              <span className="shrink-0 text-[11px] font-semibold" style={{ color }}>
                                {((q.percent_used ?? 0).toFixed(0))}%
                              </span>
                            </div>
                            <div className="mt-1.5 text-sm font-semibold text-white">{quotaUsageLabel(q)}</div>
                            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, q.percent_used)}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                                style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                    className="glass-card flex flex-col overflow-hidden p-4 sm:p-5 lg:col-span-7"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white/80">Usage Over Time</h2>
                        <p className="text-xs text-white/30">
                          {chartMode === 'provider' ? 'Daily token usage by provider' : 'Daily token usage by model'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
                          <button
                            type="button"
                            onClick={() => setChartMode('provider')}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                              chartMode === 'provider' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                            }`}
                          >
                            By Provider
                          </button>
                          <button
                            type="button"
                            onClick={() => setChartMode('model')}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                              chartMode === 'model' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                            }`}
                          >
                            By Model
                          </button>
                        </div>
                        <div className="flex max-w-56 flex-wrap items-center gap-2">
                          {(chartMode === 'provider' ? providers : modelBreakdown).map((item) => (
                            <span key={item.name} className="inline-flex items-center gap-1.5 text-[11px] text-white/50">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  background:
                                    chartMode === 'provider'
                                      ? providerColor(item.name)
                                      : modelMetaMap[item.name]?.color ?? providerColor('unknown'),
                                  boxShadow: `0 0 6px ${
                                    chartMode === 'provider'
                                      ? providerColor(item.name)
                                      : modelMetaMap[item.name]?.color ?? providerColor('unknown')
                                  }`,
                                }}
                              />
                              <span className="truncate">{item.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-72 min-h-0 w-full sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
                          <defs>
                            {(chartMode === 'provider' ? providers : modelBreakdown).map((item, index) => (
                              <filter
                                key={`${item.name}-${chartMode}`}
                                id={`line-glow-${chartMode}-${index}`}
                                x="-20%"
                                y="-20%"
                                width="140%"
                                height="140%"
                              >
                                <feDropShadow
                                  dx="0"
                                  dy="0"
                                  stdDeviation="4"
                                  floodColor={chartMode === 'provider' ? providerColor(item.name) : modelMetaMap[item.name]?.color ?? providerColor('unknown')}
                                  floodOpacity="0.55"
                                />
                              </filter>
                            ))}
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            minTickGap={24}
                          />
                          <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={52}
                            tickFormatter={(value: number) => formatCompact(value)}
                          />
                          <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }}
                            content={<ChartTooltip showDayModels={chartMode === 'provider'} />}
                          />
                          {(chartMode === 'provider' ? providers : modelBreakdown).map((item, index) => (
                            <Line
                              key={`${item.name}-${chartMode}`}
                              type="monotone"
                              dataKey={item.name}
                              stroke={chartMode === 'provider' ? providerColor(item.name) : modelMetaMap[item.name]?.color ?? providerColor('unknown')}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0, fill: chartMode === 'provider' ? providerColor(item.name) : modelMetaMap[item.name]?.color ?? providerColor('unknown') }}
                              filter={`url(#line-glow-${chartMode}-${index})`}
                              isAnimationActive
                              animationDuration={900}
                              animationEasing="ease-out"
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.28 }}
                    className="glass-card flex flex-col p-4 sm:p-5 lg:col-span-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white/80">Ranking</h2>
                        <p className="text-xs text-white/30">Share of total token usage</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
                        <button
                          type="button"
                          onClick={() => setRankingMode('provider')}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                            rankingMode === 'provider' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                          }`}
                        >
                          By Provider
                        </button>
                        <button
                          type="button"
                          onClick={() => setRankingMode('model')}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                            rankingMode === 'model' ? 'bg-white/10 text-white shadow-glow-sm' : 'text-white/45 hover:text-white/80'
                          }`}
                        >
                          By Model
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 flex max-h-[24rem] flex-col gap-4 overflow-y-auto pr-1">
                      {rankingMode === 'provider'
                        ? providers.map((p, index) => (
                            <RankingItem
                              key={p.name}
                              index={index + 1}
                              name={p.name}
                              color={providerColor(p.name)}
                              percent={totalTokens > 0 ? (p.total_tokens / totalTokens) * 100 : 0}
                              icon={getProviderIcon(p.name)}
                              delay={0.35 + index * 0.06}
                              valueLabel={usageValueLabel(p.name, p.requests, p.total_tokens, quotaUnitMap)}
                              successRate={p.requests > 0 ? (p.success / p.requests) * 100 : 0}
                              requests={p.requests}
                            />
                          ))
                        : modelBreakdown.map((m, index) => (
                            <RankingItem
                              key={m.name}
                              index={index + 1}
                              name={m.name}
                              subtitle={m.provider}
                              color={modelMetaMap[m.name]?.color ?? providerColor(m.provider)}
                              percent={totalTokens > 0 ? (m.total_tokens / totalTokens) * 100 : 0}
                              icon={getProviderIcon(m.provider)}
                              delay={0.35 + index * 0.06}
                              valueLabel={usageValueLabel(m.name, m.requests, m.total_tokens, quotaUnitMap)}
                              successRate={m.requests > 0 ? (m.success / m.requests) * 100 : 0}
                              requests={m.requests}
                            />
                          ))}
                      {rankingMode === 'provider' && providers.length === 0 && (
                        <p className="text-sm text-white/30">No provider data yet.</p>
                      )}
                      {rankingMode === 'model' && modelBreakdown.length === 0 && (
                        <p className="text-sm text-white/30">No model data yet.</p>
                      )}
                    </div>
                  </motion.section>
                </div>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.34 }}
                  className="glass-card flex flex-col p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-white/80">Token Distribution by Model</h2>
                      <p className="text-xs text-white/30">Which specific AI models consume the most tokens</p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/40">
                      <PieChartIcon className="h-4 w-4" />
                    </div>
                  </div>

                  {pieData.length === 0 ? (
                    <p className="mt-6 text-sm text-white/30">No model data yet.</p>
                  ) : (
                    <div className="mt-4 flex flex-col gap-6 md:flex-row">
                      <div className="relative h-56 w-full md:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="62%"
                              outerRadius="88%"
                              paddingAngle={2}
                              stroke="none"
                              isAnimationActive
                              animationDuration={900}
                            >
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<ModelPieTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-white">{formatCompact(totalTokens)}</div>
                            <div className="text-[10px] uppercase tracking-widest text-white/35">tokens</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto md:max-h-60">
                        {pieData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2.5 text-xs">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
                            />
                            <span className="min-w-0 flex-1 truncate text-white/80">{entry.name}</span>
                            <span className="shrink-0 text-[11px] text-white/45">{formatCompact(entry.value)} Tokens</span>
                            <span className="shrink-0 text-[11px] text-white/35">
                              {modelMetaMap[entry.name]?.provider ?? ''}
                            </span>
                            <span className="w-12 shrink-0 text-right font-semibold text-white/70">
                              {totalTokens > 0 ? ((entry.value / totalTokens) * 100).toFixed(1) : '0.0'}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card flex flex-col items-center justify-center gap-3 p-12 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <BarChart3 className="h-6 w-6 text-white/30" />
                </div>
                <p className="text-sm font-medium text-white/70">No usage data yet</p>
                <p className="max-w-sm text-xs text-white/35">
                  Usage metrics appear here once modules are generated through the AI gateway.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
