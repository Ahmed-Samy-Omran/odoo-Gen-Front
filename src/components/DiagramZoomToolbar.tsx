import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, MousePointer2, Move } from 'lucide-react';

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
  return (
    <div className="diagram-zoom-toolbar">
      <button type="button" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onToggleInteractionMode}
        title={interactionMode === 'pan' ? 'Switch to select mode' : 'Switch to pan mode'}
        aria-label={interactionMode === 'pan' ? 'Switch to select mode' : 'Switch to pan mode'}
        className="rounded-full"
      >
        {interactionMode === 'select' ? (
          <MousePointer2 className="w-4 h-4" />
        ) : (
          <Move className="w-4 h-4" />
        )}
      </button>
      {zoomLevel != null && (
        <span className="diagram-zoom-level">{Math.round(zoomLevel * 100)}%</span>
      )}
      <button type="button" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in">
        <ZoomIn className="w-4 h-4" />
      </button>
      {onFullscreenToggle && (
        <button
          type="button"
          onClick={onFullscreenToggle}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          className="rounded-full"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      )}
      <button type="button" onClick={onReset} title="Fit to screen" aria-label="Fit to screen">
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
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
