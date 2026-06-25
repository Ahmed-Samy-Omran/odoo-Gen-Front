import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomBar } from './components/BottomBar';
import { InspectorPanel } from './components/InspectorPanel';
import { CanvasView } from './components/CanvasView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ModelSettingsPanel } from './components/ModelSettingsPanel';
import { generateModule, type GeneratorPayload, type GeneratedFile } from './services/api';
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [deploymentStrategy, setDeploymentStrategy] = useState<'github' | 'local_zip'>('local_zip');
  const [repositoryUrl, setRepositoryUrl] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(false);

  // Reset all state for a fresh generation
  const resetGenerationState = useCallback(() => {
    setGeneratedFiles([]);
    setSelectedFile(null);

    setStatus('idle');
    setStatusMessage('');
    setDeploymentStrategy('local_zip'); // Reset deployment strategy
    setRepositoryUrl(''); // Reset repository URL
  }, []);

  const handleGenerate = async (payload: GeneratorPayload) => {
    // 1. Reset state before starting new generation
    resetGenerationState();

    // 2. Set initial generating state
    setStatus('generating');
    setStatusMessage(`Generating module "${payload?.moduleName || 'module'}"...`);
    setDeploymentStrategy(payload?.deploymentStrategy || 'local_zip');
    setRepositoryUrl(payload?.repositoryUrl || '');
    setShowWelcome(false);
    setShowLeftPanel(true);

    try {
      // 3. Include current models from state into the payload
      const fullPayload: GeneratorPayload = {
        ...payload,
        models: models?.map(m => ({
          name: m?.name,
          fields: m?.fields?.map(f => ({
            name: f?.name,
            type: f?.type,
            required: f?.required
          }))
        })) || []
      };

      // 4. Call API
      const result = await generateModule(fullPayload);

      if (result?.success) {
        setGeneratedFiles(result.files || []);
        setSelectedFile(result.files?.[0]?.path || null);
        setRepositoryUrl(result.repositoryUrl || payload.repositoryUrl || '');
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
          <span className="badge badge-github flex items-center gap-2 px-4 py-2">
            <Github className="w-4 h-4" />
            <span>Deploying to GitHub</span>
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          </span>
        </div>
      );
    }

    return (
      <div className="fixed top-4 right-4 z-50">
        <span className="badge badge-zip flex items-center gap-2 px-4 py-2">
          <FileArchive className="w-4 h-4" />
          <span>Preparing ZIP</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </span>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-dark-950">
      <ParticleBackground />

      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col ml-16 lg:ml-64">
        {activeView === 'history' && <HistoryView />}
        {activeView === 'settings' && <SettingsView />}

        {activeView === 'generator' && (
          <div className="flex-1 flex overflow-hidden">
            {showWelcome ? (
              <WelcomeDashboard onStartGenerating={handleStartGenerating} />
            ) : (
              <>
                {showLeftPanel && (
                  <div className="w-80 border-r border-dark-700/50 flex flex-col">
                    <ModelSettingsPanel models={models} onModelsChange={setModels} />
                  </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                  {getDeploymentBadge()}

                  {generatedFiles && generatedFiles.length > 0 ? (
                    <CanvasView
                      files={generatedFiles}
                      selectedFile={selectedFile}
                      onSelectFile={setSelectedFile}
                      deploymentStrategy={deploymentStrategy}
                      repositoryUrl={repositoryUrl}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-dark-400">
                          {status === 'generating' 
                            ? 'Processing your request...' 
                            : 'Configure your module and click Generate'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <InspectorPanel onGenerate={handleGenerate} isGenerating={status === 'generating'} />
              </>
            )}
          </div>
        )}
      </div>

      {activeView === 'generator' && !showWelcome && (
        <div className="ml-16 lg:ml-64">
          <BottomBar
            status={status}
            statusMessage={statusMessage}
            deploymentStrategy={deploymentStrategy}
          />
        </div>
      )}

      {status === 'generating' && <LoadingOverlay message={statusMessage} />}
    </div>
  );
}

export default App;
