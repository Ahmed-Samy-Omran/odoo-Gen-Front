import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Database, Box } from 'lucide-react';

interface ModelField {
  name: string;
  type: string;
  required: boolean;
}

interface Model {
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
    'One2many', 'Many2many', 'Binary', 'Html',
  ];

  const addModel = () => {
    const newModel: Model = {
      name: `model_${safeModels.length + 1}`,
      fields: [{ name: 'name', type: 'Char', required: true }],
    };
    onModelsChange([...safeModels, newModel]);
    setExpandedModels(prev => new Set([...Array.from(prev), newModel.name]));
  };

  const removeModel = (modelName: string) => {
    if (!modelName) return;
    onModelsChange(safeModels.filter(m => m?.name !== modelName));
    setExpandedModels(prev => {
      const next = new Set(prev);
      next.delete(modelName);
      return next;
    });
  };

  const updateModel = (modelName: string, updates: Partial<Model>) => {
    if (!modelName) return;
    onModelsChange(safeModels.map(m => m?.name === modelName ? { ...m, ...updates } : m));
  };

  const toggleModel = (modelName: string) => {
    if (!modelName) return;
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelName)) next.delete(modelName);
      else next.add(modelName);
      return next;
    });
  };

  const addField = (modelName: string) => {
    if (!modelName) return;
    const newField: ModelField = { name: 'new_field', type: 'Char', required: false };
    onModelsChange(
      safeModels.map(m =>
        m?.name === modelName
          ? { ...m, fields: [...(Array.isArray(m?.fields) ? m.fields : []), newField] }
          : m
      )
    );
  };

  const removeField = (modelName: string, fieldIndex: number) => {
    if (!modelName) return;
    onModelsChange(
      safeModels.map(m =>
        m?.name === modelName
          ? { ...m, fields: (Array.isArray(m?.fields) ? m.fields : []).filter((_, i) => i !== fieldIndex) }
          : m
      )
    );
  };

  const updateField = (modelName: string, fieldIndex: number, updates: Partial<ModelField>) => {
    if (!modelName) return;
    onModelsChange(
      safeModels.map(m =>
        m?.name === modelName
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
        <button onClick={addModel} className="cyber-button-primary text-sm">
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      <div className="space-y-3">
        {safeModels.map(model => {
          if (!model?.name) return null;
          const fields = Array.isArray(model?.fields) ? model.fields : [];

          return (
            <div key={model.name} className="glass-card overflow-hidden">
              <button
                onClick={() => toggleModel(model.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedModels.has(model.name) ? (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  )}
                  <Box className="w-4 h-4 text-white/60" />
                  <span className="text-white/90 font-medium">{model.name}</span>
                  <span className="text-xs text-white/30">({fields.length} fields)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeModel(model.name);
                  }}
                  className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </button>

              {expandedModels.has(model.name) && (
                <div className="border-t border-glass-border p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => updateModel(model.name, { name: e.target.value })}
                      className="w-full cyber-input text-sm"
                      placeholder="my_model"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-white/40">Fields</label>
                      <button
                        onClick={() => addField(model.name)}
                        className="text-xs text-white/50 hover:text-white/80 transition-colors"
                      >
                        + Add Field
                      </button>
                    </div>

                    {fields.map((field, index) => {
                      if (!field) return null;

                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                          <Database className="w-3.5 h-3.5 text-white/25" />
                          <input
                            type="text"
                            value={field.name ?? ''}
                            onChange={(e) => updateField(model.name, index, { name: e.target.value })}
                            className="flex-1 cyber-input text-sm py-1"
                            placeholder="field_name"
                          />
                          <select
                            value={field.type ?? 'Char'}
                            onChange={(e) => updateField(model.name, index, { type: e.target.value })}
                            className="cyber-input text-sm py-1"
                          >
                            {fieldTypes.map(type => (
                              <option key={type} value={type} className="bg-black">{type}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-white/40">
                            <input
                              type="checkbox"
                              checked={field.required ?? false}
                              onChange={(e) => updateField(model.name, index, { required: e.target.checked })}
                              className="rounded border-white/20 bg-black"
                            />
                            Req
                          </label>
                          <button
                            onClick={() => removeField(model.name, index)}
                            className="p-1 text-white/30 hover:text-white/70 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
          <div className="text-center py-12 text-white/30">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No models defined yet</p>
            <p className="text-sm mt-1">Click &quot;Add Model&quot; to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
