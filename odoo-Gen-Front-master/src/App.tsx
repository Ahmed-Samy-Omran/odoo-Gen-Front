import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlowProvider,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
} from '@xyflow/react';
import { Toaster, toast } from 'sonner';

import Sidebar from './components/Sidebar';
import BottomBar from './components/BottomBar';
import CanvasView from './components/CanvasView';
import InspectorPanel from './components/InspectorPanel';
import ModelSettingsPanel from './components/ModelSettingsPanel';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import ParticleBackground from './components/ParticleBackground';
import LoadingOverlay from './components/LoadingOverlay';
import WelcomeDashboard from './components/WelcomeDashboard';

import {
  analyzeRequirements,
  AnalyzeResponse,
  ModuleDefinition,
  ModelDefinition,
  FieldDefinition,
  ViewConfig,
  QWebReport,
  AccessRule,
  UserGroup,
  mockAnalyzeResponse,
  ApiException,
} from './services/api';

import '@xyflow/react/dist/style.css';

type ViewType = 'canvas' | 'history' | 'settings';

interface ModelData {
  views: ViewConfig[];
  reports: QWebReport[];
  accessRules: AccessRule[];
}

interface HistoryItem {
  id: string;
  moduleName: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'processing';
  modelCount: number;
  response?: AnalyzeResponse;
}

function generateNodesAndEdges(response: AnalyzeResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let yOffset = 50;
  const moduleGroups: Record<string, Node[]> = {};

  response.modules.forEach((module: ModuleDefinition, moduleIndex: number) => {
    const moduleNodes: Node[] = [];

    module.models.forEach((model: ModelDefinition, modelIndex: number) => {
      const moduleId = module.technical_name || `module_${moduleIndex}`;

      nodes.push({
        id: model.name,
        type: 'tableNode',
        position: { x: 100 + (moduleIndex * 350), y: yOffset + (modelIndex * 250) },
        data: {
          label: model.name,
          modelName: model.name,
          moduleName: moduleId,
          fields: model.fields.map((field: FieldDefinition) => ({
            name: field.name,
            type: field.type,
            required: field.required,
            indexed: field.indexed,
            relation: field.relation,
            is_compute: field.is_compute,
            compute_code: field.compute_code,
            depends_fields: field.depends_fields,
            selection_options: field.selection_options,
            help: field.help,
            default_value: field.default_value,
          })),
          views: model.views,
          reports: model.reports,
          accessRules: model.access_rules,
        },
      });

      moduleNodes.push(nodes[nodes.length - 1]);
    });

    moduleGroups[module.technical_name] = moduleNodes;
  });

  nodes.forEach((node) => {
    const fields = node.data.fields as FieldDefinition[];
    fields.forEach((field) => {
      if (field.relation) {
        const targetId = field.relation;
        const sourceNode = nodes.find((n) => n.id === node.id);
        const targetNode = nodes.find((n) => n.id === targetId);

        if (sourceNode && targetNode && sourceNode.id !== targetId) {
          edges.push({
            id: `e-${node.id}-${field.name}-${targetId}`,
            source: node.id,
            sourceHandle: `${field.name}-source`,
            target: targetId,
            targetHandle: 'id-target',
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'rgba(255, 255, 255, 0.25)', strokeWidth: 2 },
          });
        }
      }
    });
  });

  return { nodes, edges };
}

