import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Table, Key, Link, Hash } from 'lucide-react';
import type { SchemaField } from '../utils/diagramBuilder';

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  modelName: string;
  moduleName?: string;
  fields: SchemaField[];
  isRevealing?: boolean;
  selectedFieldName?: string | null;
  onFieldSelect?: (nodeId: string, fieldName: string | null) => void;
  onEditModel?: (nodeId: string) => void;
  onEditField?: (nodeId: string, fieldName: string) => void;
}

const getFieldIcon = (type: string, relation?: string | null) => {
  if (relation) return <Link className="w-3 h-3 text-sky-400/60" />;
  if (type === 'id' || type.includes('id')) return <Key className="w-3 h-3 text-white/35" />;
  return <Hash className="w-3 h-3 text-white/20" />;
};

export const CustomNode: React.FC<any> = ({ id, data, selected }) => {
  const nodeData = data as CustomNodeData;
  const { modelName, fields, isRevealing, selectedFieldName, onFieldSelect } = nodeData;
  const [expanded, setExpanded] = useState(false);
  const visibleFields: SchemaField[] = expanded ? fields : fields.slice(0, 6);
  const hiddenCount = Math.max(0, fields.length - visibleFields.length);

  return (
    <div
      className={`diagram-erd-node ${selected ? 'diagram-erd-node-selected ring-1 ring-cyan-400/30 shadow-[0_0_28px_rgba(34,211,238,0.14)]' : ''} ${
        isRevealing ? 'animate-diagram-soft-in' : ''
      }`}
    >
      <div className="diagram-erd-node-header">
        <Table className="w-3.5 h-3.5 text-white/40" />
        <span className="font-mono text-[13px] font-medium text-white/80" onDoubleClick={() => data.onEditModel?.(id)}>{modelName}</span>
        <span className="ml-auto text-[10px] text-white/25 font-mono">{fields.length} fields</span>
      </div>

      <div className="diagram-erd-node-body">
        {visibleFields.map((field) => {
          const isSelectedField = selectedFieldName === field.name;

          return (
            <button
              key={field.name}
              type="button"
              title="اضغط لتعديل الاسم والنوع"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onFieldSelect?.(id, field.name);
                // Open edit on click so users don't miss the pencil menu
                data.onEditField?.(id, field.name);
              }}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                data.onEditField?.(id, field.name);
              }}
              className={`diagram-erd-field w-full text-left transition-colors ${
                isSelectedField ? 'bg-cyan-400/10 text-cyan-50' : ''
              }`}
            >
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
                <span className={`font-mono text-[11px] truncate ${isSelectedField ? 'text-cyan-100' : 'text-white/50'}`}>
                  {field.name}
                </span>
              </div>

              <span className={`text-[10px] font-mono shrink-0 ${isSelectedField ? 'text-cyan-100/70' : 'text-white/20'}`}>
                {field.type}
              </span>

              {field.required && (
                <span className="text-[9px] text-amber-400/50 font-medium shrink-0">*</span>
              )}

              <Handle
                type="source"
                position={Position.Right}
                id={`${field.name}-source`}
                className="diagram-handle diagram-handle-right"
              />
            </button>
          );
        })}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            className="w-full text-left px-3.5 py-2 text-[11px] font-medium text-cyan-300/85 hover:text-cyan-200 transition-colors"
          >
            {expanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
};
