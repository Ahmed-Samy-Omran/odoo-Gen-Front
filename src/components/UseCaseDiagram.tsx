import React, { useMemo } from 'react';
import type { SchemaPreview } from '../utils/diagramBuilder';
import { DiagramPanZoom } from './DiagramZoomToolbar';

interface UseCaseDiagramProps {
  schema: SchemaPreview | null;
  visibleUseCaseCount?: number;
  showBoundary?: boolean;
}

interface ActorPosition {
  name: string;
  cx: number;
  cy: number;
}

interface UseCasePosition {
  name: string;
  actor: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

const USE_CASE_LABEL_MAX_LENGTH = 30;

function computeLayout(
  schema: SchemaPreview,
  visibleCount: number,
): {
  width: number;
  height: number;
  boundary: { x: number; y: number; w: number; h: number };
  actors: ActorPosition[];
  useCases: UseCasePosition[];
} {
  const actors = schema.actors.length > 0 ? schema.actors : ['User'];
  const useCases = schema.use_cases.slice(0, visibleCount);

  const actorAreaWidth = 150;
  const boundaryX = actorAreaWidth + 30;
  const boundaryW = 800;
  const boundaryPadY = 50;

  const ucSpacing = 54;
  const contentHeight = Math.max(120, useCases.length * ucSpacing + 20);
  const boundaryH = contentHeight + boundaryPadY * 2;
  const height = Math.max(420, boundaryH + 80);
  const width = boundaryX + boundaryW + 60;

  const boundaryY = (height - boundaryH) / 2;
  const centerX = boundaryX + boundaryW / 2;

  const actorSpacing =
    actors.length > 1
      ? (boundaryH - 80) / (actors.length - 1)
      : 0;

  const actorPositions: ActorPosition[] = actors.map((name, i) => ({
    name,
    cx: 70,
    cy:
      actors.length === 1
        ? boundaryY + boundaryH / 2
        : boundaryY + 40 + i * actorSpacing,
  }));

  const startY = boundaryY + boundaryPadY + 24;
  const useCasePositions: UseCasePosition[] = useCases.map((uc, i) => {
    const rx = Math.max(90, Math.min(210, uc.name.length * 4));
    return {
      name: uc.name,
      actor: uc.actor,
      cx: centerX,
      cy: startY + i * ucSpacing,
      rx,
      ry: 24,
    };
  });

  return {
    width,
    height,
    boundary: { x: boundaryX, y: boundaryY, w: boundaryW, h: boundaryH },
    actors: actorPositions,
    useCases: useCasePositions,
  };
}

function ActorFigure({ cx, cy, name }: { cx: number; cy: number; name: string }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle cx={0} cy={-28} r={11} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={0} y1={-17} x2={0} y2={6} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={-14} y1={-8} x2={14} y2={-8} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={0} y1={6} x2={-12} y2={26} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={0} y1={6} x2={12} y2={26} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <text
        x={0}
        y={44}
        textAnchor="middle"
        fill="rgba(255,255,255,0.65)"
        fontSize={12}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {name}
      </text>
    </g>
  );
}

function associationLine(
  actor: ActorPosition,
  uc: UseCasePosition,
): { x1: number; y1: number; x2: number; y2: number } {
  const x1 = actor.cx + 28;
  const y1 = actor.cy;
  const x2 = uc.cx - uc.rx;
  const y2 = uc.cy;
  return { x1, y1, x2, y2 };
}

export const UseCaseDiagram: React.FC<UseCaseDiagramProps> = ({
  schema,
  visibleUseCaseCount,
  showBoundary = false,
}) => {
  const layout = useMemo(() => {
    if (!schema) return null;
    const count = visibleUseCaseCount ?? schema.use_cases.length;
    return computeLayout(schema, count);
  }, [schema, visibleUseCaseCount]);

  if (!schema || !layout) {
    return (
      <div className="diagram-canvas flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-64 h-40 mx-auto rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] skeleton-loader" />
          <p className="text-white/30 text-sm">Mapping use cases...</p>
        </div>
      </div>
    );
  }

  const { width, height, boundary, actors, useCases } = layout;

  return (
    <DiagramPanZoom initialZoom={0.65} minZoom={0.35} maxZoom={2.2}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="diagram-usecase-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* System boundary */}
        <rect
          x={boundary.x}
          y={boundary.y}
          width={boundary.w}
          height={boundary.h}
          rx={14}
          fill="rgba(255,255,255,0.02)"
          stroke={showBoundary ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          strokeWidth={1.5}
          className={showBoundary ? 'animate-draw-border' : ''}
        />
        <text
          x={boundary.x + boundary.w / 2}
          y={boundary.y + 28}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize={13}
          fontWeight={500}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {schema.module_name}
        </text>

        {/* Association lines (behind use cases) */}
        {useCases.map((uc, i) => {
          const actor =
            actors.find((a) => a.name === uc.actor) ?? actors[0];
          if (!actor || !showBoundary) return null;
          const { x1, y1, x2, y2 } = associationLine(actor, uc);
          return (
            <line
              key={`line-${uc.name}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
              className="animate-diagram-soft-in"
              style={{ animationDelay: `${i * 100 + 150}ms` }}
            />
          );
        })}

        {/* Actors */}
        {actors.map((actor, i) => (
          <g
            key={actor.name}
            className="animate-diagram-soft-in"
            style={{ animationDelay: `${i * 120}ms` }}
            opacity={showBoundary ? 1 : 0.35}
          >
            <ActorFigure cx={actor.cx} cy={actor.cy} name={actor.name} />
          </g>
        ))}

        {/* Use case ellipses */}
        {useCases.map((uc, i) => (
          <g
            key={`${uc.name}-${i}`}
            className="animate-diagram-soft-in"
            style={{ animationDelay: `${i * 100 + 250}ms` }}
          >
            <ellipse
              cx={uc.cx}
              cy={uc.cy}
              rx={uc.rx}
              ry={uc.ry}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1.5}
            />
            <text
              x={uc.cx}
              y={uc.cy + 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
            >
              {truncateLabel(uc.name, USE_CASE_LABEL_MAX_LENGTH)}
            </text>
          </g>
        ))}
      </svg>
    </DiagramPanZoom>
  );
};
