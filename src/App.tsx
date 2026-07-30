import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { GenBar } from './components/GenBar';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { ToastProvider } from './components/ToastProvider';
import { toast } from 'react-hot-toast';
import { ModelSettingsPanel } from './components/ModelSettingsPanel';
import { SystemBuildView } from './components/SystemBuildView';
import {
  fetchJobFiles,
  fetchJobRestore,
  generateModule,
  syncJobConfig,
  API_BASE_URL,
  type ChatMessage,
  type ChatResponse,
  type GeneratorPayload,
  type GeneratedFile,
  type JobStatus,
  type SchemaPreview,
} from './services/api';
import { buildSchemaFromPayload } from './utils/diagramBuilder';
import { buildDemoPayload, schemaFromRawConfig, type RawModuleConfig } from './utils/demoGenerate';

type ViewType = 'generator' | 'history' | 'settings';
type StatusType = 'idle' | 'generating' | 'success' | 'error';

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

function App() {
  // Restore persisted state or use defaults
  const [activeView, setActiveView] = useState<ViewType>(() => {
    try {
      const hasManualSelection = localStorage.getItem('odoo_view_persisted') === '1';
      const stored = localStorage.getItem('odoo_active_view');
      if (hasManualSelection && stored) {
        return stored as ViewType;
      }
      return 'generator';
    } catch {
      return 'generator';
    }
  });
  const [status, setStatus] = useState<StatusType>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
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
  const [restoredMessages, setRestoredMessages] = useState<ChatMessage[]>([]);
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
    const check = () => setIsMobile(window.innerWidth < 768);
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
      }));
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    try {
      localStorage.setItem('odoo_active_view', view);
      localStorage.setItem('odoo_view_persisted', '1');
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSettings = useCallback((odooVersion: string) => {
    setActiveJobConfig({ odoo_version: odooVersion || '17.0' });
    toast.success('Settings saved successfully!', {
      style: { border: '1px solid #34d399', padding: '16px', color: '#34d399' },
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
    <div className="h-screen w-screen flex flex-col bg-[#050505] overflow-hidden relative">
      <ToastProvider />
      <ParticleBackground />

      {/* Top-left toggle icon -> opens/closes sidebar */}
      <div className="fixed top-4 left-4 z-50">
        <button
          type="button"
          title="Toggle sidebar (Ctrl+B)"
          aria-label="Toggle sidebar"
          onClick={() => setShowLeftPanel((v) => !v)}
          className={`nav-icon-btn ${showLeftPanel ? 'active' : ''} shadow-lg`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/90">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 relative z-10 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} onNewChat={handleNewChat} showLogo={false} />

        <main className="flex-1 overflow-hidden relative">
          {activeView === 'history' && <HistoryView onSelectJob={handleSelectHistoryJob} />}
          {activeView === 'settings' && <SettingsView odooVersion={activeJobConfig.odoo_version || '17.0'} onSaveSettings={handleSaveSettings} />}

          {activeView === 'generator' && (
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
                        <div className="fixed inset-0 z-40 flex">
                          <div
                            className={`absolute inset-0 bg-black transition-opacity duration-300 ${showLeftPanel ? 'opacity-60' : 'opacity-0 pointer-events-none'}`}
                            onClick={() => showLeftPanel && setShowLeftPanel(false)}
                          />
                          <div
                            ref={sidebarRef}
                            className={`relative h-full bg-[#111111]/95 border border-[rgba(255,255,255,0.08)] shadow-inner transform transition-transform duration-300 ease-out ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
                            style={{ width: Math.min(sidebarWidth, window.innerWidth * 0.95) }}
                          >
                            <div className="p-3 flex items-center justify-between border-b border-white/6">
                              <div className="text-white font-semibold">Data Models</div>
                              <button
                                type="button"
                                ref={closeButtonRef}
                                onClick={() => setShowLeftPanel(false)}
                                className="px-2 py-1 rounded bg-white/5 text-white/80"
                              >
                                Close
                              </button>
                            </div>
                            <div className="h-full overflow-auto">
                              <ModelSettingsPanel models={models} onModelsChange={syncSchemaPreviewFromModels} schema={schemaPreview} onSchemaReplace={setSchemaPreview} onCloudSync={handleCloudSync} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          ref={sidebarRef}
                          className={`glass-card border-r border-[rgba(255,255,255,0.08)] flex flex-col flex-shrink-0 transform transition-all duration-300 ease-in-out ${isDraggingState ? 'shadow-inner' : ''} ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'}`}
                          style={{ width: sidebarWidth, minWidth: 220 }}
                        >
                          <div className={`relative h-full flex flex-col transition-all duration-300 ease-in-out ${isDraggingState ? 'shadow-2xl' : ''}`}>
                            <ModelSettingsPanel models={models} onModelsChange={syncSchemaPreviewFromModels} schema={schemaPreview} onSchemaReplace={setSchemaPreview} />

                            {/* Drag handle (hidden on small screens) */}
                            <div className="absolute -right-6 top-1/2 z-40 hidden sm:flex -translate-y-1/2 items-center">
                              <div
                                title="Drag to resize sidebar (double-click to toggle)"
                                onMouseDown={(e) => {
                                  draggingRef.current = true;
                                  startXRef.current = e.clientX;
                                  startWidthRef.current = sidebarWidth;
                                  setIsDraggingState(true);
                                  // disable transition during drag for immediate response
                                  if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
                                  document.body.style.cursor = 'col-resize';
                                }}
                                onDoubleClick={() => setSidebarWidth((w) => (w > 240 ? 240 : 360))}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-black/60 border border-white/6 cursor-col-resize hover:bg-white/5 transition-colors"
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

                  <div className="flex-1 flex flex-col overflow-hidden">
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
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/30">
                          Configure your module and click Generate
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {activeView === 'generator' && !showWelcome && (
        <>
              <GenBar
                onGenerate={handleGenerate}
                onTryDemo={handleTryDemo}
                resetKey={chatResetKey}
                initialMessages={restoredMessages}
                onMessagesChange={setRestoredMessages}
                jobId={activeJobId}
                repositoryUrl={repositoryUrl}
                downloadUrl={downloadUrl}
                onCloudSync={handleCloudSync}
                status={status}
                progress={progress}
                onRepositoryUrlChange={setRepositoryUrl}
                isReady={isReadyToGenerate}
              />
        </>
      )}
    </div>
  );
}

export default App;
