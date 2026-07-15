import React, { useEffect, useState } from 'react';
import { X, Plus, Pencil } from 'lucide-react';

interface Props {
  open: boolean;
  mode?: 'add' | 'edit';
  defaultName?: string;
  defaultType?: string;
  defaultRequired?: boolean;
  defaultDefaultValue?: string | null;
  defaultUnique?: boolean;
  onClose: () => void;
  onAdd: (name: string, type: string, required: boolean, defaultValue?: string | null, unique?: boolean) => void;
}

const FIELD_TYPES = [
  'Char', 'Text', 'Integer', 'Float', 'Boolean',
  'Date', 'Datetime', 'Selection', 'Many2one',
  'One2one', 'One2many', 'Many2many', 'Binary', 'Html',
];

export const AddFieldModal: React.FC<Props> = ({
  open,
  mode = 'add',
  defaultName = '',
  defaultType = 'Char',
  defaultRequired = false,
  defaultDefaultValue = null,
  defaultUnique = false,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState(defaultType);
  const [required, setRequired] = useState(defaultRequired);
  const [defaultValue, setDefaultValue] = useState<string | null>(defaultDefaultValue);
  const [unique, setUnique] = useState(defaultUnique);

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    setType(defaultType);
    setRequired(!!defaultRequired);
    setDefaultValue(defaultDefaultValue ?? null);
    setUnique(!!defaultUnique);
  }, [defaultName, defaultType, defaultRequired, defaultDefaultValue, defaultUnique, open]);

  if (!open) return null;

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur" onClick={onClose} />
      <div className="relative z-70 w-full max-w-md rounded-xl border border-white/10 bg-black/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white/90">{isEdit ? 'Edit Field' : 'Add Field'}</h4>
          <button type="button" onClick={onClose} className="p-1 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1">Field name</label>
            <input
              className="w-full cyber-input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="field_name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1">Field type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full cyber-input text-sm">
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t} className="bg-black">{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs text-white/40">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Required
            </label>
            <label className="flex items-center gap-2 text-xs text-white/40">
              <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
              Unique
            </label>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1">Default value (optional)</label>
            <input className="w-full cyber-input text-sm" value={defaultValue ?? ''} onChange={(e) => setDefaultValue(e.target.value || null)} placeholder="e.g. 0 or 'N/A'" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const trimmed = (name || '').trim();
                if (!trimmed) return alert('Please provide a field name');
                onAdd(trimmed, type || 'Char', required, defaultValue ?? null, unique);
              }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-400/20 hover:bg-emerald-500/20"
            >
              {isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEdit ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFieldModal;
