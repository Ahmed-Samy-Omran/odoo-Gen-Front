import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Circle, Loader2 } from 'lucide-react';

export type TaskStatus = 'completed' | 'running' | 'pending';

export interface TaskProgressItem {
  id: string;
  label: string;
  status: TaskStatus;
}

interface TaskProgressTrackerProps {
  tasks: TaskProgressItem[];
  title?: string;
  initialExpanded?: boolean;
  className?: string;
}

const iconClassName = 'h-3.5 w-3.5 flex-shrink-0';
const pendingIconClassName = 'h-2.5 w-2.5 flex-shrink-0';

export const TaskProgressTracker: React.FC<TaskProgressTrackerProps> = ({
  tasks,
  title = 'Task progress',
  initialExpanded = false,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  const completedCount = useMemo(() => tasks.filter(task => task.status === 'completed').length, [tasks]);
  const totalCount = tasks.length;
  const progressLabel = `${completedCount}/${totalCount}`;

  return (
    <div className={`w-full rounded-2xl border border-glass-border bg-[rgb(var(--surface)_/_0.4)] p-3 text-fg backdrop-blur-sm ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-[9px] font-light uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <span className="text-[9px] font-light text-slate-600">{progressLabel}</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="p-1 text-slate-500 transition hover:text-slate-300"
          aria-label={expanded ? 'Collapse task list' : 'Expand task list'}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-2.5 py-0.5">
              {task.status === 'completed' ? (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  className="text-accent"
                >
                  <Check className={`${iconClassName} stroke-[2.5]`} />
                </motion.div>
              ) : task.status === 'running' ? (
                <div className="text-slate-400">
                  <Loader2 className={`${pendingIconClassName} animate-spin`} />
                </div>
              ) : (
                <div className="text-slate-500">
                  <Circle className={`${pendingIconClassName} fill-current`} />
                </div>
              )}

              <p className={`text-[12px] font-light tracking-[0.01em] ${task.status === 'pending' ? 'text-slate-500' : 'text-slate-300'}`}>
                {task.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskProgressTracker;