function App() {
  const [activeView, setActiveView] = useState<ViewType>('canvas');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedField, setSelectedField] = useState<FieldDefinition | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [selectedModelState, setSelectedModelState] = useState<{
    name: string;
    moduleName: string;
    views: ViewConfig[];
    reports: QWebReport[];
    accessRules: AccessRule[];
    userGroups: UserGroup[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [templatePrompt, setTemplatePrompt] = useState<string>('');
  const [hasData, setHasData] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevHasDataRef = useRef(false);

  useEffect(() => {
    if (hasData && !prevHasDataRef.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
    prevHasDataRef.current = hasData;
  }, [hasData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 2 },
          },
          eds
        )
      ),
    []
  );

  const handleFieldSelect = useCallback(
    (field: FieldDefinition, nodeId: string) => {
      setSelectedField(field);
      setSelectedNodeId(nodeId);
      setInspectorOpen(true);
    },
    []
  );

  const handleInspectorClose = useCallback(() => {
    setInspectorOpen(false);
    setSelectedField(null);
    setSelectedNodeId(null);
  }, []);

  const handleModelHeaderClick = useCallback(
    (nodeId: string, data: any) => {
      setSelectedNodeId(nodeId);
      setSelectedModelState({
        name: data.modelName,
        moduleName: data.moduleName || '',
        views: data.views || [],
        reports: data.reports || [],
        accessRules: data.accessRules || [],
        userGroups: [],
      });
      setModelSettingsOpen(true);
    },
    []
  );

  const handleModelSettingsClose = useCallback(() => {
    setModelSettingsOpen(false);
    setSelectedModelState(null);
  }, []);

  const handleUpdateModelViews = useCallback(
    (views: ViewConfig[]) => {
      if (selectedNodeId) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNodeId
              ? { ...node, data: { ...node.data, views } }
              : node
          )
        );
        setSelectedModelState((prev) => prev ? { ...prev, views } : null);
      }
    },
    [selectedNodeId]
  );

  const handleUpdateModelReports = useCallback(
    (reports: QWebReport[]) => {
      if (selectedNodeId) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNodeId
              ? { ...node, data: { ...node.data, reports } }
              : node
          )
        );
        setSelectedModelState((prev) => prev ? { ...prev, reports } : null);
      }
    },
    [selectedNodeId]
  );

  const handleUpdateModelAccessRules = useCallback(
    (accessRules: AccessRule[]) => {
      if (selectedNodeId) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNodeId
              ? { ...node, data: { ...node.data, accessRules } }
              : node
          )
        );
        setSelectedModelState((prev) => prev ? { ...prev, accessRules } : null);
      }
    },
    [selectedNodeId]
  );

  const handleUpdateModelUserGroups = useCallback(
    (userGroups: UserGroup[]) => {
      setSelectedModelState((prev) => prev ? { ...prev, userGroups } : null);
    },
    []
  );

  const handleFieldUpdate = useCallback(
    (tableId: string, updates: Partial<FieldDefinition>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === tableId) {
            const updatedFields = (node.data.fields as FieldDefinition[]).map((field) =>
              field.name === selectedField?.name ? { ...field, ...updates } : field
            );
            return {
              ...node,
              data: {
                ...node.data,
                fields: updatedFields,
              },
            };
          }
          return node;
        })
      );

      if (selectedField) {
        setSelectedField((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [selectedField]
  );

  const handleSelectTemplate = useCallback((templatePrompt: string) => {
    setTemplatePrompt(templatePrompt);
  }, []);

  const handleExecute = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setCurrentPrompt(prompt);

    const processingItem: HistoryItem = {
      id: `temp-${Date.now()}`,
      moduleName: 'Processing...',
      timestamp: new Date(),
      status: 'processing',
      modelCount: 0,
    };

    setHistoryItems((prev) => [processingItem, ...prev]);

    try {
      const response = await analyzeRequirements(prompt);

      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(response);
      setNodes(newNodes);
      setEdges(newEdges);
      setHasData(true);

      const completedItem: HistoryItem = {
        id: `module-${Date.now()}`,
        moduleName: response.modules.map((m) => m.technical_name).join(' + '),
        timestamp: new Date(),
        status: 'completed',
        modelCount: response.modules.reduce((acc, m) => acc + m.models.length, 0),
        response,
      };

      setHistoryItems((prev) =>
        prev.map((item) => (item.id === processingItem.id ? completedItem : item))
      );

      setActiveView('canvas');
    } catch (err) {
      console.error('API Error:', err);

      const { nodes: mockNodes, edges: mockEdges } = generateNodesAndEdges(mockAnalyzeResponse);
      setNodes(mockNodes);
      setEdges(mockEdges);
      setHasData(true);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof ApiException) {
        errorMessage = err.message;
        console.error(`[${err.errorType}] ${err.debugDetails}`);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, {
        duration: 6000,
        style: {
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
        },
      });

      const failedItem: HistoryItem = {
        id: `failed-${Date.now()}`,
        moduleName: 'Failed Request',
        timestamp: new Date(),
        status: 'failed',
        modelCount: 0,
      };

      setHistoryItems((prev) =>
        prev.map((item) => (item.id === processingItem.id ? failedItem : item))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadModule = useCallback((id: string) => {
    const item = historyItems.find((h) => h.id === id);
    if (item?.response) {
      const { nodes: loadedNodes, edges: loadedEdges } = generateNodesAndEdges(item.response);
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setHasData(true);
      setActiveView('canvas');
    }
  }, [historyItems]);

  const handleSaveSettings = useCallback((settings: { apiKey: string; odooVersion: string }) => {
    console.log('Saving settings:', settings);
  }, []);

  const renderMainContent = useMemo(() => {
    if (activeView === 'history') {
      return <HistoryView items={historyItems} onLoadModule={handleLoadModule} />;
    }

    if (activeView === 'settings') {
      return <SettingsView onSave={handleSaveSettings} />;
    }

    if (!hasData) {
      return <WelcomeDashboard onSelectTemplate={handleSelectTemplate} />;
    }

    return (
      <CanvasView
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onFieldSelect={handleFieldSelect}
        onModelHeaderClick={handleModelHeaderClick}
        selectedNode={selectedNodeId || undefined}
      />
    );
  }, [activeView, hasData, nodes, edges, onNodesChange, onEdgesChange, onConnect, handleFieldSelect, handleModelHeaderClick, selectedNodeId, historyItems, handleLoadModule, handleSaveSettings, handleSelectTemplate, inspectorOpen, selectedField]);

  return (
    <ReactFlowProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e5e7eb',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
      <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative">
        <ParticleBackground />

        <LoadingOverlay isVisible={isLoading} message="Analyzing requirements..." />

        <div className="flex flex-1 relative z-10 overflow-hidden">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />

          <main className="flex-1 overflow-hidden relative">
            <div
              key={`${activeView}-${hasData}`}
              className={`w-full h-full ${
                isTransitioning ? 'animate-fadeIn' : ''
              }`}
            >
              {renderMainContent}
            </div>
          </main>

          <InspectorPanel
            isOpen={inspectorOpen}
            field={selectedField}
            tableId={selectedNodeId}
            onClose={handleInspectorClose}
            onUpdate={handleFieldUpdate}
          />

          <ModelSettingsPanel
            isOpen={modelSettingsOpen}
            modelName={selectedModelState?.name || null}
            moduleName={selectedModelState?.moduleName || null}
            views={selectedModelState?.views || []}
            reports={selectedModelState?.reports || []}
            accessRules={selectedModelState?.accessRules || []}
            userGroups={selectedModelState?.userGroups || []}
            onClose={handleModelSettingsClose}
            onUpdateViews={handleUpdateModelViews}
            onUpdateReports={handleUpdateModelReports}
            onUpdateAccessRules={handleUpdateModelAccessRules}
            onUpdateUserGroups={handleUpdateModelUserGroups}
          />
        </div>

        <BottomBar
          onExecute={handleExecute}
          isLoading={isLoading}
          initialPrompt={templatePrompt}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
