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
      <div className="loadover-card">
        <div className="loadover-spinner">
          <span className="loadover-spinner__ring" />
          <Loader2 className="loadover-spinner__glyph" />
        </div>

        <div className="loadover-body">
          <p className="loadover-title">{message}</p>
          <p className="loadover-sub">
            {estimatedRemainingSec != null && estimatedRemainingSec > 0
              ? `~${Math.ceil(estimatedRemainingSec)}s remaining`
              : 'AI is building your module...'}
          </p>
        </div>

        <div className="loadover-track-wrap">
          <div className="loadover-labels">
            <span>Progress</span>
            <span>{clampedProgress}%</span>
          </div>
          <div className="loadover-track">
            <div className="loadover-fill" style={{ width: `${clampedProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
