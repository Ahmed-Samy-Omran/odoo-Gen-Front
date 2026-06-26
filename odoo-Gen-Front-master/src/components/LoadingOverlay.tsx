import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = 'Analyzing requirements...' }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="glass-card p-8 flex flex-col items-center gap-6 min-w-[300px] animate-pulse">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          <Loader2 className="w-8 h-8 text-white/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-white/80 font-medium">{message}</p>
          <p className="text-white/30 text-sm">Parsing module structure...</p>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/30 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
