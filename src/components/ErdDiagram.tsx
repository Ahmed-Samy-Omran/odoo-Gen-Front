import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  useOnViewportChange,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeftRight, Undo2, Redo2, Save, X } from 'lucide-react';
import type { SchemaPreview } from '../utils/diagramBuilder';
import { DiagramZoomToolbar } from './DiagramZoomToolbar';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import AddFieldModal from './AddFieldModal';
import EditTextModal from './EditTextModal';

const DEFAULT_MAX_ZOOM = 0.72;
const FIT_PADDING = 0.4;
const nodeTypes = { tableNode: CustomNode };
const edgeTypes = { customEdge: CustomEdge };

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
  const [history, setHistory] = useState<SchemaPreview[]>([]);
  const [future, setFuture] = useState<SchemaPreview[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<{ nodeId: string; fieldName: string } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [relationDraft, setRelationDraft] = useState<{ sourceNodeId: string; sourceFieldName?: string } | null>(null);
  const [viewportTick, setViewportTick] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fieldSelectAtRef = useRef(0);
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

  useOnViewportChange({
    onChange: () => setViewportTick((value) => value + 1),
  });

  const pushSnapshot = useCallback((nextSchema: SchemaPreview) => {
    if (!schema) return;
    // preserve current viewport to avoid automatic fit/zoom when schema updates
    const currentViewport = reactFlow.getViewport?.();

    setHistory((current) => [...current, schema]);
    setFuture([]);
    onSchemaChange?.(nextSchema);

    // restore viewport shortly after schema change to prevent sudden zooms
    if (currentViewport && typeof reactFlow.setViewport === 'function') {
      // delay slightly to let ReactFlow update internal state
      setTimeout(() => {
        try {
          reactFlow.setViewport?.(currentViewport);
        } catch (err) {
          // ignore restore errors
        }
      }, 20);
    }
  }, [schema, onSchemaChange]);

  const handleChangeRelationType = useCallback((edge: Edge, nextType?: string) => {
    if (!schema) return;
    const sourceNodeId = edge.source;
    const sourceFieldName = edge.sourceHandle?.replace(/-source$/, '');
    if (!sourceFieldName) return;

    const cycle = ['many2one', 'one2one', 'one2many', 'many2many'];
    const currentType = ((edge.data as Record<string, unknown> | undefined)?.relationType as string | undefined) || 'many2one';
    const resolvedType = nextType || cycle[(cycle.indexOf(currentType) + 1) % cycle.length];

    const nextSchema: SchemaPreview = {
      ...schema,
      models: schema.models.map((item) => {
        if (item.name !== sourceNodeId) return item;
        return {
          ...item,
          fields: item.fields.map((field) =>
            field.name === sourceFieldName
              ? { ...field, type: resolvedType }
              : field,
          ),
        };
      }),
    };

    pushSnapshot(nextSchema);
  }, [pushSnapshot, schema]);

  const visibleNodes = useMemo(() => {
    const count = visibleNodeCount ?? nodes.length;
    return nodes.slice(0, count).map((node, i) => ({
      ...node,
      draggable: interactionMode === 'select',
      selected: selectedNodeId === node.id,
      data: {
        ...node.data,
        isRevealing: i === count - 1,
        selectedFieldName: selectedField?.nodeId === node.id ? selectedField.fieldName : null,
        onFieldSelect: (nodeId: string, fieldName: string | null) => {
          // Mark field click so ReactFlow onNodeClick doesn't wipe the selection
          fieldSelectAtRef.current = Date.now();
          setSelectedNodeId(nodeId);
          setSelectedField(fieldName ? { nodeId, fieldName } : null);
          setSelectedEdge(null);
        },
        onEditModel: (nodeId: string) => {
          const model = schema?.models.find((m) => m.name === nodeId);
          setEditModelModal({ open: true, nodeId, defaultName: model?.name });
        },
        onEditField: (nodeId: string, fieldName: string) => {
          fieldSelectAtRef.current = Date.now();
          setSelectedNodeId(nodeId);
          setSelectedField({ nodeId, fieldName });
          setSelectedEdge(null);
          const model = schema?.models.find((m) => m.name === nodeId);
          const idx = model?.fields.findIndex((f) => f.name === fieldName) ?? -1;
          if (idx >= 0) {
            const f = model!.fields[idx];
            setAddFieldModal({
              open: true,
              nodeId,
              index: idx,
              defaultName: f.name,
              defaultType: f.type,
              required: f.required,
              defaultValue: f.default ?? null,
              unique: f.unique ?? false,
            });
          }
        },
      },
    }));
  }, [nodes, visibleNodeCount, interactionMode, selectedField, selectedNodeId, schema]);

  useEffect(() => {
    setFlowNodes(visibleNodes);
  }, [visibleNodes]);

  const visibleEdges = useMemo(() => {
    const count = visibleEdgeCount ?? edges.length;
    return edges
      .slice(0, count)
      .filter((edge) => flowNodes.some((node) => node.id === edge.source) && flowNodes.some((node) => node.id === edge.target))
      .map((edge) => ({
        ...edge,
        selected: selectedEdge?.id === edge.id,
        style: {
          stroke: selectedEdge?.id === edge.id ? 'rgba(34, 211, 238, 0.98)' : 'rgba(120, 180, 255, 0.25)',
          strokeWidth: selectedEdge?.id === edge.id ? 3 : 1.8,
        },
        animated: true,
        data: {
          ...(edge.data || {}),
          relationType: (edge.data as Record<string, unknown> | undefined)?.relationType || edge.label,
          sourceFieldName: (edge.data as Record<string, unknown> | undefined)?.sourceFieldName || edge.sourceHandle?.replace(/-source$/, ''),
          onChangeRelationType: (nextType: string) => handleChangeRelationType(edge, nextType),
        },
      }));
  }, [edges, visibleEdgeCount, flowNodes, selectedEdge, handleChangeRelationType]);

  const selectedNode = useMemo(
    () => flowNodes.find((node) => node.id === (selectedField?.nodeId || selectedNodeId)) ?? null,
    [flowNodes, selectedField?.nodeId, selectedNodeId],
  );

  const floatingMenu = useMemo(() => {
    if (!wrapperRef.current) return null;

    const container = wrapperRef.current.getBoundingClientRect();
    const menuWidth = selectedEdge ? 180 : 220;
    const menuHeight = selectedEdge ? 70 : 82;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const toScreen = (flowPosition: { x: number; y: number }) => reactFlow.flowToScreenPosition(flowPosition);

    let baseFlowPosition: { x: number; y: number } | null = null;

    if (selectedEdge) {
      const sourceNode = flowNodes.find((node) => node.id === selectedEdge.source);
      const targetNode = flowNodes.find((node) => node.id === selectedEdge.target);
      if (!sourceNode || !targetNode) return null;

      baseFlowPosition = {
        x: ((sourceNode.position?.x ?? 0) + (targetNode.position?.x ?? 0)) / 2 + 120,
        y: ((sourceNode.position?.y ?? 0) + (targetNode.position?.y ?? 0)) / 2 - 8,
      };
    } else if (selectedNode) {
      // If a specific field is selected, position the menu vertically next to that field row.
      if (selectedField && schema) {
        const model = schema.models.find((m) => m.name === selectedField.nodeId);
        const fieldIdx = model ? model.fields.findIndex((f) => f.name === selectedField.fieldName) : -1;
        const headerHeight = 32; // approximate header height in px
        const rowHeight = 30; // approximate per-field row height
        const yOffset = headerHeight + Math.max(0, fieldIdx) * rowHeight + Math.floor(rowHeight / 2);
        const nodeWidth = 220;
        baseFlowPosition = {
          x: (selectedNode.position?.x ?? 0) + nodeWidth + 8,
          y: (selectedNode.position?.y ?? 0) + yOffset,
        };
      } else {
        baseFlowPosition = {
          x: (selectedNode.position?.x ?? 0) + (selectedField ? 230 : 180),
          y: (selectedNode.position?.y ?? 0) + 22,
        };
      }
    }

    if (!baseFlowPosition) return null;

    const screenPosition = toScreen(baseFlowPosition);
    return {
      left: clamp(screenPosition.x - container.left, 12, Math.max(12, container.width - menuWidth - 12)),
      top: clamp(screenPosition.y - container.top, 12, Math.max(12, container.height - menuHeight - 12)),
    };
  }, [flowNodes, reactFlow, selectedEdge, selectedField, selectedNode, viewportTick]);

  const handleBeginRelation = useCallback(() => {
    const sourceNodeId = selectedField?.nodeId || selectedNodeId;
    if (!sourceNodeId) return;
    setRelationDraft({ sourceNodeId, sourceFieldName: selectedField?.fieldName });
    setSelectedEdge(null);
  }, [selectedField?.fieldName, selectedField?.nodeId, selectedNodeId]);

  const handleCancelRelation = useCallback(() => {
    setRelationDraft(null);
  }, []);

  const handleCreateRelation = useCallback((sourceNodeId: string, targetNodeId: string, sourceFieldName?: string) => {
    if (!schema || sourceNodeId === targetNodeId) return;

    if (!schema.models.some((item) => item.name === targetNodeId)) return;

    const fieldName = sourceFieldName || `${targetNodeId.replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase()}_id`;

    const nextSchema: SchemaPreview = {
      ...schema,
      models: schema.models.map((item) => {
        if (item.name !== sourceNodeId) return item;
        const fields = Array.isArray(item.fields) ? [...item.fields] : [];
        const fieldIndex = fields.findIndex((field) => field.name === fieldName);
        const existingField = fieldIndex >= 0 ? fields[fieldIndex] : null;
        const nextField = {
          name: fieldName,
          type: existingField?.type || 'many2one',
          required: existingField?.required || false,
          relation: targetNodeId,
        };

        if (fieldIndex >= 0) {
          fields[fieldIndex] = nextField;
        } else {
          fields.push(nextField);
        }

        return { ...item, fields };
      }),
    };

    pushSnapshot(nextSchema);
    setRelationDraft(null);
    setSelectedNodeId(sourceNodeId);
    setSelectedField(sourceFieldName ? { nodeId: sourceNodeId, fieldName: sourceFieldName } : null);
    setSelectedEdge(null);
  }, [pushSnapshot, schema]);

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

  const [addFieldModal, setAddFieldModal] = useState<{ open: boolean; nodeId?: string; index?: number; defaultName?: string; defaultType?: string; required?: boolean; defaultValue?: string | null; unique?: boolean }>(() => ({ open: false }));
  const [editModelModal, setEditModelModal] = useState<{ open: boolean; nodeId?: string; defaultName?: string }>({ open: false });
  const [pendingRename, setPendingRename] = useState<{ nodeId: string; oldName: string; newName: string } | null>(null);

  const handleAddField = useCallback(() => {
    const nodeId = selectedField?.nodeId || selectedNodeId;
    if (!schema || !nodeId) return;
    setAddFieldModal({ open: true, nodeId });
  }, [schema, selectedField?.nodeId, selectedNodeId]);

  const performDelete = useCallback(() => {
    if (!schema) return;
    if (selectedField) {
      const nextSchema: SchemaPreview = {
        ...schema,
        models: schema.models.map((item) => item.name === selectedField.nodeId
          ? { ...item, fields: item.fields.filter((field) => field.name !== selectedField.fieldName) }
          : item),
      };
      pushSnapshot(nextSchema);
      setSelectedField(null);
      return;
    }

    if (selectedEdge) {
      const sourceHandleField = selectedEdge.sourceHandle?.replace(/-source$/, '') || null;
      const nextSchema: SchemaPreview = {
        ...schema,
        models: schema.models.map((item) => item.name === selectedEdge.source
          ? {
              ...item,
              fields: item.fields.filter((field) => {
                if (sourceHandleField) return !(field.name === sourceHandleField && field.relation === selectedEdge.target);
                return field.relation !== selectedEdge.target;
              }),
            }
          : item),
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
  }, [schema, selectedField, selectedEdge, selectedNodeId, pushSnapshot]);

  const handleDeleteSelection = useCallback(() => {
    if (!schema) return;
    if (selectedField || selectedEdge || selectedNodeId) {
      performDelete();
    }
  }, [performDelete, schema, selectedEdge, selectedField, selectedNodeId]);

  const handleSaveLocal = useCallback(() => {
    if (!schema) return;
    localStorage.setItem('odoo_erd_schema', JSON.stringify(schema));
    window.alert('ERD schema saved locally in this browser.');
  }, [schema]);

  const handleSaveModelEdit = useCallback((newName: string) => {
    const nodeId = editModelModal.nodeId;
    if (!schema || !nodeId) return;
    const model = schema.models.find((m) => m.name === nodeId);
    const oldName = model?.name || nodeId;
    // set pending rename and ask confirm
    setPendingRename({ nodeId, oldName, newName });
    setEditModelModal({ open: false });
  }, [editModelModal.nodeId, schema]);

  const applyPendingRename = useCallback((apply: boolean) => {
    if (!pendingRename) return;
    const { oldName, newName } = pendingRename;
    if (apply && schema) {
      const nextSchema: SchemaPreview = {
        ...schema,
        models: schema.models.map((m) => {
          if (m.name === oldName) return { ...m, name: newName };
          return { ...m, fields: m.fields.map((f) => ({ ...f, relation: f.relation === oldName ? newName : f.relation })) };
        }),
      };
      pushSnapshot(nextSchema);
    }
    setPendingRename(null);
  }, [pendingRename, schema, pushSnapshot]);


  // handle modal add
  const handleModalAdd = useCallback((name: string, type: string, required: boolean, defaultValue?: string | null, unique?: boolean) => {
    const nodeId = addFieldModal.nodeId;
    if (!schema || !nodeId) {
      setAddFieldModal({ open: false });
      return;
    }

    const isEdit = typeof addFieldModal.index === 'number';

    const nextSchema: SchemaPreview = {
      ...schema,
      models: schema.models.map((item) => {
        if (item.name !== nodeId) return item;
        const fields = Array.isArray(item.fields) ? [...item.fields] : [];
        if (isEdit && typeof addFieldModal.index === 'number') {
          const previous = fields[addFieldModal.index];
          fields[addFieldModal.index] = {
            ...previous,
            name,
            type,
            required: !!required,
            default: defaultValue ?? null,
            unique: !!unique,
          };
        } else {
          fields.push({ name, type, required: !!required, default: defaultValue ?? null, unique: !!unique });
        }
        return { ...item, fields };
      }),
    };

    pushSnapshot(nextSchema);
    setAddFieldModal({ open: false });
  }, [addFieldModal, pushSnapshot, schema]);

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

  const ActionButton: React.FC<{
    title: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
  }> = ({ title, onClick, disabled, className = '', children }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <div
        className="relative inline-flex"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={title}
          aria-label={title}
          className={`rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
        >
          {children}
        </button>

        <AnimatePresence>
          {hovered && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -2, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -2, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/95 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="diagram-canvas relative" ref={wrapperRef}>
      <div className="absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/45 px-2 py-2 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            <ActionButton title="تراجع" onClick={handleUndo} disabled={history.length === 0}>
              <Undo2 className="h-4 w-4" />
            </ActionButton>
            <ActionButton title="إعادة" onClick={handleRedo} disabled={future.length === 0}>
              <Redo2 className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              title="حفظ محلي"
              onClick={handleSaveLocal}
              className="border-amber-400/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
            >
              <Save className="h-4 w-4" />
            </ActionButton>
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

      {relationDraft && (
        <div className="absolute left-3 top-20 z-30 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          Click the target model to create the relation.
          <button
            type="button"
            onClick={handleCancelRelation}
            className="ml-3 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      <AnimatePresence>
        {floatingMenu && (
          <motion.div
            key={`${selectedEdge?.id ?? selectedField?.fieldName ?? selectedNodeId ?? 'menu'}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 38 }}
            className="absolute z-30 rounded-2xl border border-white/10 bg-black/60 px-2 py-2 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
            style={{ left: floatingMenu.left, top: floatingMenu.top }}
          >
            <div className="flex items-center gap-1.5">
              {!selectedEdge && !relationDraft && (
                <>
                  <ActionButton title="إضافة حقل" onClick={handleAddField} className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20">
                    <Plus className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton title="إضافة علاقة" onClick={handleBeginRelation} className="border-sky-400/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20">
                    <ArrowLeftRight className="h-4 w-4" />
                  </ActionButton>
                </>
              )}
              {relationDraft && !selectedEdge && (
                <ActionButton title="إلغاء وضع العلاقة" onClick={handleCancelRelation} className="border-sky-400/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20">
                  <X className="h-4 w-4" />
                </ActionButton>
              )}
              <ActionButton
                title={selectedField ? 'حذف الحقل' : selectedEdge ? 'حذف العلاقة' : 'حذف الجدول'}
                onClick={handleDeleteSelection}
                className="border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </ActionButton>
              <ActionButton
                title="إلغاء التحديد"
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedField(null);
                  setSelectedEdge(null);
                }}
                className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </ActionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactFlow
        nodes={flowNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
          if (relationDraft && relationDraft.sourceNodeId !== node.id) {
            handleCreateRelation(relationDraft.sourceNodeId, node.id, relationDraft.sourceFieldName);
            return;
          }
          if (relationDraft && relationDraft.sourceNodeId === node.id) {
            handleCancelRelation();
            return;
          }
          // Field clicks bubble to the node; keep field selection if it just happened
          if (Date.now() - fieldSelectAtRef.current < 250) {
            setSelectedNodeId(node.id);
            setSelectedEdge(null);
            return;
          }
          setSelectedNodeId(node.id);
          setSelectedField(null);
          setSelectedEdge(null);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedField(null);
          setSelectedEdge(null);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdge(edge);
          setSelectedNodeId(null);
          setSelectedField(null);
          setRelationDraft(null);
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
        onMoveEnd={() => setViewportTick((value) => value + 1)}
        defaultEdgeOptions={{
          type: 'customEdge',
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
        {pendingRename && (
          <div className="absolute left-6 top-6 z-40 rounded-md border border-amber-400/20 bg-amber-500/6 p-3 flex items-center gap-3">
            <div className="text-sm text-amber-100">تغيير اسم الموديل سيحدث تحديث للعلاقات المرتبطة به. تطبيق التغيير؟</div>
            <button onClick={() => applyPendingRename(false)} className="px-3 py-1 rounded bg-white/5 text-white/80">Cancel</button>
            <button onClick={() => applyPendingRename(true)} className="px-3 py-1 rounded bg-amber-500 text-amber-100">Yes, apply</button>
          </div>
        )}
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
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(120, 180, 255, 0.65)" />
          </marker>
        </defs>
      </ReactFlow>
      <AddFieldModal
        open={Boolean(addFieldModal.open)}
        mode={typeof addFieldModal.index === 'number' ? 'edit' : 'add'}
        defaultName={addFieldModal.defaultName ?? `field_${(schema?.models.find((m) => m.name === addFieldModal.nodeId)?.fields.length ?? 0) + 1}`}
        defaultType={addFieldModal.defaultType ?? 'Char'}
        defaultRequired={addFieldModal.required ?? false}
        defaultDefaultValue={addFieldModal.defaultValue ?? null}
        defaultUnique={addFieldModal.unique ?? false}
        onClose={() => setAddFieldModal({ open: false })}
        onAdd={handleModalAdd}
      />
      <EditTextModal
        open={editModelModal.open}
        title="Rename Model"
        label="Model name"
        defaultValue={editModelModal.defaultName}
        onClose={() => setEditModelModal({ open: false })}
        onSave={handleSaveModelEdit}
      />
      {/* Confirm modal removed: delete actions now execute immediately on click */}
    </div>
  );
};
