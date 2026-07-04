import { useState, useCallback, useRef } from 'react';
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
  name: string;
  type: string;
  required: boolean;
}

interface Model {
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
  const [schemaPreview, setSchemaPreview] = useState<SchemaPreview | null>(null);
  const schemaSetRef = useRef(false);

  const resetGenerationState = useCallback(() => {
    setGeneratedFiles([]);
    setSelectedFile(null);
    setStatus('idle');
    setStatusMessage('');
    setProgress(0);
    setEstimatedRemaining(null);
    setDeploymentStrategy('local_zip');
    setRepositoryUrl('');
    setDownloadUrl('');
    setSchemaPreview(null);
    schemaSetRef.current = false;
  }, []);

  const handleProgress = useCallback((job: JobStatus) => {
    setProgress(job.progress ?? 0);
    setStatusMessage(job.error || job.message || 'Generating...');
    setEstimatedRemaining(job.estimated_remaining_sec ?? null);
    if (job.schema_preview && !schemaSetRef.current) {
      setSchemaPreview(job.schema_preview);
      schemaSetRef.current = true;
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
      schemaSetRef.current = true;
    } else {
      const hasStructuredModels = payload.models?.some((m) => m.fields?.length > 0);
      if (hasStructuredModels) {
        setSchemaPreview(buildSchemaFromPayload(payload.moduleName, payload.models));
        schemaSetRef.current = true;
      }
    }

    try {
      const fullPayload: GeneratorPayload = payload.rawConfig
        ? payload
        : {
            ...payload,
            models: (
              schemaPreview?.models?.length
                ? schemaPreview.models.map((m) => ({
                    name: m?.name,
                    fields: m?.fields?.map((f) => ({
                      name: f?.name,
                      type: f?.type,
                      required: f?.required,
                    })) || [],
                  }))
                : models?.map((m) => ({
                    name: m?.name,
                    fields: m?.fields?.map((f) => ({
                      name: f?.name,
                      type: f?.type,
                      required: f?.required,
                    })) || [],
                  })) || []
            ),
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

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative">
      <ParticleBackground />

      <div className="flex flex-1 relative z-10 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

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
                  {showLeftPanel && (
                    <div className="w-80 glass-card border-r border-glass-border flex flex-col flex-shrink-0">
                      <ModelSettingsPanel models={models} onModelsChange={setModels} />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col overflow-hidden">
                    {(status === 'generating' || status === 'success' || status === 'error' || schemaPreview) ? (
                      <SystemBuildView
                        schema={schemaPreview}
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
        <GenBar onGenerate={handleGenerate} onTryDemo={handleTryDemo} />
      )}
    </div>
  );
}

export default App;
