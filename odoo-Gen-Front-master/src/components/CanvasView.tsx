import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Table,
  Key,
  Link,
  Hash,
  Code,
  List,
  Eye,
  Printer,
  Shield,
  Calendar,
  LayoutGrid,
  Settings,
} from 'lucide-react';
import { FieldDefinition, ViewConfig, QWebReport, AccessRule } from '../services/api';

interface FieldData {
  name: string;
  type: string;
  required: boolean;
  indexed: boolean;
  relation?: string;
  is_compute?: boolean;
  selection_options?: { value: string; label: string }[];
}

interface TableNodeData {
  label: string;
  modelName: string;
  moduleName?: string;
  fields: FieldData[];
  views?: ViewConfig[];
  reports?: QWebReport[];
  accessRules?: AccessRule[];
  onFieldClick?: (field: FieldData, tableId: string) => void;
  onHeaderClick?: (nodeId: string, data: TableNodeData) => void;
}

const getModuleBadgeClass = (moduleName?: string): string => {
  if (!moduleName) return '';
  if (moduleName.includes('core') || moduleName.includes('_core')) return 'module-badge-core';
  if (moduleName.includes('shop') || moduleName.includes('_shop')) return 'module-badge-shop';
  return 'module-badge-api';
};

const getModuleBorderColor = (moduleName?: string): string => {
  if (!moduleName) return 'border-glass-border';
  if (moduleName.includes('core') || moduleName.includes('_core')) return 'border-white/25';
  if (moduleName.includes('shop') || moduleName.includes('_shop')) return 'border-white/18';
  return 'border-white/12';
};

const TableNode: React.FC<NodeProps<Node<TableNodeData>>> = ({ data, id, selected }) => {
  const { modelName, moduleName, fields, views, reports, accessRules, onFieldClick, onHeaderClick } = data;
  const moduleBorderClass = getModuleBorderColor(moduleName);
  const moduleBadgeClass = getModuleBadgeClass(moduleName);

  const hasViews = views?.some(v => v.enabled) || false;
  const hasReports = reports && reports.length > 0;
  const hasSecurity = accessRules && accessRules.length > 0;
  const enabledViews = views?.filter(v => v.enabled) || [];

  const getFieldIcon = (type: string, relation?: string, isCompute?: boolean) => {
    if (isCompute) return <Code className="w-3 h-3 text-blue-400" />;
    if (type === 'Selection' || type === 'selection') return <List className="w-3 h-3 text-purple-400" />;
    if (relation) return <Link className="w-3 h-3 text-white/70" />;
    if (type === 'id' || type.includes('id')) return <Key className="w-3 h-3 text-white/50" />;
    return <Hash className="w-3 h-3 text-white/30" />;
  };

  const getViewIcon = (type: string) => {
    switch (type) {
      case 'kanban': return <LayoutGrid className="w-3 h-3" />;
      case 'calendar': return <Calendar className="w-3 h-3" />;
      case 'tree': return <List className="w-3 h-3" />;
      case 'form': return <Table className="w-3 h-3" />;
      case 'search': return <Hash className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  return (
    <div
      className={`glass-card min-w-[260px] overflow-hidden transition-all duration-300 ${moduleBorderClass} ${
        selected ? 'border-white/30 shadow-glow-md' : ''
      }`}
    >
      {/* Header with settings button */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-white/5 to-transparent border-b border-glass-border group/header cursor-pointer hover:bg-white/[0.03]"
        onClick={() => onHeaderClick?.(id, data)}
      >
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-white/70" />
          <span className="font-mono text-sm font-medium text-white/90">{modelName}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* View badges */}
          {enabledViews.length > 0 && (
            <div className="flex items-center gap-1">
              {enabledViews.slice(0, 4).map((v) => (
                <div
                  key={v.type}
                  className="w-5 h-5 rounded flex items-center justify-center bg-white/5 text-white/40"
                  title={`${v.type} view`}
                >
                  {getViewIcon(v.type)}
                </div>
              ))}
            </div>
          )}
          {/* Report indicator */}
          {hasReports && (
            <Printer className="w-4 h-4 text-amber-400/60" title="Has reports" />
          )}
          {/* Security indicator */}
          {hasSecurity && (
            <Shield className="w-4 h-4 text-green-400/60" title="Has access rules" />
          )}
          {/* Settings button */}
          <Settings className="w-4 h-4 text-white/20 group-hover/header:text-white/50 transition-colors" />
        </div>
      </div>

      <div className="py-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors relative group"
            onClick={() => onFieldClick?.(field, id)}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${field.name}-target`}
              className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-2 !h-2 !border-2 !border-white/20 !bg-obsidian hover:!border-white/50 hover:!bg-white/20 transition-all"
            />

            <div className="flex items-center gap-2 min-w-[100px]">
              {getFieldIcon(field.type, field.relation, field.is_compute)}
              <span className="font-mono text-xs text-white/60 group-hover:text-white/80">{field.name}</span>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-white/25 font-mono">{field.type}</span>
              {field.is_compute && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">compute</span>
              )}
              {field.selection_options && field.selection_options.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
                  {field.selection_options.length}
                </span>
              )}
            </div>

            {field.required && (
              <span className="text-[10px] text-white/50 font-medium">REQ</span>
            )}

            <Handle
              type="source"
              position={Position.Right}
              id={`${field.name}-source`}
              className="!absolute !right-0 !top-1/2 !-translate-y-1/2 !w-2 !h-2 !border-2 !border-white/20 !bg-obsidian hover:!border-white/50 hover:!bg-white/20 transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

interface CanvasViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  onFieldSelect: (field: any, nodeId: string) => void;
  onModelHeaderClick?: (nodeId: string, data: TableNodeData) => void;
  selectedNode?: string;
}

const CanvasView: React.FC<CanvasViewProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onFieldSelect,
  onModelHeaderClick,
  selectedNode,
}) => {
  const handleFieldClick = useCallback(
    (field: any, tableId: string) => {
      onFieldSelect(field, tableId);
    },
    [onFieldSelect]
  );

  const handleHeaderClick = useCallback(
    (nodeId: string, data: TableNodeData) => {
      onModelHeaderClick?.(nodeId, data);
    },
    [onModelHeaderClick]
  );

  const nodesWithClick = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onFieldClick: handleFieldClick,
          onHeaderClick: handleHeaderClick,
        },
      })),
    [nodes, handleFieldClick, handleHeaderClick]
  );

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodesWithClick}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 2 },
          animated: true,
        }}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />
        <Controls
          className="!bg-glass !border-glass-border !rounded-lg !shadow-glass !text-white/50"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-obsidian-100 !border-glass-border !rounded-lg"
          nodeColor="rgba(255, 255, 255, 0.15)"
          maskColor="rgba(10, 10, 10, 0.8)"
        />
      </ReactFlow>
    </div>
  );
};

export default CanvasView;
