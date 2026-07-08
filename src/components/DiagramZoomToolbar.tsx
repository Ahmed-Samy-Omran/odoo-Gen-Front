import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize, Minimize2, MousePointer2, Move, Scan } from 'lucide-react';

interface DiagramZoomToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFullscreenToggle?: () => void;
  onToggleInteractionMode?: () => void;
  interactionMode?: 'pan' | 'select';
  isFullscreen?: boolean;
  zoomLevel?: number;
}

export const DiagramZoomToolbar: React.FC<DiagramZoomToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onFullscreenToggle,
  onToggleInteractionMode,
  interactionMode = 'pan',
  isFullscreen = false,
  zoomLevel,
}) => {
  const ToolbarButton: React.FC<{
    title: string;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
    className?: string;
    children: React.ReactNode;
  }> = ({ title, onClick, disabled, active = false, className = '', children }) => {
    const [hovered, setHovered] = React.useState(false);

    return (
      <div
        className="relative inline-flex"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={title}
          title={title}
          className={`rounded-lg border bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${
            active ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100' : 'border-white/10'
          } ${className}`}
        >
          {children}
        </button>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -2, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -2, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/95 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/45 px-2 py-2 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="flex items-center gap-1.5">
        <ToolbarButton title="Zoom out" onClick={onZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={interactionMode === 'pan' ? 'Select / move tables' : 'Pan canvas'}
          onClick={onToggleInteractionMode}
          active={interactionMode === 'select'}
        >
          {interactionMode === 'select' ? (
            <MousePointer2 className="w-4 h-4" />
          ) : (
            <Move className="w-4 h-4" />
          )}
        </ToolbarButton>
        {zoomLevel != null && (
          <span className="min-w-[46px] rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-[11px] font-medium text-white/70">
            {Math.round(zoomLevel * 100)}%
          </span>
        )}
        <ToolbarButton title="Zoom in" onClick={onZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </ToolbarButton>
        {onFullscreenToggle && (
          <ToolbarButton
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            onClick={onFullscreenToggle}
            active={isFullscreen}
            className="border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </ToolbarButton>
        )}
        <ToolbarButton title="Fit screen" onClick={onReset}>
          <Scan className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>
    </div>
  );
};

interface DiagramPanZoomProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
}

export const DiagramPanZoom: React.FC<DiagramPanZoomProps> = ({
  children,
  minZoom = 0.4,
  maxZoom = 2,
  initialZoom = 0.65,
}) => {
  const [zoom, setZoom] = React.useState(initialZoom);

  const zoomIn = () => setZoom((z) => Math.min(maxZoom, +(z + 0.12).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(minZoom, +(z - 0.12).toFixed(2)));
  const reset = () => setZoom(initialZoom);

  return (
    <div className="diagram-canvas relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <DiagramZoomToolbar
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={reset}
          zoomLevel={zoom}
        />
      </div>
      <div className="w-full h-full overflow-auto">
        <div className="diagram-pan-zoom-inner">
          <div
            className="diagram-pan-zoom-content"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center top',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
