import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible?: boolean;
  message?: string;
  progress?: number;
  estimatedRemainingSec?: number | null;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible = true,
  message = 'Loading...',
  progress = 0,
  estimatedRemainingSec,
}) => {
  if (!isVisible) return null;

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="loading-overlay">
      <div className="glass-card p-8 flex flex-col items-center gap-6 min-w-[320px]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          <Loader2 className="w-8 h-8 text-white/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="text-center space-y-2 w-full">
          <p className="text-white/80 font-medium">{message}</p>
          <p className="text-white/30 text-sm">
            {estimatedRemainingSec != null && estimatedRemainingSec > 0
              ? `~${Math.ceil(estimatedRemainingSec)}s remaining`
              : 'AI is building your module...'}
          </p>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-white/40">
            <span>Progress</span>
            <span>{clampedProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/30 to-white/60 transition-all duration-500 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
