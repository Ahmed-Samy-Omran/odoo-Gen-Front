import { useState, useCallback, useRef, useEffect, Component, type ReactNode } from 'react';
import { Sidebar } from './components/Sidebar';
import { GenBar } from './components/GenBar';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { MonitorView } from './components/MonitorView';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { AmbientBackdrop } from './components/AmbientBackdrop';
import { ToastProvider } from './components/ToastProvider';
import { HomePageSkeleton } from './components/Skeleton';
import { toast } from 'react-hot-toast';
import { ModelSettingsPanel } from './components/ModelSettingsPanel';
import { SystemBuildView } from './components/SystemBuildView';
import { LoginView } from './components/LoginView';
import { QuotaExceededModal } from './components/QuotaExceededModal';
import { ArrowDown, Copy, Check, ChevronDown, ChevronUp, MessageSquare, Network, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatePresence, motion } from 'framer-motion';
import {
  fetchJobFiles,
  fetchJobRestore,
  generateModule,
  isQuotaExceededError,
  notifyQuotaExceeded,
  syncJobConfig,
  QUOTA_EXCEEDED_EVENT,
  API_BASE_URL,
  type ChatMessage,
  type ChatResponse,
  type GeneratorPayload,
  type GeneratedFile,
  type JobStatus,
  type SchemaPreview,
} from './services/api';
import { useAuth } from './context/AuthContext';
import { buildSchemaFromPayload } from './utils/diagramBuilder';
import { buildDemoPayload, schemaFromRawConfig, type RawModuleConfig } from './utils/demoGenerate';
import { INITIAL_AI_MESSAGE } from './constants/chat';

type ViewType = 'generator' | 'history' | 'settings' | 'monitor';
type StatusType = 'idle' | 'generating' | 'success' | 'error';

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function hasArabicText(text: string): boolean {
  return ARABIC_CHAR_REGEX.test(text);
}

function getMessageDirection(text: string): 'rtl' | 'ltr' {
  return hasArabicText(text) ? 'rtl' : 'ltr';
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  h2: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  h3: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  p: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  ul: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  ol: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  li: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong>{children}</strong>,
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => (
    <code
      className={inline
        ? 'rounded bg-[rgb(var(--fg)/0.08)] px-1.5 py-0.5 font-mono text-[12px] text-[rgb(var(--fg))]'
        : 'font-mono text-[12px] leading-6 text-[rgb(var(--fg))] whitespace-pre-wrap'}
    >
      {children}
    </code>
  ),
};

interface ModelField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  default?: string | null;
  unique?: boolean;
}

interface Model {
  id: string;
  name: string;
  fields: ModelField[];
}

function formatMessageTime(value?: string): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shouldCollapseMessage(content: string): boolean {
  const lineCount = content.split(/\r?\n/).length;
  return content.length > 300 || lineCount > 5;
}

class ViewErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[MonitorView] render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="glass-card max-w-md p-6">
            <h2 className="text-sm font-semibold text-rose-400">Something went wrong</h2>
            <p className="mt-2 break-words text-xs text-white/60">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="cyber-button-accent mt-4 px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAdminUser = user?.isAdmin ?? false;
  const [activeView, setActiveView] = useState<ViewType>('generator');
  const [adminMode, setAdminMode] = useState(true);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  // Admin Mode gates the admin-only Monitor view; non-admins never see it.
  const adminModeEnabled = isAdminUser && adminMode;
  const effectiveView: ViewType = !adminModeEnabled && activeView === 'monitor' ? 'generator' : activeView;
  const [status, setStatus] = useState<StatusType>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isHomeLoading, setIsHomeLoading] = useState(false);
  const [chatAutoScroll] = useState(true);
  const [isChatScrolledUp, setIsChatScrolledUp] = useState(false);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const scrollChatToBottom = () => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
      setIsChatScrolledUp(false);
    }
  };
  const [models, setModels] = useState<Model[]>(() => {
    try {
      const stored = localStorage.getItem('odoo_models');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>(() => {
    try {
      const stored = localStorage.getItem('odoo_deployment_strategy');
      return (stored as 'github' | 'local_zip') || 'local_zip';
    } catch {
      return 'local_zip';
    }
  });
  const [repositoryUrl, setRepositoryUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('odoo_repository_url') || '';
    } catch {
      return '';
    }
  });
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>(() => {
    try {
      const stored = localStorage.getItem('odoo_generated_files');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    try {
      return localStorage.getItem('odoo_selected_file') || null;
    } catch {
      return null;
    }
  });
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
  const [chatResetKey, setChatResetKey] = useState(0);
  const [restoredMessages, setRestoredMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: INITIAL_AI_MESSAGE, createdAt: new Date().toISOString() }]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const isAiTyping = restoredMessages.some((message) => message.role === 'user' && message.status === 'sending');
  const [copiedMessageKey, setCopiedMessageKey] = useState<string | null>(null);
  const [expandedMessageKeys, setExpandedMessageKeys] = useState<Record<string, boolean>>({});
  const [workspaceTab, setWorkspaceTab] = useState<'chat' | 'build'>('chat');

  // Open the quota-exceeded modal whenever any request reports a 403 quota error.
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaModalOpen(true);
    window.addEventListener(QUOTA_EXCEEDED_EVENT, handleQuotaExceeded);
    return () => window.removeEventListener(QUOTA_EXCEEDED_EVENT, handleQuotaExceeded);
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrapHomeShell = async () => {
      try {
        const savedVersion = localStorage.getItem('odoo_version');
        const savedJob = localStorage.getItem('odoo_active_job');
        const savedSidebar = localStorage.getItem('odoo_sidebar_open');
        const savedSchema = localStorage.getItem('odoo_erd_schema');

        void savedVersion;
        void savedJob;
        void savedSidebar;
        void savedSchema;

        await new Promise((resolve) => window.setTimeout(resolve, 450));
      } catch {
        // ignore bootstrap issues and proceed to the real UI
      } finally {
        if (mounted) {
          setIsHomeLoading(false);
        }
      }
    };

    void bootstrapHomeShell();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!chatAutoScroll || !chatBottomRef.current) return;

    chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [restoredMessages, isAiTyping, chatAutoScroll]);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [technicalSummary, setTechnicalSummary] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('odoo_active_job') || null;
    } catch {
      return null;
    }
  });
  const [demoCache, setDemoCache] = useState<{
    schemaPreview: SchemaPreview;
    models: Model[];
    generatedFiles: GeneratedFile[];
    selectedFile: string | null;
    downloadUrl: string;
    repositoryUrl: string;
    activeJobId: string | null;
    statusMessage: string;
    progress: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem('odoo_demo_cache');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [activeJobConfig, setActiveJobConfig] = useState<{ odoo_version?: string }>(() => {
    try {
      const stored = localStorage.getItem('odoo_active_job_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed as { odoo_version?: string };
        }
      }
      const savedVersion = localStorage.getItem('odoo_version');
      return savedVersion ? { odoo_version: savedVersion } : { odoo_version: '17.0' };
    } catch {
      return { odoo_version: '17.0' };
    }
  });
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // load persisted sidebar state
  useEffect(() => {
    let t: number | undefined;
    if (showLeftPanel) {
      setSidebarMounted(true);
    } else {
      // leave mounted for animation then unmount
      t = window.setTimeout(() => setSidebarMounted(false), 300);
    }

    return () => {
      if (t) clearTimeout(t);
    };
  }, [showLeftPanel]);
  // load persisted sidebar state
  useEffect(() => {
    try {
      const rawOpen = localStorage.getItem('odoo_sidebar_open');
      if (rawOpen !== null) setShowLeftPanel(rawOpen === '1');
      const rawWidth = localStorage.getItem('odoo_sidebar_width');
      if (rawWidth) {
        const v = Number(rawWidth);
        if (!Number.isNaN(v) && v >= 220 && v <= 1200) setSidebarWidth(v);
      }
    } catch {
      // ignore
    }
  }, []);

  // persist open/width
  useEffect(() => {
    try {
      localStorage.setItem('odoo_sidebar_open', showLeftPanel ? '1' : '0');
    } catch {
      // ignore
    }
  }, [showLeftPanel]);

  useEffect(() => {
    try {
      localStorage.setItem('odoo_generated_files', JSON.stringify(generatedFiles));
    } catch {
      // ignore
    }
  }, [generatedFiles]);

  useEffect(() => {
    try {
      localStorage.setItem('odoo_models', JSON.stringify(models));
    } catch {
      // ignore
    }
  }, [models]);

  useEffect(() => {
    try {
      localStorage.setItem('odoo_active_job_config', JSON.stringify(activeJobConfig));
      if (activeJobConfig.odoo_version) {
        localStorage.setItem('odoo_version', activeJobConfig.odoo_version);
      } else {
        localStorage.removeItem('odoo_version');
      }
    } catch {
      // ignore
    }
  }, [activeJobConfig]);

  useEffect(() => {
    try {
      if (demoCache) {
        localStorage.setItem('odoo_demo_cache', JSON.stringify(demoCache));
      }
    } catch {
      // ignore
    }
  }, [demoCache]);

  useEffect(() => {
    try {
      if (selectedFile) {
        localStorage.setItem('odoo_selected_file', selectedFile);
      } else {
        localStorage.removeItem('odoo_selected_file');
      }
    } catch {
      // ignore
    }
  }, [selectedFile]);

  useEffect(() => {
    try {
      localStorage.setItem('odoo_sidebar_width', String(sidebarWidth));
    } catch {
      // ignore
    }
  }, [sidebarWidth]);

  // global shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setShowLeftPanel((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close sidebar on Escape key (global)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLeftPanel) {
        setShowLeftPanel(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [showLeftPanel]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const clientX = e.clientX;
      const dx = clientX - startXRef.current;
      const next = Math.max(220, Math.min(740, startWidthRef.current + dx));
      setSidebarWidth(next);
      // smooth shadow feedback
      setIsDraggingState(true);
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDraggingState(false);
      if (sidebarRef.current) sidebarRef.current.style.transition = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Focus-trap and ESC-to-close for mobile sidebar overlay
  useEffect(() => {
    if (!isMobile) return;
    if (!showLeftPanel) return;

    const container = sidebarRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    // focus first focusable (close button) when opening
    const focusable = container ? Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null) : [];
    (focusable[0] || container)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowLeftPanel(false);
        return;
      }

      if (e.key === 'Tab') {
        if (!container) return;
        const nodes = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      try {
        previouslyFocused?.focus?.();
      } catch {}
    };
  }, [isMobile, showLeftPanel]);
  const [schemaPreview, setSchemaPreview] = useState<SchemaPreview | null>(null);
  const [isAwaitingAiSchema, setIsAwaitingAiSchema] = useState(false);
  const [, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    if (status === 'generating' || status === 'success' || schemaPreview) {
      setWorkspaceTab('build');
    }
  }, [status, schemaPreview]);
  const schemaSetRef = useRef(false);
  const modelsSyncedRef = useRef(false);
  const modelsRef = useRef<Model[]>([]);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  useEffect(() => {
    if (!schemaPreview || !activeJobId) return;

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        setCloudSyncStatus('syncing');
        const moduleConfig = {
          module_name: schemaPreview.module_name || 'custom_module',
          models: schemaPreview.models.map((model) => ({
            name: model.name,
            fields: model.fields.map((field) => ({
              name: field.name,
              type: field.type,
              required: field.required,
              default: field.default ?? null,
              unique: field.unique ?? false,
            })),
          })),
        };

        const response = await syncJobConfig(activeJobId, moduleConfig, schemaPreview);
        setStatusMessage(response.message || 'Changes synced to cloud successfully');
        setCloudSyncStatus('synced');
        setTimeout(() => setCloudSyncStatus('idle'), 2000);
      } catch (error) {
        setCloudSyncStatus('error');
        setStatusMessage(error instanceof Error ? error.message : 'Failed to sync changes to cloud');
      }
    }, 250);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [activeJobId, schemaPreview]);

  useEffect(() => {
    if (!schemaPreview) return;
    try {
      localStorage.setItem('odoo_erd_schema', JSON.stringify(schemaPreview));
    } catch {
      // ignore
    }
  }, [schemaPreview]);

  // load persisted schema from localStorage on mount
  useEffect(() => {
    try {
      const rawSchema = localStorage.getItem('odoo_erd_schema');
      if (rawSchema) {
        const parsed = JSON.parse(rawSchema);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.models)) {
          setSchemaPreview(parsed);
        }
      }
    } catch {
      // ignore invalid persisted schema
    }
  }, []);

  useEffect(() => {
    if (!schemaPreview || models.length > 0) return;

    const nextModels = schemaPreview.models.map((model) => ({
      id: `${model.name}-${model.module_name}`,
      name: model.name,
      fields: model.fields.map((field) => ({
        id: `${model.name}-${field.name}`,
        name: field.name,
        type: field.type,
        required: field.required,
        default: field.default ?? null,
        unique: field.unique ?? false,
      })),
    }));

    setModels(nextModels);
    modelsRef.current = nextModels;
    modelsSyncedRef.current = true;
  }, [schemaPreview, models.length]);

  const handleChatResponse = useCallback((response: ChatResponse) => {
    setIsReadyToGenerate(response.ready_to_generate);
    setTechnicalSummary(response.requirements_summary || '');
  }, []);

  const syncSchemaPreviewFromModels = useCallback((nextModels: Model[]) => {
    const previousModelsById = new Map(modelsRef.current.map((model) => [model.id, model]));

    // update local models immediately
    setModels(nextModels);
    modelsRef.current = nextModels;
    modelsSyncedRef.current = true;

    // Try to build the schema preview from models safely. If anything fails, keep the current preview.
    setSchemaPreview((current) => {
      try {
        // Keep sidebar and ERD in sync — build schema from models even if none exists yet
        if (!current && nextModels.length === 0) return current;

        const moduleName = current?.module_name || 'custom_module';
        const existingModels = new Map(((current && Array.isArray(current.models)) ? current.models : []).map((model) => [model.name, model]));
        const knownModelNames = new Set(nextModels.map((m) => m.name));

        const nextSchema: SchemaPreview = {
          module_name: moduleName,
          actors: current?.actors?.length ? current.actors : ['User', 'Administrator'],
          use_cases: (current?.use_cases || []).filter((uc) => !uc.model || knownModelNames.has(uc.model)),
          models: nextModels.map((model) => {
            const previousModel = previousModelsById.get(model.id);
            const existingModel = existingModels.get(previousModel?.name || model.name) || existingModels.get(model.name);
            return {
              name: model.name,
              module_name: moduleName,
              description: existingModel?.description,
              fields: (Array.isArray(model.fields) ? model.fields : []).map((field) => {
                const existingField = Array.isArray(existingModel?.fields) ? existingModel!.fields.find((f) => f.name === field.name) : undefined;
                return {
                  name: field.name,
                  type: field.type,
                  required: field.required,
                  relation: existingField?.relation,
                  default: field.default ?? existingField?.default ?? null,
                  unique: field.unique ?? existingField?.unique ?? false,
                };
              }),
            };
          }),
          positions: Object.fromEntries(
            nextModels
              .map((model) => {
                const previousModel = previousModelsById.get(model.id);
                const sourceName = previousModel?.name || model.name;
                const savedPosition = current?.positions?.[sourceName] || current?.positions?.[model.name];
                return savedPosition ? [model.name, savedPosition] : null;
              })
              .filter((entry): entry is [string, { x: number; y: number }] => Boolean(entry)),
          ),
        };

        return nextSchema;
      } catch (err) {
        // Do not drop the current preview on error; log and keep current
        // eslint-disable-next-line no-console
        console.error('syncSchemaPreviewFromModels error:', err);
        return current;
      }
    });
  }, []);

  const normalizeRestoredMessages = useCallback((messages?: Array<{ role?: string; content?: string }> | null): ChatMessage[] => {
    if (!Array.isArray(messages)) return [];
    return messages
      .filter((message) => typeof message?.content === 'string')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content || '',
        createdAt: new Date().toISOString(),
      }));
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);

  const handleSaveSettings = useCallback((odooVersion: string) => {
    setActiveJobConfig({ odoo_version: odooVersion || '17.0' });
    toast.success('Settings saved successfully!', {
      style: { border: '1px solid rgb(var(--success))', padding: '16px', color: 'rgb(var(--success))' },
    });
  }, []);

  const resetGenerationState = useCallback(() => {
    setGeneratedFiles([]);
    setSelectedFile(null);
    setSelectedFile(null);
    setModels([]);
    setStatus('idle');
    setStatusMessage('');
    setProgress(0);
    setEstimatedRemaining(null);
    setDeploymentStrategy('local_zip');
    setRepositoryUrl('');
    setDownloadUrl('');
    setSchemaPreview(null);
    setIsAwaitingAiSchema(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('odoo_erd_schema');
      window.localStorage.removeItem('odoo_generated_files');
      window.localStorage.removeItem('odoo_selected_file');
    }
    schemaSetRef.current = false;
    modelsSyncedRef.current = false;
    setIsReadyToGenerate(false);
    setTechnicalSummary('');
  }, []);

  const restoreDemoCache = useCallback((cache: {
    schemaPreview: SchemaPreview;
    models: Model[];
    generatedFiles: GeneratedFile[];
    selectedFile: string | null;
    downloadUrl: string;
    repositoryUrl: string;
    activeJobId: string | null;
    statusMessage: string;
    progress: number;
  }) => {
    resetGenerationState();
    setStatus('success');
    setStatusMessage(cache.statusMessage || 'Demo loaded from cache');
    setProgress(cache.progress ?? 100);
    setEstimatedRemaining(null);
    setSchemaPreview(cache.schemaPreview);
    setModels(cache.models);
    setGeneratedFiles(cache.generatedFiles);
    setSelectedFile(cache.selectedFile);
    setDownloadUrl(cache.downloadUrl);
    setRepositoryUrl(cache.repositoryUrl);
    setActiveJobId(cache.activeJobId);
    setShowWelcome(false);
    setShowLeftPanel(true);
    setIsAwaitingAiSchema(false);
    setIsReadyToGenerate(true);
    try {
      if (cache.activeJobId) {
        localStorage.setItem('odoo_active_job', cache.activeJobId);
      }
    } catch {
      // ignore
    }
  }, [resetGenerationState]);

  const handleSelectHistoryJob = useCallback(async (jobId: string) => {
    try {
      resetGenerationState();
      const restored = await fetchJobRestore(jobId);
      const restoredSchema = (restored.schema_preview as SchemaPreview | null) || null;
      const restoredMessages = normalizeRestoredMessages(restored.chat_history || []);

      setActiveJobId(jobId);
      if (restored.odoo_version) {
        setActiveJobConfig({ odoo_version: restored.odoo_version });
      }
      setRestoredMessages(restoredMessages);
      setShowWelcome(false);
      setShowLeftPanel(true);
      setChatResetKey((prev) => prev + 1);
      setStatus(restored.status === 'done' ? 'success' : restored.status === 'error' ? 'error' : 'generating');
      setStatusMessage(restored.message || 'Restored saved session');
      setProgress(restored.progress || 0);
      setEstimatedRemaining(null);
      setShowWelcome(false);
      handleViewChange('generator');

      if (restoredSchema) {
        setSchemaPreview(restoredSchema);
        const nextModels = restoredSchema.models.map((model) => ({
          id: `${model.name}-${model.module_name}`,
          name: model.name,
          fields: model.fields.map((field) => ({
            id: `${model.name}-${field.name}`,
            name: field.name,
            type: field.type,
            required: field.required,
            default: field.default ?? null,
            unique: field.unique ?? false,
          })),
        }));
        setModels(nextModels);
        modelsSyncedRef.current = true;
        schemaSetRef.current = true;
      } else if (restored.module_config) {
        const config = restored.module_config as { module_name?: string; models?: Array<{ name: string; fields?: Array<{ name: string; type: string; required: boolean }> }> };
        const fallbackModels = (config.models || []).map((model) => ({
          name: model.name,
          fields: model.fields || [],
        }));
        const fallbackSchema = buildSchemaFromPayload(config.module_name || 'restored_module', fallbackModels);
        setSchemaPreview(fallbackSchema);
        const nextModels = fallbackSchema.models.map((model) => ({
          id: `${model.name}-${model.module_name}`,
          name: model.name,
          fields: model.fields.map((field) => ({
            id: `${model.name}-${field.name}`,
            name: field.name,
            type: field.type,
            required: field.required,
            default: field.default ?? null,
            unique: field.unique ?? false,
          })),
        }));
        setModels(nextModels);
        modelsSyncedRef.current = true;
        schemaSetRef.current = true;
      }

      const restoredFiles = await fetchJobFiles(jobId);
      setGeneratedFiles(restoredFiles);
      setSelectedFile(restoredFiles[0]?.path || null);
      setDownloadUrl(`${API_BASE_URL}/download/${jobId}`);
    } catch (error) {
      console.error('History restore error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to restore session');
    }
  }, [API_BASE_URL, fetchJobFiles, handleViewChange, normalizeRestoredMessages, resetGenerationState]);

  const handleProgress = useCallback((job: JobStatus) => {
    setProgress(job.progress ?? 0);
    setStatusMessage(job.error || job.message || 'Generating...');
    setEstimatedRemaining(job.estimated_remaining_sec ?? null);
    if (job.schema_preview) {
      setSchemaPreview(job.schema_preview);
      setIsAwaitingAiSchema(false);
      schemaSetRef.current = true;
    }
    if (job.status === 'done') {
      setIsAwaitingAiSchema(false);
    }
  }, []);

  const handleCloudSync = useCallback(async () => {
    if (!schemaPreview || !activeJobId) return;

    try {
      setCloudSyncStatus('syncing');
      const moduleConfig = {
        module_name: schemaPreview.module_name || 'custom_module',
        models: schemaPreview.models.map((model) => ({
          name: model.name,
          fields: model.fields.map((field) => ({
            name: field.name,
            type: field.type,
            required: field.required,
            default: field.default ?? null,
            unique: field.unique ?? false,
          })),
        })),
      };

      const response = await syncJobConfig(activeJobId, moduleConfig, schemaPreview);
      setStatusMessage(response.message || 'Changes synced to cloud successfully');
      setCloudSyncStatus('synced');
      setTimeout(() => setCloudSyncStatus('idle'), 2000);
    } catch (error) {
      setCloudSyncStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to sync changes to cloud');
    }
  }, [activeJobId, schemaPreview]);

  useEffect(() => {
    if (!technicalSummary) return;
    console.debug('technicalSummary updated:', technicalSummary);
  }, [technicalSummary]);

  useEffect(() => {
    if (false) {
      handleChatResponse({ reply: '', ready_to_generate: false, requirements_summary: '' });
    }
  }, [handleChatResponse]);

  const handleGenerate = async (payload: GeneratorPayload, options?: { cacheDemo?: boolean }) => {
    resetGenerationState();

    setStatus('generating');
    setStatusMessage(
      payload.rawConfig
        ? `Building "${payload?.moduleName || 'module'}" (no AI)...`
        : payload.aiPrompt
          ? `Analyzing prompt (AI)...`
          : `Analyzing "${payload?.moduleName || 'module'}"...`,
    );
    setProgress(0);
    setDeploymentStrategy(payload?.deploymentStrategy || 'local_zip');
    setRepositoryUrl(payload?.repositoryUrl || '');
    setShowWelcome(false);
    setShowLeftPanel(true);

    if (payload.rawConfig) {
      setSchemaPreview(schemaFromRawConfig(payload.rawConfig as RawModuleConfig));
      setIsAwaitingAiSchema(false);
      schemaSetRef.current = true;
      modelsSyncedRef.current = false;
    } else {
      const hasStructuredModels = payload.models?.some((m) => m.fields?.length > 0);
      const isPromptGeneration = !payload.models || payload.models.length === 0;

      if (isPromptGeneration) {
        setSchemaPreview(null);
        setIsAwaitingAiSchema(true);
        schemaSetRef.current = false;
        modelsSyncedRef.current = false;
      }

      if (hasStructuredModels) {
        setSchemaPreview(buildSchemaFromPayload(payload.moduleName, payload.models));
        setIsAwaitingAiSchema(false);
        schemaSetRef.current = true;
        modelsSyncedRef.current = false;
      }
    }

    try {
      const selectedVersion = activeJobConfig.odoo_version || payload.odoo_version || payload.version || '17.0';
      const fullPayload: GeneratorPayload = {
        ...payload,
        models: payload.models?.length ? payload.models : [],
        odoo_version: selectedVersion,
        version: selectedVersion,
      };

      const result = await generateModule(fullPayload, handleProgress, activeJobId ?? undefined);

      if (result?.success) {
        setGeneratedFiles(result.files || []);
        setSelectedFile(result.files?.[0]?.path || null);
        setRepositoryUrl(result.repositoryUrl || payload.repositoryUrl || '');
        setDownloadUrl(result.downloadUrl || '');
        setProgress(100);
        setEstimatedRemaining(null);
        setStatus('success');
        setStatusMessage(result.message || 'Generation successful');
        if (result.jobId) {
          setActiveJobId(result.jobId);
          try { localStorage.setItem('odoo_active_job', result.jobId); } catch {}
        }

        if (options?.cacheDemo && payload.rawConfig) {
          const demoCacheValue = {
            schemaPreview: schemaFromRawConfig(payload.rawConfig as RawModuleConfig),
            models: buildSchemaFromPayload(payload.moduleName, payload.models || []).models.map((model) => ({
              id: `${model.name}-${model.module_name}`,
              name: model.name,
              fields: model.fields.map((field) => ({
                id: `${model.name}-${field.name}`,
                name: field.name,
                type: field.type,
                required: field.required,
                default: field.default ?? null,
                unique: field.unique ?? false,
              })),
            })),
            generatedFiles: result.files || [],
            selectedFile: result.files?.[0]?.path || null,
            downloadUrl: result.downloadUrl || '',
            repositoryUrl: result.repositoryUrl || payload.repositoryUrl || '',
            activeJobId: result.jobId || null,
            statusMessage: result.message || 'Demo generated',
            progress: 100,
          };
          setDemoCache(demoCacheValue);
        }
      } else {
        setDownloadUrl('');
        setStatus('error');
        setStatusMessage(result.message || 'Generation failed');
        // Do NOT inject the hardcoded fitzone demo — that made every failed run look the same
      }
    } catch (error) {
      console.error('App generation error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      if (isQuotaExceededError(error)) notifyQuotaExceeded();
    }
  };

  const handleTryDemo = () => {
    setIsReadyToGenerate(true);
    setTechnicalSummary('Demo payload is ready to generate without AI.');

    let cache = demoCache;
    if (!cache) {
      try {
        const raw = localStorage.getItem('odoo_demo_cache');
        if (raw) {
          cache = JSON.parse(raw) as typeof demoCache;
        }
      } catch {
        cache = null;
      }
    }

    if (cache) {
      setShowWelcome(false);
      setShowLeftPanel(true);
      setStatus('generating');
      setStatusMessage('Loading cached demo...');
      setProgress(10);
      window.setTimeout(() => restoreDemoCache(cache!), 900);
      return;
    }

    void handleGenerate(buildDemoPayload(), { cacheDemo: true });
  };

  const handleNewChat = () => {
    resetGenerationState();
    handleViewChange('generator');
    setActiveJobId(null);
    try { localStorage.removeItem('odoo_active_job'); } catch {}
    setRestoredMessages([]);
    setShowWelcome(false);
    setChatResetKey((prev) => prev + 1);
  };

  const handleStartGenerating = () => {
    resetGenerationState();
    setActiveJobId(null);
    try { localStorage.removeItem('odoo_active_job'); } catch {}
    setRestoredMessages([]);
    setShowWelcome(false);
    handleViewChange('generator');
  };

  useEffect(() => {
    if (!schemaPreview) return;

    const nextModels = schemaPreview.models.map((model) => ({
      id: `${model.name}-${model.module_name}`,
      name: model.name,
      fields: model.fields.map((field) => ({
        id: `${model.name}-${field.name}`,
        name: field.name,
        type: field.type,
        required: field.required,
        default: field.default ?? null,
        unique: field.unique ?? false,
      })),
    }));

    const modelsAreIdentical = nextModels.length === models.length && nextModels.every((nextModel, index) => {
      const currentModel = models[index];
      if (!currentModel) return false;
      if (currentModel.id !== nextModel.id || currentModel.name !== nextModel.name) return false;
      if (!Array.isArray(currentModel.fields) || currentModel.fields.length !== nextModel.fields.length) return false;
      return currentModel.fields.every((field, fieldIndex) => {
        const nextField = nextModel.fields[fieldIndex];
        return field.id === nextField.id
          && field.name === nextField.name
          && field.type === nextField.type
          && field.required === nextField.required
          && field.default === nextField.default
          && field.unique === nextField.unique;
      });
    });

    if (modelsAreIdentical) return;

    setModels(nextModels);
    modelsSyncedRef.current = true;
  }, [models, schemaPreview]);

  return (
    <div className="app-shell flex-col">
      <ToastProvider />
      <AmbientBackdrop />
      <div className="scene-dressing" aria-hidden="true" />
      <QuotaExceededModal
        open={quotaModalOpen}
        isGuest={user?.isGuest ?? false}
        onClose={() => setQuotaModalOpen(false)}
        onCreateAccount={() => {
          setQuotaModalOpen(false);
          setAuthTab('signup');
          void signOut();
        }}
      />

      {!user ? (
        authLoading ? (
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-xs uppercase tracking-[0.25em] text-white/35">Restoring session</p>
            </div>
          </div>
        ) : (
          <LoginView initialTab={authTab} />
        )
      ) : (
        <AnimatePresence mode="wait">
          {isHomeLoading ? (
            <motion.div
              key="skeleton"
              initial={false}
              className="absolute inset-0 z-20"
            >
              <HomePageSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="app-shell"
              initial={false}
              className="shell-root"
            >
              <div className="shell-toggle">
                <button
                  type="button"
                  title="Toggle sidebar (Ctrl+B)"
                  aria-label="Toggle sidebar"
                  onClick={() => setShowLeftPanel((v) => !v)}
                  className="nav-icon-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[rgb(var(--fg))]">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="shell-frame">
                <div className="shell-sidebar">
                  <Sidebar
                    activeView={effectiveView}
                    onViewChange={handleViewChange}
                    onNewChat={handleNewChat}
                    onLogout={() => void signOut()}
                    showLogo={false}
                    isAdmin={isAdminUser}
                    userEmail={user?.email}
                    isGuest={user?.isGuest}
                    adminMode={adminModeEnabled}
                    onToggleAdminMode={() => setAdminMode((value) => !value)}
                  />
                </div>

                <main className="shell-stage">
                  {effectiveView === 'history' && <HistoryView onSelectJob={handleSelectHistoryJob} />}
                  {effectiveView === 'settings' && <SettingsView odooVersion={activeJobConfig.odoo_version || '17.0'} onSaveSettings={handleSaveSettings} />}
                  {effectiveView === 'monitor' && adminModeEnabled && (
                    <ViewErrorBoundary>
                    <MonitorView />
                  </ViewErrorBoundary>
                )}

                {effectiveView === 'generator' && (
                  <>
                    {showWelcome ? (
                      <WelcomeDashboard
                        onStartGenerating={handleStartGenerating}
                        onTryDemo={handleTryDemo}
                      />
                    ) : (
                      <div className="flex h-full overflow-hidden">
                        {sidebarMounted && (
                          <>
                            {isMobile ? (
                              <div className="fixed inset-0 z-[60] flex">
                                <div
                                  className={`absolute inset-0 bg-black backdrop-blur-[4px] transition-opacity duration-300 ${showLeftPanel ? 'opacity-60' : 'opacity-0 pointer-events-none'}`}
                                  onClick={() => showLeftPanel && setShowLeftPanel(false)}
                                />
                                <div
                                  ref={sidebarRef}
                                  className={`relative flex h-full w-[min(85vw,320px)] flex-col bg-[rgb(var(--plate))]/95 border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
                                >
                                  <div className="flex shrink-0 items-center justify-end border-b border-white/[0.06] px-3 py-2.5">
                                    <button
                                      type="button"
                                      ref={closeButtonRef}
                                      onClick={() => setShowLeftPanel(false)}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                      aria-label="Close sidebar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Close
                                    </button>
                                  </div>
                                  <div className="flex-1 min-h-0 overflow-y-auto">
                                    <ModelSettingsPanel models={models} onModelsChange={syncSchemaPreviewFromModels} schema={schemaPreview} onSchemaReplace={setSchemaPreview} onCloudSync={handleCloudSync} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                ref={sidebarRef}
                                className={`glass-card flex flex-col flex-shrink-0 transform transition-all duration-300 ease-in-out ${isDraggingState ? 'shadow-inner' : ''} ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'}`}
                                style={{ width: Math.min(sidebarWidth, Math.max(220, Math.round(window.innerWidth * 0.3))), minWidth: 220 }}
                              >
                                <div className={`relative h-full flex flex-col transition-all duration-300 ease-in-out ${isDraggingState ? 'shadow-2xl' : ''}`}>
                                  <ModelSettingsPanel models={models} onModelsChange={syncSchemaPreviewFromModels} schema={schemaPreview} onSchemaReplace={setSchemaPreview} />

                                  <div className="absolute -right-6 top-1/2 z-40 hidden sm:flex -translate-y-1/2 items-center">
                                    <div
                                      title="Drag to resize sidebar (double-click to toggle)"
                                      onMouseDown={(e) => {
                                        draggingRef.current = true;
                                        startXRef.current = e.clientX;
                                        startWidthRef.current = sidebarWidth;
                                        setIsDraggingState(true);
                                        if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
                                        document.body.style.cursor = 'col-resize';
                                      }}
                                      onDoubleClick={() => setSidebarWidth((w) => (w > 240 ? 240 : 360))}
                                      className="flex items-center justify-center w-9 h-9 rounded-full bg-black/60 border border-white/[0.06] cursor-col-resize hover:bg-white/5 transition-colors"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/85">
                                        <path d="M10 6h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" fill="currentColor" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        <div className="flex flex-1 flex-col overflow-hidden">
                          <div className="workspace-tabs overflow-x-auto">
                            <button
                              type="button"
                              onClick={() => setWorkspaceTab('chat')}
                              className={`ws-tab ${workspaceTab === 'chat' ? 'active' : ''}`}
                            >
                              <span className="ws-tab__no">01</span>
                              <MessageSquare className="h-4 w-4" />
                              <span>Chat</span>
                              {restoredMessages.length > 0 && (
                                <span className="ws-tab-badge">{restoredMessages.length}</span>
                              )}
                              {workspaceTab === 'chat' && (
                                <motion.span
                                  layoutId="workspace-tab-indicator"
                                  className="ws-tab-indicator"
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setWorkspaceTab('build')}
                              className={`ws-tab ${workspaceTab === 'build' ? 'active' : ''}`}
                            >
                              <span className="ws-tab__no">02</span>
                              <Network className="h-4 w-4" />
                              <span>Schema &amp; Build</span>
                              {schemaPreview && (
                                <span className="ws-tab-badge">{schemaPreview.models.length}</span>
                              )}
                              {workspaceTab === 'build' && (
                                <motion.span
                                  layoutId="workspace-tab-indicator"
                                  className="ws-tab-indicator"
                                />
                              )}
                            </button>
                          </div>

                          <div className="relative flex-1 overflow-hidden">
                            <div className={`h-full ${workspaceTab === 'chat' ? '' : 'hidden'}`}>
                              {restoredMessages.length > 0 ? (
                                <div className="flex h-full flex-col px-3 py-4 sm:px-8 sm:py-6">
                                    <div className="chat-header mb-4 flex items-center justify-between gap-3 border-b border-fg/10 pb-3">
                                    <div className="eyebrow">Chat history</div>
                                    <div className="chat-header__note hidden text-xs text-fg-faint sm:block">Messages shown here, outside the bottom input bar.</div>
                                  </div>
                                  <div
                                    ref={chatListRef}
                                    onScroll={() => {
                                      if (!chatListRef.current) return;
                                      const { scrollTop, clientHeight, scrollHeight } = chatListRef.current;
                                      setIsChatScrolledUp(scrollTop + clientHeight < scrollHeight - 80);
                                    }}
                                    className="chat-thread pr-2 pb-72"
                                  >
                                {restoredMessages.map((message, index) => (
                                  <div
                                    key={index}
                                    className={`group msg-row ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                                  >
                                    {(() => {
                                      const messageKey = `${message.role}-${index}-${message.createdAt ?? ''}`;
                                      const isLongMessage = shouldCollapseMessage(message.content);
                                      const isExpanded = Boolean(expandedMessageKeys[messageKey]);

                                      return (
                                        <div className="max-w-[88%] sm:max-w-[75%] flex flex-col" style={{ alignItems: message.role === 'assistant' ? 'flex-start' : 'flex-end' }}>
                                          <div className={`msg-meta ${message.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                                            {message.role === 'assistant' ? 'AI' : 'YOU'}
                                          </div>
                                          <div className="relative overflow-hidden">
                                            <div
                                              dir={getMessageDirection(message.content)}
                                              className={`msg-bubble ${message.role === 'assistant' ? 'msg-bubble--ai' : 'msg-bubble--user'} transition-all duration-300 ${hasArabicText(message.content) ? 'text-right' : 'text-left'}`}
                                              style={{ unicodeBidi: 'plaintext' }}
                                            >
                                              <div
                                                className={`chat-message-text break-words whitespace-pre-line ${hasArabicText(message.content) ? 'arabic-text' : ''}`}
                                                style={{
                                                  maxHeight: isLongMessage && !isExpanded ? '120px' : '1400px',
                                                  overflow: 'hidden',
                                                  paddingBottom: isLongMessage ? '4rem' : 0,
                                                  transition: 'max-height 240ms ease',
                                                }}
                                              >
                                                {message.role === 'assistant' ? (
                                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                    {message.content}
                                                  </ReactMarkdown>
                                                ) : (
                                                  message.content
                                                )}
                                              </div>
                                            </div>

                                            {isLongMessage && !isExpanded && (
                                              <div className="msg-fade" />
                                            )}

                                            {isLongMessage && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setExpandedMessageKeys((previous) => ({
                                                    ...previous,
                                                    [messageKey]: !previous[messageKey],
                                                  }));
                                                }}
                                                className="msg-toggle"
                                              >
                                                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                              </button>
                                            )}
                                          </div>
                                          <div className="msg-actions">
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                try {
                                                  await navigator.clipboard.writeText(message.content);
                                                  const copyKey = `${index}-${message.role}`;
                                                  setCopiedMessageKey(copyKey);
                                                  window.setTimeout(() => setCopiedMessageKey((current) => (current === copyKey ? null : current)), 1200);
                                                } catch {
                                                  // ignore clipboard errors
                                                }
                                              }}
                                              className="msg-action"
                                              aria-label="Copy message"
                                              title="Copy message"
                                            >
                                              {copiedMessageKey === `${index}-${message.role}` ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2.5} />}
                                            </button>
                                            <span className="msg-time">
                                              {formatMessageTime(message.createdAt)}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ))}
                                <AnimatePresence initial={false}>
                                  {isAiTyping && (
                                    <motion.div
                                      key="ai-typing-indicator"
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 4 }}
                                      transition={{ duration: 0.18, ease: 'easeOut' }}
                                      className="msg-row justify-start"
                                    >
                                      <div className="max-w-[88%] sm:max-w-[75%] flex flex-col items-start">
                                        <div className="msg-meta text-left">AI</div>
                                        <div
                                          dir="ltr"
                                          className="msg-bubble msg-bubble--ai"
                                          style={{ unicodeBidi: 'plaintext' }}
                                          aria-label="AI is typing"
                                          role="status"
                                        >
                                          <div className="flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--fg))]/70 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--fg))]/70 animate-bounce" style={{ animationDelay: '140ms', animationDuration: '1s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--fg))]/70 animate-bounce" style={{ animationDelay: '280ms', animationDuration: '1s' }} />
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                <div ref={chatBottomRef} aria-hidden="true" className="h-1" />
                                  </div>
                                  {isChatScrolledUp && (
                                    <div className="mt-3 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={scrollChatToBottom}
                                        className="scroll-down"
                                        aria-label="Scroll to bottom"
                                        title="Scroll to bottom"
                                      >
                                        <ArrowDown className="h-4 w-4" strokeWidth={2.4} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <p className="text-fg-faint">Start a conversation to generate your module</p>
                                </div>
                              )}
                            </div>

                            <div className={`h-full ${workspaceTab === 'build' ? '' : 'hidden'}`}>
                              {(status === 'generating' || status === 'success' || status === 'error' || schemaPreview) ? (
                                <SystemBuildView
                                  schema={schemaPreview}
                                  isAwaitingAiSchema={isAwaitingAiSchema}
                                  onSchemaChange={setSchemaPreview}
                                  isGenerating={status === 'generating'}
                                  isComplete={status === 'success'}
                                  hasError={status === 'error'}
                                  onTryDemo={handleTryDemo}
                                  progress={progress}
                                  statusMessage={statusMessage}
                                  estimatedRemainingSec={estimatedRemaining}
                                  files={generatedFiles}
                                  selectedFile={selectedFile}
                                  onSelectFile={setSelectedFile}
                                  deploymentStrategy={deploymentStrategy}
                                  repositoryUrl={repositoryUrl}
                                  downloadUrl={downloadUrl}
                                  activeJobId={activeJobId}
                                  onCloudSync={handleCloudSync}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <p className="text-fg-faint">Configure your module and click Generate</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </main>
            </div>

            {activeView === 'generator' && !showWelcome && (
              <GenBar
                onGenerate={handleGenerate}
                onTryDemo={handleTryDemo}
                resetKey={chatResetKey}
                messages={restoredMessages}
                setMessages={setRestoredMessages}
                jobId={activeJobId}
                repositoryUrl={repositoryUrl}
                downloadUrl={downloadUrl}
                onCloudSync={handleCloudSync}
                status={status}
                progress={progress}
                onRepositoryUrlChange={setRepositoryUrl}
                isReady={isReadyToGenerate}
              />
            )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default App;
