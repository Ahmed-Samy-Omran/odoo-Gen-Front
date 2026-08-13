import type { Transition, Variants } from 'framer-motion';
import { useRef } from 'react';
import type { ThemeId } from './ThemeContext';

export type StageDirection = 1 | -1;
export type StageSide = 'top' | 'bottom' | 'left' | 'right';

export interface StageMotion {
  direction: StageDirection;
  side: StageSide;
}

export interface StageCustom {
  enter: StageMotion;
  exit: StageMotion;
  direction: StageDirection;
  panel?: 'chat' | 'build';
}

const EASE_CLASSIC = [0.22, 1, 0.36, 1] as const;
const EASE_CARBON = [0.77, 0, 0.175, 1] as const;
const EASE_PAPER = [0.33, 0.86, 0.2, 1] as const;
const EASE_AURORA = [0.16, 1, 0.3, 1] as const;

const STAGE_ORDER: Record<string, number> = {
  welcome: 0,
  workspace: 1,
  generator: 1,
  history: 2,
  monitor: 3,
  settings: 4,
  chat: 10,
  build: 11,
};

/** Each classic destination owns a compass side. */
const STAGE_SIDE: Record<string, StageSide> = {
  welcome: 'top',
  workspace: 'bottom',
  generator: 'bottom',
  history: 'right',
  monitor: 'top',
  settings: 'left',
  chat: 'left',
  build: 'right',
};

const DEFAULT_MOTION: StageMotion = { direction: 1, side: 'right' };

function makeMotion(stageKey: string, direction: StageDirection): StageMotion {
  return {
    direction,
    side: STAGE_SIDE[stageKey] ?? 'right',
  };
}

export function useStageCustom(stageKey: string): StageCustom {
  const prevKey = useRef(stageKey);
  const current = useRef<StageMotion>(makeMotion(stageKey, 1));
  const exiting = useRef<StageMotion>(current.current);

  if (prevKey.current !== stageKey) {
    exiting.current = current.current;
    const from = STAGE_ORDER[prevKey.current] ?? 0;
    const to = STAGE_ORDER[stageKey] ?? 0;
    current.current = makeMotion(stageKey, to >= from ? 1 : -1);
    prevKey.current = stageKey;
  }

  return {
    enter: current.current,
    exit: exiting.current,
    direction: current.current.direction,
  };
}

function offsetForSide(side: StageSide): { x: string; y: string } {
  switch (side) {
    case 'top':
      return { x: '0%', y: '-100%' };
    case 'bottom':
      return { x: '0%', y: '100%' };
    case 'left':
      return { x: '-100%', y: '0%' };
    case 'right':
      return { x: '100%', y: '0%' };
  }
}

export function getPresenceMode(theme: ThemeId): 'wait' | 'sync' {
  return theme === 'aurora' ? 'sync' : 'wait';
}

export function getPageTransition(theme: ThemeId, reduced: boolean): Transition {
  if (reduced) return { duration: 0.16, ease: 'easeOut' };

  switch (theme) {
    case 'carbon':
      return { duration: 0.46, ease: EASE_CARBON };
    case 'paper':
      return { duration: 0.64, ease: EASE_PAPER };
    case 'aurora':
      return { duration: 0.72, ease: EASE_AURORA };
    default:
      return { duration: 0.46, ease: EASE_CLASSIC };
  }
}

const orchestrator: Variants = {
  initial: {},
  enter: {},
  exit: {},
};

export function getOrchestratorVariants(): Variants {
  return orchestrator;
}

export function getPageVariants(theme: ThemeId, reduced: boolean): Variants {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      enter: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  switch (theme) {
    case 'carbon':
      return {
        initial: {
          opacity: 1,
          clipPath: 'inset(0 50% 0 50%)',
        },
        enter: {
          opacity: 1,
          clipPath: 'inset(0% 0% 0% 0%)',
          transition: { delay: 0.1, duration: 0.34, ease: EASE_CARBON },
          transitionEnd: { clipPath: 'none' },
        },
        exit: {
          opacity: 1,
          clipPath: 'inset(0 50% 0 50%)',
          transition: { duration: 0.22, ease: EASE_CARBON },
        },
      };
    case 'paper':
      return {
        initial: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          rotateY: custom.direction > 0 ? 92 : -92,
          transformOrigin: custom.direction > 0 ? '0% 50%' : '100% 50%',
        }),
        enter: {
          opacity: 1,
          rotateY: 0,
          transitionEnd: { transform: 'none' },
        },
        exit: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          rotateY: custom.direction > 0 ? -92 : 92,
          transformOrigin: custom.direction > 0 ? '0% 50%' : '100% 50%',
        }),
      };
    case 'aurora':
      return {
        initial: {
          opacity: 1,
          clipPath: 'circle(0% at 50% 42%)',
        },
        enter: {
          opacity: 1,
          clipPath: 'circle(160% at 50% 42%)',
          transition: { delay: 0.28, duration: 0.52, ease: EASE_AURORA },
          transitionEnd: { clipPath: 'none' },
        },
        exit: {
          opacity: 0.35,
          transition: { duration: 0.7, ease: EASE_AURORA },
        },
      };
    default:
      return {
        initial: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          ...offsetForSide(custom.enter.side),
        }),
        enter: {
          opacity: 1,
          x: '0%',
          y: '0%',
          transitionEnd: { transform: 'none' },
        },
        exit: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          ...offsetForSide(custom.exit.side),
        }),
      };
  }
}

