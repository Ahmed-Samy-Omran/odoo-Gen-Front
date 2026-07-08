import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Database, Box } from 'lucide-react';

interface ModelField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

interface Model {
  id: string;
  name: string;
  fields: ModelField[];
}

interface ModelSettingsPanelProps {
  models: Model[];
  onModelsChange: (models: Model[]) => void;
}

export const ModelSettingsPanel: React.FC<ModelSettingsPanelProps> = ({
  models = [],
  onModelsChange,
}) => {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const safeModels = Array.isArray(models) ? models : [];

  const fieldTypes = [
    'Char', 'Text', 'Integer', 'Float', 'Boolean',
    'Date', 'Datetime', 'Selection', 'Many2one',
    'One2one', 'One2many', 'Many2many', 'Binary', 'Html',
  ];

  const addModel = () => {
    const modelId = globalThis.crypto?.randomUUID?.() || `model_${Date.now()}_${safeModels.length + 1}`;
    const newModel: Model = {
      id: modelId,
      name: `model_${safeModels.length + 1}`,
      fields: [{ id: `${modelId}_field_1`, name: 'name', type: 'Char', required: true }],
    };
    onModelsChange([...safeModels, newModel]);
    setExpandedModels(prev => new Set([...Array.from(prev), newModel.id]));
  };

  const removeModel = (modelId: string) => {
    if (!modelId) return;
    onModelsChange(safeModels.filter(m => m?.id !== modelId));
    setExpandedModels(prev => {
      const next = new Set(prev);
      next.delete(modelId);
      return next;
    });
  };

  const updateModel = (modelId: string, updates: Partial<Model>) => {
    if (!modelId) return;
    onModelsChange(safeModels.map(m => m?.id === modelId ? { ...m, ...updates } : m));
  };

  const toggleModel = (modelId: string) => {
    if (!modelId) return;
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  };

  const addField = (modelId: string) => {
    if (!modelId) return;
    const newFieldId = globalThis.crypto?.randomUUID?.() || `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newField: ModelField = { id: newFieldId, name: 'new_field', type: 'Char', required: false };
    onModelsChange(
      safeModels.map(m =>
        m?.id === modelId
          ? { ...m, fields: [...(Array.isArray(m?.fields) ? m.fields : []), newField] }
          : m
      )
    );
  };

  const removeField = (modelId: string, fieldIndex: number) => {
    if (!modelId) return;
    onModelsChange(
      safeModels.map(m =>
        m?.id === modelId
          ? { ...m, fields: (Array.isArray(m?.fields) ? m.fields : []).filter((_, i) => i !== fieldIndex) }
          : m
      )
    );
  };

  const updateField = (modelId: string, fieldIndex: number, updates: Partial<ModelField>) => {
    if (!modelId) return;
    onModelsChange(
      safeModels.map(m =>
        m?.id === modelId
          ? {
              ...m,
              fields: (Array.isArray(m?.fields) ? m.fields : []).map((f, i) =>
                i === fieldIndex ? { ...f, ...updates } : f
              ),
            }
          : m
      )
    );
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white/90">Data Models</h3>
          <p className="text-sm text-white/30">Define your Odoo models and fields</p>
        </div>
        <button
          type="button"
          onClick={addModel}
          className="cyber-button-primary text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.35)]"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      <div className="space-y-3">
        {safeModels.map(model => {
          if (!model?.id) return null;
          const fields = Array.isArray(model?.fields) ? model.fields : [];

          return (
            <div key={model.id} className="glass-card overflow-hidden">
              <div className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleModel(model.id)}
                  className="flex items-center gap-3 text-left min-w-0"
                >
                  {expandedModels.has(model.id) ? (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  )}
                  <Box className="w-4 h-4 text-white/60" />
                  <span className="text-white/90 font-medium truncate">{model.name}</span>
                  <span className="text-xs text-white/30">({fields.length} fields)</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeModel(model.id);
                  }}
                  className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expandedModels.has(model.id) && (
                <div className="border-t border-glass-border p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => updateModel(model.id, { name: e.target.value })}
                      className="w-full cyber-input text-sm"
                      placeholder="my_model"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/40">Fields</label>
                      <button
                        type="button"
                        onClick={() => addField(model.id)}
                        className="text-xs text-white/50 hover:text-white/80 transition-colors"
                      >
                        + Add Field
                      </button>
                    </div>

                    {fields.map((field, index) => {
                      if (!field) return null;

                      return (
                        <div key={index} className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 sm:flex-row sm:items-center">
                          <Database className="w-3.5 h-3.5 text-white/25" />
                          <input
                            type="text"
                            value={field.name ?? ''}
                            onChange={(e) => updateField(model.id, index, { name: e.target.value })}
                            className="w-full min-w-0 flex-1 cyber-input text-sm py-1"
                            placeholder="field_name"
                          />
                          <div className="flex items-center gap-2 sm:ml-auto">
                            <select
                              value={field.type ?? 'Char'}
                              onChange={(e) => updateField(model.id, index, { type: e.target.value })}
                              className="cyber-input min-w-[138px] flex-none px-3 py-1.5 text-xs font-medium text-white/90"
                            >
                              {fieldTypes.map(type => (
                                <option key={type} value={type} className="bg-black">{type}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-1.5 text-xs text-white/40">
                              <input
                                type="checkbox"
                                checked={field.required ?? false}
                                onChange={(e) => updateField(model.id, index, { required: e.target.checked })}
                                className="rounded border-white/20 bg-black"
                              />
                              Req
                            </label>
                            <button
                              type="button"
                              onClick={() => removeField(model.id, index)}
                              className="p-1 text-white/30 transition-colors hover:text-white/70"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {safeModels.length === 0 && (
          <div className="text-center py-12 text-white/30 space-y-4">
            <Database className="w-12 h-12 mx-auto opacity-50" />
            <div>
              <p>No models defined yet</p>
              <p className="text-sm mt-1">Click the Add Model button at the top of this panel</p>
            </div>
            <button
              type="button"
              onClick={addModel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first model
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
