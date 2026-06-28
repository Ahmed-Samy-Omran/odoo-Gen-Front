import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomBar } from './components/BottomBar';
import { CanvasView } from './components/CanvasView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ModelSettingsPanel } from './components/ModelSettingsPanel';
import {
  generateModule,
  type GeneratorPayload,
  type GeneratedFile,
  type JobStatus,
} from './services/api';
import { Github, FileArchive } from 'lucide-react';

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

  const resetGenerationState = useCallback(() => {
    setGeneratedFiles([]);
    setSelectedFile(null);
    setStatus('idle');
    setStatusMessage('');
    setProgress(0);
    setEstimatedRemaining(null);
    setDownloadUrl('');
    setDeploymentStrategy('local_zip');
    setRepositoryUrl('');
  }, []);

  const handleProgress = useCallback((job: JobStatus) => {
    setProgress(job.progress ?? 0);
    setStatusMessage(job.message || 'Generating...');
    setEstimatedRemaining(job.estimated_remaining_sec ?? null);
  }, []);

  const handleGenerate = async (payload: GeneratorPayload) => {
    resetGenerationState();

    setStatus('generating');
    setStatusMessage(`Analyzing "${payload?.moduleName || 'module'}"...`);
    setProgress(0);
    setDeploymentStrategy(payload?.deploymentStrategy || 'local_zip');
    setRepositoryUrl(payload?.repositoryUrl || '');
    setShowWelcome(false);
    setShowLeftPanel(true);

    try {
      const fullPayload: GeneratorPayload = {
        ...payload,
        models: models?.map(m => ({
          name: m?.name,
          fields: m?.fields?.map(f => ({
            name: f?.name,
            type: f?.type,
            required: f?.required,
          })),
        })) || [],
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
        setStatus('error');
        setStatusMessage(result.message || 'Generation failed');
      }
    } catch (error) {
      console.error('App generation error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleStartGenerating = () => {
    setShowWelcome(false);
    setActiveView('generator');
  };

  const getDeploymentBadge = () => {
    if (status !== 'generating' && status !== 'success') return null;

    if (deploymentStrategy === 'github') {
      return (
        <div className="fixed top-4 right-4 z-50">
          <span className="command-context-badge">
            <Github className="w-3 h-3" />
            <span>Deploying to GitHub</span>
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          </span>
        </div>
      );
    }

    return (
      <div className="fixed top-4 right-4 z-50">
        <span className="command-context-badge">
          <FileArchive className="w-3 h-3" />
          <span>Preparing ZIP</span>
          <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
        </span>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative">
      <ParticleBackground />

      <LoadingOverlay
        isVisible={status === 'generating'}
        message={statusMessage}
        progress={progress}
        estimatedRemainingSec={estimatedRemaining}
      />

      <div className="flex flex-1 relative z-10 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <main className="flex-1 overflow-hidden relative">
          {activeView === 'history' && <HistoryView />}
          {activeView === 'settings' && <SettingsView />}

          {activeView === 'generator' && (
            <>
              {showWelcome ? (
                <WelcomeDashboard onStartGenerating={handleStartGenerating} />
              ) : (
                <div className="flex h-full overflow-hidden">
                  {showLeftPanel && (
                    <div className="w-80 glass-card border-r border-glass-border flex flex-col flex-shrink-0">
                      <ModelSettingsPanel models={models} onModelsChange={setModels} />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col overflow-hidden">
                    {getDeploymentBadge()}

                    {status === 'success' && generatedFiles.length > 0 ? (
                      <CanvasView
                        files={generatedFiles}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFile}
                        deploymentStrategy={deploymentStrategy}
                        repositoryUrl={repositoryUrl}
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/30">
                          {status === 'generating'
                            ? 'Processing your request...'
                            : 'Configure your module and click Generate'}
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
        <BottomBar
          status={status}
          statusMessage={statusMessage}
          deploymentStrategy={deploymentStrategy}
          progress={progress}
          downloadUrl={downloadUrl}
          repositoryUrl={repositoryUrl}
          onGenerate={handleGenerate}
          isGenerating={status === 'generating'}
        />
      )}
    </div>
  );
}

export default App;
