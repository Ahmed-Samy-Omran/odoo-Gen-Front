import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

type RelationType = 'many2one' | 'one2one' | 'one2many' | 'many2many';

const relationLabelMap: Record<string, string> = {
  many2one: 'N:1',
  one2one: '1:1',
  one2many: '1:N',
  many2many: 'N:N',
};

const relationCycle: RelationType[] = ['many2one', 'one2one', 'one2many', 'many2many'];

export const CustomEdge: React.FC<any> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    selected,
    data,
  } = props;
  const [showPicker, setShowPicker] = useState(false);
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const currentType = ((data && data.relationType) || 'many2one') as RelationType;

  const chooseType = (nextType: RelationType) => {
    if (data && typeof data.onChangeRelationType === 'function') {
      data.onChangeRelationType(nextType);
    }
    setShowPicker(false);
  };

  const cycleType = () => {
    const currentIndex = relationCycle.indexOf(currentType);
    const nextType = relationCycle[(currentIndex + 1) % relationCycle.length];
    chooseType(nextType);
  };

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute z-50"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              cycleType();
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setShowPicker((value) => !value);
            }}
            className={`rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide shadow-lg backdrop-blur transition ${
              selected
                ? 'border-cyan-400/30 bg-cyan-500/20 text-cyan-50'
                : 'border-white/10 bg-black/90 text-white/85 hover:bg-black'
            }`}
            title="Click to cycle relation type. Right-click for options."
          >
            {relationLabelMap[currentType] || currentType}
          </button>

          {showPicker && (
            <div className="mt-2 rounded-lg border border-white/10 bg-black/95 p-1 shadow-2xl shadow-black/40">
              {relationCycle.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    chooseType(type);
                  }}
                  className={`block w-full rounded-md px-2 py-1 text-left text-[10px] transition ${
                    type === currentType ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {relationLabelMap[type] || type}
                </button>
              ))}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