export function getFlashVariants(theme: ThemeId, reduced: boolean): Variants | null {
  if (reduced || theme !== 'carbon') return null;

  return {
    initial: { opacity: 0 },
    enter: {
      opacity: [0, 1, 0.55, 0],
      transition: { duration: 0.28, times: [0, 0.12, 0.28, 1], ease: 'linear' },
    },
    exit: {
      opacity: [0, 0.7, 0],
      transition: { duration: 0.18, times: [0, 0.25, 1], ease: 'linear' },
    },
  };
}

export function getBoltVariants(theme: ThemeId, reduced: boolean): Variants | null {
  if (reduced || theme !== 'carbon') return null;

  return {
    initial: { opacity: 0, scaleY: 0.2 },
    enter: {
      opacity: [0, 1, 1, 0],
      scaleY: [0.15, 1, 1, 1],
      transition: { duration: 0.42, times: [0, 0.12, 0.55, 1], ease: EASE_CARBON },
    },
    exit: {
      opacity: [0, 1, 0],
      scaleY: 1,
      transition: { duration: 0.2, times: [0, 0.2, 1], ease: 'linear' },
    },
  };
}

export function getPaperShadeVariants(theme: ThemeId, reduced: boolean): Variants | null {
  if (reduced || theme !== 'paper') return null;

  return {
    initial: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
      opacity: 0.45,
      x: custom.direction > 0 ? '-8%' : '8%',
    }),
    enter: {
      opacity: 0,
      x: '0%',
      transition: { duration: 0.5, ease: EASE_PAPER },
    },
    exit: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
      opacity: 0.4,
      x: custom.direction > 0 ? '12%' : '-12%',
      transition: { duration: 0.4, ease: EASE_PAPER },
    }),
  };
}

export function getTabVariants(theme: ThemeId, reduced: boolean): Variants {
  if (reduced) {
    return {
      show: { opacity: 1, visibility: 'visible' },
      hide: { opacity: 0, visibility: 'hidden' },
    };
  }

  switch (theme) {
    case 'carbon':
      return {
        show: {
          opacity: 1,
          x: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          visibility: 'visible',
          transition: { duration: 0.3, ease: EASE_CARBON },
          transitionEnd: { clipPath: 'none' },
        },
        hide: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          x: custom.direction > 0 ? -28 : 28,
          clipPath: 'inset(0 50% 0 50%)',
          transition: { duration: 0.22, ease: EASE_CARBON },
          transitionEnd: { visibility: 'hidden' },
        }),
      };
    case 'paper':
      return {
        show: {
          opacity: 1,
          rotateY: 0,
          visibility: 'visible',
          transition: { duration: 0.42, ease: EASE_PAPER },
          transitionEnd: { transform: 'none' },
        },
        hide: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          rotateY: custom.direction > 0 ? -72 : 72,
          transformOrigin: custom.direction > 0 ? '0% 50%' : '100% 50%',
          transition: { duration: 0.32, ease: EASE_PAPER },
          transitionEnd: { visibility: 'hidden' },
        }),
      };
    case 'aurora':
      return {
        show: {
          opacity: 1,
          clipPath: 'circle(160% at 50% 50%)',
          visibility: 'visible',
          transition: { duration: 0.45, ease: EASE_AURORA },
          transitionEnd: { clipPath: 'none' },
        },
        hide: {
          opacity: 1,
          clipPath: 'circle(0% at 50% 50%)',
          transition: { duration: 0.28, ease: EASE_AURORA },
          transitionEnd: { visibility: 'hidden' },
        },
      };
    default:
      return {
        show: {
          opacity: 1,
          x: '0%',
          y: '0%',
          visibility: 'visible',
          transition: { duration: 0.36, ease: EASE_CLASSIC },
          transitionEnd: { transform: 'none' },
        },
        hide: (custom: StageCustom = { enter: DEFAULT_MOTION, exit: DEFAULT_MOTION, direction: 1 }) => ({
          opacity: 1,
          ...offsetForSide(custom.panel === 'chat' ? 'left' : custom.panel === 'build' ? 'right' : custom.exit.side),
          transition: { duration: 0.32, ease: EASE_CLASSIC },
          transitionEnd: { visibility: 'hidden' },
        }),
      };
  }
}

export function getDockVariants(theme: ThemeId, reduced: boolean): Variants {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      enter: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  switch (theme) {
    case 'carbon':
      return {
        initial: { opacity: 0, y: 22 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_CARBON, delay: 0.12 } },
        exit: { opacity: 0, y: 16, transition: { duration: 0.18, ease: EASE_CARBON } },
      };
    case 'paper':
      return {
        initial: { opacity: 0, y: 28 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PAPER, delay: 0.16 } },
        exit: { opacity: 0, y: 18, transition: { duration: 0.22, ease: EASE_PAPER } },
      };
    case 'aurora':
      return {
        initial: { opacity: 0, y: 18, scale: 0.98 },
        enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.44, ease: EASE_AURORA, delay: 0.28 } },
        exit: { opacity: 0, y: 12, scale: 0.99, transition: { duration: 0.22, ease: EASE_AURORA } },
      };
    default:
      return {
        initial: { opacity: 0, y: 16 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_CLASSIC, delay: 0.08 } },
        exit: { opacity: 0, y: 12, transition: { duration: 0.2, ease: EASE_CLASSIC } },
      };
  }
}
