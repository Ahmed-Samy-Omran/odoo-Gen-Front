import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Table, Key, Link, Hash, Plus, Trash2, ArrowLeftRight, Undo2, Redo2, Save } from 'lucide-react';
import type { SchemaField, SchemaPreview } from '../utils/diagramBuilder';
import { DiagramZoomToolbar } from './DiagramZoomToolbar';

const MAX_VISIBLE_FIELDS = 6;
const DEFAULT_MAX_ZOOM = 0.72;
const FIT_PADDING = 0.4;

interface TableNodeData extends Record<string, unknown> {
  label: string;
  modelName: string;
  moduleName?: string;
  fields: SchemaField[];
  isRevealing?: boolean;
}

const getFieldIcon = (type: string, relation?: string | null) => {
  if (relation) return <Link className="w-3 h-3 text-sky-400/60" />;
  if (type === 'id' || type.includes('id')) return <Key className="w-3 h-3 text-white/35" />;
  return <Hash className="w-3 h-3 text-white/20" />;
};

const TableNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as TableNodeData;
  const { modelName, fields, isRevealing } = nodeData;
  const [expanded, setExpanded] = useState(false);
  const visibleFields = expanded ? fields : fields.slice(0, MAX_VISIBLE_FIELDS);
  const hiddenCount = Math.max(0, fields.length - visibleFields.length);

  return (
    <div
      className={`diagram-erd-node ${selected ? 'diagram-erd-node-selected' : ''} ${
        isRevealing ? 'animate-diagram-soft-in' : ''
      }`}
    >
      <div className="diagram-erd-node-header">
        <Table className="w-3.5 h-3.5 text-white/40" />
        <span className="font-mono text-[13px] font-medium text-white/80">{modelName}</span>
        <span className="ml-auto text-[10px] text-white/25 font-mono">{fields.length} fields</span>
      </div>

      <div className="diagram-erd-node-body">
        {visibleFields.map((field) => (
          <div key={field.name} className="diagram-erd-field">
            <Handle
              type="target"
              position={Position.Left}
              id={`${field.name}-target`}
              className="diagram-handle diagram-handle-left"
            />
            <Handle
              type="target"
              position={Position.Left}
              id="id-target"
              className="!opacity-0 !w-px !h-px !min-w-0 !min-h-0 !border-0"
            />

            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getFieldIcon(field.type, field.relation)}
              <span className="font-mono text-[11px] text-white/50 truncate">{field.name}</span>
            </div>

            <span className="text-[10px] text-white/20 font-mono shrink-0">{field.type}</span>

            {field.required && (
              <span className="text-[9px] text-amber-400/50 font-medium shrink-0">*</span>
            )}

            <Handle
              type="source"
              position={Position.Right}
              id={`${field.name}-source`}
              className="diagram-handle diagram-handle-right"
            />
          </div>
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="w-full text-left px-3.5 py-2 text-[11px] font-medium text-cyan-300/85 hover:text-cyan-200 transition-colors"
          >
            {expanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { tableNode: TableNode };

/** Fit viewport once based on full diagram — stable zoom while nodes animate in */
const ErdViewportManager: React.FC<{
  allNodes: Node[];
  layoutKey: string;
  isDrawing: boolean;
}> = ({ allNodes, layoutKey, isDrawing }) => {
  const { fitView } = useReactFlow();
  const fittedKeyRef = useRef<string | null>(null);

  const fitAll = useCallback(
    (animated: boolean) => {
      if (allNodes.length === 0) return;
      fitView({
        nodes: allNodes.map((n) => ({ id: n.id })),
        padding: FIT_PADDING,
        maxZoom: DEFAULT_MAX_ZOOM,
        minZoom: 0.25,
        duration: animated ? 350 : 0,
      });
    },
    [allNodes, fitView],
  );

  // Initial layout: fit full diagram bounds (not just visible nodes)
  useEffect(() => {
    if (allNodes.length === 0 || fittedKeyRef.current === layoutKey) return;
    fittedKeyRef.current = layoutKey;
    const timer = setTimeout(() => fitAll(false), 80);
    return () => clearTimeout(timer);
  }, [layoutKey, allNodes.length, fitAll]);

  // After draw animation ends, gentle refit
  useEffect(() => {
    if (isDrawing || allNodes.length === 0) return;
    const timer = setTimeout(() => fitAll(true), 120);
    return () => clearTimeout(timer);
  }, [isDrawing, allNodes.length, fitAll]);

  return null;
};

interface ErdDiagramProps {
  nodes: Node[];
  edges: Edge[];
  visibleNodeCount?: number;
  visibleEdgeCount?: number;
  layoutKey?: string;
  isDrawing?: boolean;
  schema?: SchemaPreview | null;
  onSchemaChange?: (schema: SchemaPreview) => void;
}

export const ErdDiagram: React.FC<ErdDiagramProps> = ({
  nodes,
  edges,
  visibleNodeCount,
  visibleEdgeCount,
  layoutKey = '',
  isDrawing = false,
  schema,
  onSchemaChange,
}) => {
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_MAX_ZOOM);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [history, setHistory] = useState<SchemaPreview[]>([]);
  const [future, setFuture] = useState<SchemaPreview[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ id: string; source: string; target: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const reactFlow = useReactFlow();

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn?.({ duration: 200 });
    const viewport = reactFlow.getViewport?.();
    if (viewport) setZoomLevel(viewport.zoom);
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut?.({ duration: 200 });
    const viewport = reactFlow.getViewport?.();
    if (viewport) setZoomLevel(viewport.zoom);
  }, [reactFlow]);

  const handleReset = useCallback(() => {
    reactFlow.fitView?.({
      padding: FIT_PADDING,
      duration: 200,
      maxZoom: DEFAULT_MAX_ZOOM,
      minZoom: 0.25,
    });
    const viewport = reactFlow.getViewport?.();
    if (viewport) setZoomLevel(viewport.zoom);
  }, [reactFlow]);

  const handleToggleFullscreen = useCallback(async () => {
    const element = wrapperRef.current;
    if (!element) return;
    if (!document.fullscreenElement) {
      await element.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', updateFullscreen);
    updateFullscreen();
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  const visibleNodes = useMemo(() => {
    const count = visibleNodeCount ?? nodes.length;
    return nodes.slice(0, count).map((node, i) => ({
      ...node,
      // ensure nodes become draggable when in 'select' (arrow) interaction mode
      draggable: interactionMode === 'select',
      data: { ...node.data, isRevealing: i === count - 1 },
    }));
  }, [nodes, visibleNodeCount, interactionMode]);

  useEffect(() => {
    setFlowNodes(visibleNodes);
  }, [visibleNodes]);

  useEffect(() => {
    const count = visibleEdgeCount ?? edges.length;
    const nextEdges = edges
      .slice(0, count)
      .filter((e) => flowNodes.some((n) => n.id === e.source) && flowNodes.some((n) => n.id === e.target))
      .map((e) => ({
        ...e,
        style: {
          stroke: selectedEdge?.id === e.id ? 'rgba(34, 211, 238, 0.95)' : 'rgba(120, 180, 255, 0.25)',
          strokeWidth: selectedEdge?.id === e.id ? 3 : 1.8,
        },
        animated: true,
      }));
    setFlowEdges(nextEdges);
  }, [edges, visibleEdgeCount, flowNodes, selectedEdge]);

  const visibleEdges = useMemo(() => flowEdges, [flowEdges]);

  if (nodes.length === 0) {
    return (
      <div className="diagram-canvas flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex gap-5 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-28 h-20 rounded-xl border border-white/[0.06] bg-white/[0.02] skeleton-loader"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <p className="text-white/25 text-sm tracking-wide">Analyzing entities...</p>
        </div>
      </div>
    );
  }

  const pushSnapshot = useCallback((nextSchema: SchemaPreview) => {
    if (!schema) return;
    setHistory((current) => [...current, schema]);
    setFuture([]);
    onSchemaChange?.(nextSchema);
  }, [schema, onSchemaChange]);

  const handleUndo = useCallback(() => {
    if (!schema || history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setFuture((current) => [schema, ...current]);
    onSchemaChange?.(previous);
  }, [history, schema, onSchemaChange]);

  const handleRedo = useCallback(() => {
    if (!schema || future.length === 0) return;
    const next = future[0];
    setFuture((current) => current.slice(1));
    setHistory((current) => [...current, schema]);
    onSchemaChange?.(next);
  }, [future, schema, onSchemaChange]);

  const handleAddField = useCallback(() => {
    if (!schema || !selectedNodeId) return;
    const model = schema.models.find((item) => item.name === selectedNodeId);
    if (!model) return;
    const fieldName = window.prompt('Field name', `field_${model.fields.length + 1}`);
    if (!fieldName) return;
    const nextSchema: SchemaPreview = {
      ...schema,
      models: schema.models.map((item) => item.name === selectedNodeId ? {
        ...item,
        fields: [...item.fields, { name: fieldName, type: 'char', required: false }],
      } : item),
    };
    pushSnapshot(nextSchema);
  }, [pushSnapshot, schema, selectedNodeId]);

  const handleCreateRelation = useCallback(() => {
    if (!schema || !selectedNodeId) return;
    const targetModel = window.prompt('Target model name', '');
    if (!targetModel) return;
    const relationType = window.prompt('Relation type (many2one or one2many)', 'many2one');
    if (!relationType) return;
    const fieldName = window.prompt('Field name', `${targetModel.toLowerCase()}_id`);
    if (!fieldName) return;
    const nextSchema: SchemaPreview = {
      ...schema,
      models: schema.models.map((item) => item.name === selectedNodeId ? {
        ...item,
        fields: [
          ...item.fields,
          { name: fieldName, type: relationType, required: false, relation: targetModel },
        ],
      } : item),
    };
    pushSnapshot(nextSchema);
  }, [pushSnapshot, schema, selectedNodeId]);

  const handleDeleteSelection = useCallback(() => {
    if (!schema) return;

    if (selectedEdge) {
      const nextSchema: SchemaPreview = {
        ...schema,
        models: schema.models.map((item) => ({
          ...item,
          fields: item.fields.filter((field) => field.relation !== selectedEdge.target),
        })),
      };
      pushSnapshot(nextSchema);
      setSelectedEdge(null);
      return;
    }

    if (selectedNodeId) {
      const nextSchema: SchemaPreview = {
        ...schema,
        models: schema.models.filter((item) => item.name !== selectedNodeId),
      };
      pushSnapshot(nextSchema);
      setSelectedNodeId(null);
    }
  }, [pushSnapshot, schema, selectedEdge, selectedNodeId]);

  const handleSaveLocal = useCallback(() => {
    if (!schema) return;
    localStorage.setItem('odoo_erd_schema', JSON.stringify(schema));
    window.alert('ERD schema saved locally in this browser.');
  }, [schema]);

  useEffect(() => {
    if (!schema) {
      const saved = localStorage.getItem('odoo_erd_schema');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as SchemaPreview;
          onSchemaChange?.(parsed);
        } catch {
          // ignore invalid saved data
        }
      }
    }
  }, [schema, onSchemaChange]);

  return (
    <div className="diagram-canvas relative" ref={wrapperRef}>
      <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/45 px-2 py-2 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={future.length === 0}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveLocal}
              className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2 text-amber-200 transition hover:bg-amber-500/20"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
        <DiagramZoomToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          onFullscreenToggle={handleToggleFullscreen}
          onToggleInteractionMode={() => {
            setInteractionMode((mode) => (mode === 'pan' ? 'select' : 'pan'));
          }}
          interactionMode={interactionMode}
          isFullscreen={isFullscreen}
          zoomLevel={zoomLevel}
        />
      </div>
      {selectedNodeId && (
        <div className="absolute left-3 top-20 z-20 rounded-2xl border border-white/10 bg-black/55 px-2 py-2 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl transition-all duration-200">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAddField}
              className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCreateRelation}
              className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-2 text-sky-200 transition hover:bg-sky-500/20"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDeleteSelection}
              className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={flowNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: DEFAULT_MAX_ZOOM }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={interactionMode === 'select'}
        nodesConnectable={false}
        elementsSelectable={interactionMode === 'select'}
        panOnDrag={interactionMode === 'pan'}
        zoomOnScroll
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdge(null);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdge(null);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdge({ id: edge.id, source: edge.source, target: edge.target });
          setSelectedNodeId(null);
        }}
        onNodeDragStop={(_, node) => {
          if (interactionMode !== 'select' || !schema) return;
          setFlowNodes((current) =>
            current.map((currentNode) =>
              currentNode.id === node.id ? { ...currentNode, position: node.position } : currentNode,
            ),
          );
          const nextPositions = { ...(schema.positions || {}) };
          nextPositions[node.id] = node.position;
          pushSnapshot({ ...schema, positions: nextPositions });
        }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'rgba(120, 180, 255, 0.25)', strokeWidth: 1.5 },
          animated: true,
        }}
        className="bg-transparent"
      >
        <ErdViewportManager
          allNodes={nodes}
          layoutKey={layoutKey}
          isDrawing={isDrawing}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.03)"
        />
        <MiniMap
          className="diagram-minimap"
          nodeColor="rgba(255, 255, 255, 0.08)"
          maskColor="rgba(0, 0, 0, 0.85)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};
