import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { GenBar } from './components/GenBar';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { ModelSettingsPanel } from './components/ModelSettingsPanel';
import { SystemBuildView } from './components/SystemBuildView';
import {
  generateModule,
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
  const [activeView, setActiveView] = useState<ViewType>('generator');
  const [status, setStatus] = useState<StatusType>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>('local_zip');
  const [repositoryUrl, setRepositoryUrl] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
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
      localStorage.setItem('odoo_sidebar_width', String(sidebarWidth));
    } catch {
      // ignore
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (!schemaPreview) return;
    try {
      localStorage.setItem('odoo_erd_schema', JSON.stringify(schemaPreview));
    } catch {
      // ignore
    }
  }, [schemaPreview]);

  useEffect(() => {
    try {
      const rawSchema = localStorage.getItem('odoo_erd_schema');
      if (rawSchema) {
        const parsed = JSON.parse(rawSchema);
        const isValidSchema =
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.module_name === 'string' &&
          Array.isArray(parsed.models) &&
          Array.isArray(parsed.actors) &&
          Array.isArray(parsed.use_cases) &&
          parsed.models.every(
            (model: any) =>
              model &&
              typeof model === 'object' &&
              typeof model.name === 'string' &&
              Array.isArray(model.fields) &&
              model.fields.every(
                (field: any) =>
                  field &&
                  typeof field === 'object' &&
                  typeof field.name === 'string' &&
                  typeof field.type === 'string' &&
                  typeof field.required === 'boolean',
              ),
          );

        if (isValidSchema) {
          setSchemaPreview(parsed);
        } else {
          localStorage.removeItem('odoo_erd_schema');
        }
      }
    } catch {
      try {
        localStorage.removeItem('odoo_erd_schema');
      } catch {
        // ignore
      }
    }
  }, []);

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
  const schemaSetRef = useRef(false);
  const modelsSyncedRef = useRef(false);
  const modelsRef = useRef<Model[]>([]);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const syncSchemaPreviewFromModels = useCallback((nextModels: Model[]) => {
    const previousModelsById = new Map(modelsRef.current.map((model) => [model.id, model]));

    setModels(nextModels);
    modelsRef.current = nextModels;
    modelsSyncedRef.current = true;
    setSchemaPreview((current) => {
      // Keep sidebar and ERD in sync — build schema from models even if none exists yet
      if (!current && nextModels.length === 0) return current;

      const moduleName = current?.module_name || 'custom_module';
      const existingModels = new Map((current?.models || []).map((model) => [model.name, model]));
      const knownModelNames = new Set(nextModels.map((m) => m.name));

      return {
        module_name: moduleName,
        actors: current?.actors?.length ? current.actors : ['User', 'Administrator'],
        use_cases: (current?.use_cases || []).filter(
          (uc) => !uc.model || knownModelNames.has(uc.model),
        ),
        models: nextModels.map((model) => {
          const previousModel = previousModelsById.get(model.id);
          const existingModel =
            existingModels.get(previousModel?.name || model.name) || existingModels.get(model.name);
          return {
            name: model.name,
            module_name: moduleName,
            description: existingModel?.description,
            fields: model.fields.map((field) => {
              const existingField = existingModel?.fields?.find((f) => f.name === field.name);
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
    });
  }, []);

  const resetGenerationState = useCallback(() => {
    setGeneratedFiles([]);
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
    }
    schemaSetRef.current = false;
    modelsSyncedRef.current = false;
  }, []);

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

  const handleGenerate = async (payload: GeneratorPayload) => {
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
      const fullPayload: GeneratorPayload = payload.rawConfig
        ? payload
        : {
            ...payload,
            models: payload.models?.length ? payload.models : [],
          };

      const result = await generateModule(fullPayload, handleProgress);

      if (result?.success) {
        setGeneratedFiles(result.files || []);
        setSelectedFile(result.files?.[0]?.path || null);
        setRepositoryUrl(result.repositoryUrl || payload.repositoryUrl || '');
        setDownloadUrl(result.downloadUrl || '');
        setProgress(100);
        setEstimatedRemaining(null);
        setStatus('success');
        setStatusMessage(result.message || 'Generation successful');
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
    void handleGenerate(buildDemoPayload());
  };

  const handleStartGenerating = () => {
    setShowWelcome(false);
    setActiveView('generator');
  };

  useEffect(() => {
    if (!schemaPreview || modelsSyncedRef.current || models.length > 0) return;

    setModels(
      schemaPreview.models.map((model) => ({
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
    );
    modelsSyncedRef.current = true;
  }, [models.length, schemaPreview]);

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative">
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
        <Sidebar activeView={activeView} onViewChange={setActiveView} showLogo={false} />

        <main className="flex-1 overflow-hidden relative">
          {activeView === 'history' && <HistoryView />}
          {activeView === 'settings' && <SettingsView />}

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
                            className={`relative h-full bg-black/95 border-r border-glass-border shadow-2xl transform transition-transform duration-300 ease-out ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
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
                              <ModelSettingsPanel models={models} onModelsChange={syncSchemaPreviewFromModels} schema={schemaPreview} onSchemaReplace={setSchemaPreview} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          ref={sidebarRef}
                          className={`glass-card border-r border-glass-border flex flex-col flex-shrink-0 transform transition-all duration-300 ease-in-out ${isDraggingState ? 'shadow-2xl ring-4 ring-cyan-500/10' : ''} ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'}`}
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
        <GenBar
          onGenerate={handleGenerate}
          onTryDemo={handleTryDemo}
          
        />
      )}
    </div>
  );
}

export default App;
