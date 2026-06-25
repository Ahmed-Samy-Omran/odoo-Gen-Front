import { useState } from 'react';
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
import type { GeneratorPayload } from './services/api';
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

interface GeneratedFile {
  name: string;
  path: string;
  content: string;
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
  const resetGenerationState = () => {
    setGeneratedFiles([]);
    setSelectedFile(null);
    setModels([]);
  };

  const handleGenerate = async (payload: GeneratorPayload) => {
    // Clear old data immediately before starting new generation
    resetGenerationState();

    setStatus('generating');
    setStatusMessage(`Generating module "${payload.moduleName}"...`);
    setDeploymentStrategy(payload.deploymentStrategy);
    setRepositoryUrl(payload.repositoryUrl || '');
    setShowWelcome(false);
    setShowLeftPanel(true);

    // Simulate generation (replace with actual API call)
    // In production, this would be: const result = await generateModule(payload);
    setTimeout(() => {
      // Safely access models with fallbacks
      const firstModel = models?.[0];
      const modelName = firstModel?.name || 'main_model';
      const modelFields = firstModel?.fields || [];
      const modelClassName = modelName
        ?.split('_')
        ?.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        ?.join('') || 'MainModel';

      const mockFiles: GeneratedFile[] = [
        {
          name: '__manifest__.py',
          path: '__manifest__.py',
          content: `# -*- coding: utf-8 -*-
{
    'name': '${payload.moduleName}',
    'version': '${payload.version}',
    'summary': '${payload.description}',
    'author': '${payload.author}',
    'category': '${payload.category}',
    'depends': ${JSON.stringify(payload.depends)},
    'data': [],
    'demo': [],
    'installable': True,
    'auto_install': False,
}`,
        },
        {
          name: '__init__.py',
          path: '__init__.py',
          content: `# -*- coding: utf-8 -*-

from . import models
`,
        },
        {
          name: 'models.py',
          path: 'models/__init__.py',
          content: `# -*- coding: utf-8 -*-

from . import ${modelName}
`,
        },
        {
          name: `${modelName}.py`,
          path: `models/${modelName}.py`,
          content: `# -*- coding: utf-8 -*-

from odoo import models, fields, api

class ${modelClassName}(models.Model):
    _name = '${payload.moduleName}.${modelName}'
    _description = '${payload.description}'

${modelFields.length > 0
  ? modelFields.map((f: ModelField) => `    ${f.name} = fields.${f.type}(${f.required ? "required=True, " : ''}string='${f.name.charAt(0).toUpperCase() + f.name.slice(1)}')`).join('\n')
  : '    name = fields.Char(required=True, string="Name")'}
`,
        },
      ];

      // Add README if GitHub deployment
      if (payload.deploymentStrategy === 'github') {
        mockFiles.push({
          name: 'README.md',
          path: 'README.md',
          content: `# ${payload.moduleName}

${payload.description}

## Installation

1. Download this module
2. Copy to your Odoo addons directory
3. Update app list
4. Install the module

## Author

${payload.author}

## License

MIT
`,
        });
      }

      // Only update state with new data from API response
      setGeneratedFiles(mockFiles);
      setSelectedFile(mockFiles[0]?.path || null);
      setStatus('success');
      setStatusMessage(`Module "${payload.moduleName}" generated successfully`);
    }, 2000);
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

                  {generatedFiles.length > 0 ? (
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
                        <p className="text-dark-400">Configure your module and click Generate</p>
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
