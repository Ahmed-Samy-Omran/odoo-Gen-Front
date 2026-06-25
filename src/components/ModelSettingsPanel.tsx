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
  onModelsChange
}) => {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());

  // Ensure models is always an array
  const safeModels = Array.isArray(models) ? models : [];

  const fieldTypes = [
    'Char', 'Text', 'Integer', 'Float', 'Boolean',
    'Date', 'Datetime', 'Selection', 'Many2one',
    'One2many', 'Many2many', 'Binary', 'Html'
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
    onModelsChange(
      safeModels.map(m => m?.name === modelName ? { ...m, ...updates } : m)
    );
  };

  const toggleModel = (modelName: string) => {
    if (!modelName) return;
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  };

  const addField = (modelName: string) => {
    if (!modelName) return;
    const newField: ModelField = { name: 'new_field', type: 'Char', required: false };
    onModelsChange(
      safeModels.map(m =>
        m?.name === modelName
          ? { ...m, fields: [...(Array.isArray(m.fields) ? m.fields : []), newField] }
          : m
      )
    );
  };

  const removeField = (modelName: string, fieldIndex: number) => {
    if (!modelName) return;
    onModelsChange(
      safeModels.map(m =>
        m?.name === modelName
          ? { ...m, fields: (Array.isArray(m.fields) ? m.fields : []).filter((_, i) => i !== fieldIndex) }
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
              fields: (Array.isArray(m.fields) ? m.fields : []).map((f, i) =>
                i === fieldIndex ? { ...f, ...updates } : f
              ),
            }
          : m
      )
    );
  };

  return (
    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Data Models</h3>
          <p className="text-sm text-dark-400">Define your Odoo models and fields</p>
        </div>
        <button
          onClick={addModel}
          className="flex items-center gap-2 px-3 py-2 bg-primary-500/20 text-primary-300 rounded-lg border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      <div className="space-y-3">
        {safeModels.map(model => {
          // Safety check for each model
          if (!model?.name) return null;

          const fields = Array.isArray(model.fields) ? model.fields : [];

          return (
            <div key={model.name} className="glass rounded-xl overflow-hidden border border-dark-700/50">
              <button
                onClick={() => toggleModel(model.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedModels.has(model.name) ? (
                    <ChevronDown className="w-4 h-4 text-dark-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-dark-400" />
                  )}
                  <Box className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">{model.name}</span>
                  <span className="text-xs text-dark-400">({fields.length} fields)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeModel(model.name);
                  }}
                  className="p-1.5 text-dark-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </button>

              {expandedModels.has(model.name) && (
                <div className="border-t border-dark-700/50 p-4 space-y-3 bg-dark-800/20">
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => updateModel(model.name, { name: e.target.value })}
                      className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                      placeholder="my_model"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-dark-400">Fields</label>
                      <button
                        onClick={() => addField(model.name)}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        + Add Field
                      </button>
                    </div>

                    {fields.map((field, index) => {
                      // Safety check for each field
                      if (!field) return null;

                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-dark-700/30 rounded-lg border border-dark-700/30">
                          <Database className="w-3.5 h-3.5 text-dark-500" />
                          <input
                            type="text"
                            value={field.name ?? ''}
                            onChange={(e) => updateField(model.name, index, { name: e.target.value })}
                            className="flex-1 bg-dark-700/50 border border-dark-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary-500"
                            placeholder="field_name"
                          />
                          <select
                            value={field.type ?? 'Char'}
                            onChange={(e) => updateField(model.name, index, { type: e.target.value })}
                            className="bg-dark-700/50 border border-dark-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary-500"
                          >
                            {fieldTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-dark-400">
                            <input
                              type="checkbox"
                              checked={field.required ?? false}
                              onChange={(e) => updateField(model.name, index, { required: e.target.checked })}
                              className="rounded border-dark-600 bg-dark-700"
                            />
                            Req
                          </label>
                          <button
                            onClick={() => removeField(model.name, index)}
                            className="p-1 text-dark-400 hover:text-red-400 transition-colors"
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
          <div className="text-center py-12 text-dark-400">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No models defined yet</p>
            <p className="text-sm mt-1">Click "Add Model" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
