import React, { useState } from 'react';
import { X, Database, Code, List, HelpCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import { FieldDefinition, SelectionOption } from '../services/api';

interface InspectorPanelProps {
  isOpen: boolean;
  field: FieldDefinition | null;
  tableId: string | null;
  onClose: () => void;
  onUpdate: (tableId: string, updates: Partial<FieldDefinition>) => void;
}

const fieldTypes = [
  'Char',
  'Text',
  'Integer',
  'Float',
  'Boolean',
  'Date',
  'Datetime',
  'Binary',
  'Selection',
  'Many2one',
  'One2many',
  'Many2many',
];

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  field,
  tableId,
  onClose,
  onUpdate,
}) => {
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');

  if (!isOpen || !field || !tableId) return null;

  const isSelectionField = field.type === 'Selection';
  const selectionOptions = field.selection_options || [];

  const handleAddOption = () => {
    if (newOptionValue.trim() && newOptionLabel.trim()) {
      const newOption: SelectionOption = {
        value: newOptionValue.trim(),
        label: newOptionLabel.trim(),
      };
      onUpdate(tableId, {
        selection_options: [...selectionOptions, newOption],
      });
      setNewOptionValue('');
      setNewOptionLabel('');
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = selectionOptions.filter((_, i) => i !== index);
    onUpdate(tableId, { selection_options: updatedOptions });
  };

  const handleUpdateOption = (index: number, key: 'value' | 'label', value: string) => {
    const updatedOptions = selectionOptions.map((opt, i) =>
      i === index ? { ...opt, [key]: value } : opt
    );
    onUpdate(tableId, { selection_options: updatedOptions });
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 glass-card border-l border-glass-border slide-in-right z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-white/70" />
          <span className="text-sm font-medium text-white/90">Field Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Technical Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Technical Name</label>
          <div className="cyber-input bg-black font-mono text-white/70">{field.name}</div>
        </div>

        {/* Field Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Field Type</label>
          <select
            value={field.type}
            onChange={(e) => onUpdate(tableId, { type: e.target.value })}
            className="w-full cyber-input bg-black cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {fieldTypes.map((type) => (
              <option key={type} value={type} className="bg-obsidian text-white">
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Relation (for relational fields) */}
        {field.relation && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Related Model</label>
            <div className="cyber-input bg-black font-mono text-white/70">{field.relation}</div>
          </div>
        )}

        {/* Selection Options - Only shown for Selection type */}
        {isSelectionField && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-white/50" />
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Selection Options</label>
            </div>

            {/* Existing options */}
            <div className="space-y-2">
              {selectionOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                  <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 text-xs font-mono bg-black/50 border border-white/10 rounded text-white/70 focus:outline-none focus:border-white/30"
                  />
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1 px-2 py-1 text-xs bg-black/50 border border-white/10 rounded text-white/70 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="p-1 text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new option */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                placeholder="Value"
                className="flex-1 px-3 py-2 text-xs font-mono cyber-input"
              />
              <input
                type="text"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                placeholder="Label"
                className="flex-1 px-3 py-2 text-xs cyber-input"
              />
              <button
                onClick={handleAddOption}
                className="p-2 cyber-button-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-white/50" />
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Help Text</label>
          </div>
          <textarea
            value={field.help || ''}
            onChange={(e) => onUpdate(tableId, { help: e.target.value })}
            placeholder="Tooltip shown to users..."
            rows={2}
            className="w-full cyber-input resize-none"
          />
        </div>

        {/* Default Value */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Default Value</label>
          <input
            type="text"
            value={field.default_value || ''}
            onChange={(e) => onUpdate(tableId, { default_value: e.target.value })}
            placeholder="Enter default value..."
            className="w-full cyber-input"
          />
        </div>

        <div className="h-px bg-glass-border" />

        {/* Compute Field Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-white/50" />
                <p className="text-sm text-white/70">Compute Field</p>
              </div>
              <p className="text-xs text-white/25">Auto-calculated from other fields</p>
            </div>
            <button
              onClick={() => onUpdate(tableId, { is_compute: !field.is_compute })}
              className={`toggle-switch ${field.is_compute ? 'active' : ''}`}
            >
              <div className="toggle-switch-knob" />
            </button>
          </div>

          {field.is_compute && (
            <div className="space-y-4 pl-2 border-l-2 border-white/10">
              {/* Depends fields */}
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase tracking-wider">Depends On</label>
                <input
                  type="text"
                  value={field.depends_fields?.join(', ') || ''}
                  onChange={(e) => onUpdate(tableId, {
                    depends_fields: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                  })}
                  placeholder="field1, field2, field3..."
                  className="w-full cyber-input text-sm font-mono"
                />
              </div>

              {/* Compute code editor toggle */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-all flex items-center justify-between"
                >
                  <span className="text-sm">Python Code</span>
                  <Code className="w-4 h-4" />
                </button>

                {(showCodeEditor || field.compute_code) && (
                  <div className="relative">
                    <textarea
                      value={field.compute_code || ''}
                      onChange={(e) => onUpdate(tableId, { compute_code: e.target.value })}
                      placeholder={`@api.depends('field1', 'field2')
def _compute_${field.name}(self):
    for record in self:
        record.${field.name} = ...`}
                      rows={8}
                      className="w-full px-4 py-3 font-mono text-xs bg-black/80 border border-white/10 rounded-lg text-white/70 focus:outline-none focus:border-white/30 resize-y"
                      style={{ tabSize: 4 }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-medium">
                      @api.depends
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-glass-border" />

        {/* Standard Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-white/70">Required</p>
              <p className="text-xs text-white/25">Field cannot be null</p>
            </div>
            <button
              onClick={() => onUpdate(tableId, { required: !field.required })}
              className={`toggle-switch ${field.required ? 'active' : ''}`}
            >
              <div className="toggle-switch-knob" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-white/70">Indexed</p>
              <p className="text-xs text-white/25">Creates database index</p>
            </div>
            <button
              onClick={() => onUpdate(tableId, { indexed: !field.indexed })}
              className={`toggle-switch ${field.indexed ? 'active' : ''}`}
            >
              <div className="toggle-switch-knob" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-glass-border space-y-2">
        <button
          onClick={onClose}
          className="cyber-button-primary w-full py-3"
        >
          Apply Changes
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InspectorPanel;
