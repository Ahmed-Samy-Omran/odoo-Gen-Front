import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Handle,
  Position,
  Panel,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Table, Key, Link, Hash } from 'lucide-react';
import type { SchemaField } from '../utils/diagramBuilder';
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
  const visibleFields = fields.slice(0, MAX_VISIBLE_FIELDS);
  const hiddenCount = fields.length - visibleFields.length;

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
          <div className="px-3 py-1.5 text-[10px] text-white/20 font-mono text-center border-t border-white/[0.04]">
            +{hiddenCount} more
          </div>
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

const ErdZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoomLevel, setZoomLevel] = React.useState(DEFAULT_MAX_ZOOM);

  const syncZoom = useCallback(() => {
    setZoomLevel(getZoom());
  }, [getZoom]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
    setTimeout(syncZoom, 220);
  }, [zoomIn, syncZoom]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
    setTimeout(syncZoom, 220);
  }, [zoomOut, syncZoom]);

  const handleReset = useCallback(() => {
    fitView({ padding: FIT_PADDING, maxZoom: DEFAULT_MAX_ZOOM, duration: 300 });
    setTimeout(syncZoom, 320);
  }, [fitView, syncZoom]);

  React.useEffect(() => {
    const timer = setTimeout(syncZoom, 200);
    return () => clearTimeout(timer);
  }, [syncZoom]);

  return (
    <DiagramZoomToolbar
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onReset={handleReset}
      zoomLevel={zoomLevel}
    />
  );
};

function ErdZoomPanel() {
  return (
    <Panel position="top-right" className="!m-3 !p-0">
      <ErdZoomControls />
    </Panel>
  );
}

interface ErdDiagramProps {
  nodes: Node[];
  edges: Edge[];
  visibleNodeCount?: number;
  visibleEdgeCount?: number;
  layoutKey?: string;
  isDrawing?: boolean;
}

export const ErdDiagram: React.FC<ErdDiagramProps> = ({
  nodes,
  edges,
  visibleNodeCount,
  visibleEdgeCount,
  layoutKey = '',
  isDrawing = false,
}) => {
  const visibleNodes = useMemo(() => {
    const count = visibleNodeCount ?? nodes.length;
    return nodes.slice(0, count).map((node, i) => ({
      ...node,
      data: { ...node.data, isRevealing: i === count - 1 },
    }));
  }, [nodes, visibleNodeCount]);

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const visibleEdges = useMemo(() => {
    const count = visibleEdgeCount ?? edges.length;
    return edges
      .slice(0, count)
      .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => ({
        ...e,
        style: { stroke: 'rgba(120, 180, 255, 0.25)', strokeWidth: 1.5 },
        animated: true,
      }));
  }, [edges, visibleEdgeCount, visibleNodeIds]);

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

  return (
    <div className="diagram-canvas relative">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: DEFAULT_MAX_ZOOM }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
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
        <ErdZoomPanel />
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
