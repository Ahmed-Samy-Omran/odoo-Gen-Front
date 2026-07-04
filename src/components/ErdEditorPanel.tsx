import React from 'react';
import { ArrowLeftRight, Plus, Trash2, Undo2, Redo2, Save } from 'lucide-react';

interface ErdEditorPanelProps {
  selectedNodeId: string | null;
  selectedEdge: { id: string; source: string; target: string } | null;
  onAddField: () => void;
  onRemoveField: () => void;
  onAddModel: () => void;
  onDeleteModel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCreateRelation: () => void;
  onDeleteRelation: () => void;
  onSaveLocal: () => void;
}

export const ErdEditorPanel: React.FC<ErdEditorPanelProps> = ({
  selectedNodeId,
  selectedEdge,
  onAddField,
  onRemoveField,
  onAddModel,
  onDeleteModel,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCreateRelation,
  onDeleteRelation,
  onSaveLocal,
}) => {
  return (
    <div className="absolute top-3 left-3 z-10 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-2xl shadow-cyan-950/20">
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onAddModel}
          className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-200 transition hover:bg-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteModel}
          disabled={!selectedNodeId}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onAddField}
          disabled={!selectedNodeId}
          className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemoveField}
          disabled={!selectedNodeId}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCreateRelation}
          disabled={!selectedNodeId}
          className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-2 text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteRelation}
          disabled={!selectedEdge}
          className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSaveLocal}
          className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2 text-amber-200 transition hover:bg-amber-500/20"
        >
          <Save className="h-4 w-4" />
        </button>
      </div>
      {selectedEdge && (
        <div className="border-t border-white/10 px-3 py-2 text-[11px] text-white/60">
          Relation selected — choose a relation type from the prompt.
        </div>
      )}
    </div>
  );
};
