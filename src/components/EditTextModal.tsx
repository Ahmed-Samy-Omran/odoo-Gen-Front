import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  label?: string;
  defaultValue?: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export const EditTextModal: React.FC<Props> = ({ open, title = 'Edit', label = '', defaultValue = '', onClose, onSave }) => {
  const [value, setValue] = useState(defaultValue ?? '');

  useEffect(() => {
    setValue(defaultValue ?? '');
  }, [defaultValue, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-70 w-full max-w-lg rounded-xl border border-white/10 bg-black/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white/90">{title}</h4>
          <button type="button" onClick={onClose} className="p-1 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {label && <label className="block text-xs text-white/40">{label}</label>}
          <input className="w-full cyber-input text-sm" value={value} onChange={(e) => setValue(e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white">Cancel</button>
            <button type="button" onClick={() => onSave(value.trim())} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-400/20 hover:bg-emerald-500/20">
              <Check className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTextModal;
