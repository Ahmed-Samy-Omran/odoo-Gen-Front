import React from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<Props> = ({ open, title = 'Confirm', message = '', confirmLabel = 'Yes', cancelLabel = 'Cancel', onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-70 w-full max-w-md rounded-xl border border-white/10 bg-black/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white/90">{title}</h4>
          <button type="button" onClick={() => { console.log('ConfirmModal cancel'); onCancel(); }} className="p-1 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-white/70">{message}</p>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { console.log('ConfirmModal cancel'); onCancel(); }} className="px-3 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white">{cancelLabel}</button>
            <button type="button" onClick={() => { console.log('ConfirmModal confirm'); onConfirm(); }} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-200 border border-rose-400/20 hover:bg-rose-500/20">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
