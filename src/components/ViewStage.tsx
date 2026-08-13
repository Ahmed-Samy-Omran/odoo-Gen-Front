import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme, type ThemeId } from '../theme/ThemeContext';
import {
  getBoltVariants,
  getDockVariants,
  getFlashVariants,
  getOrchestratorVariants,
  getPageTransition,
  getPageVariants,
  getPaperShadeVariants,
  getPresenceMode,
  getTabVariants,
  useStageCustom,
  type StageCustom,
} from '../theme/pageTransitions';

interface ViewStageProps {
  stageKey: string;
  children: ReactNode;
}

function LightningMark() {
  return (
    <svg className="page-bolt" viewBox="0 0 120 160" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        className="page-bolt__core"
        points="62,0 48,52 74,58 36,118 58,124 28,160"
        fill="none"
      />
      <polyline
        className="page-bolt__glow"
        points="62,0 48,52 74,58 36,118 58,124 28,160"
        fill="none"
      />
      <polyline
        className="page-bolt__branch"
        points="48,52 18,78 32,82"
        fill="none"
      />
      <polyline
        className="page-bolt__branch"
        points="58,124 88,138"
        fill="none"
      />
    </svg>
  );
}

function ThemeEffects({
  theme,
  custom,
  reduced,
}: {
  theme: ThemeId;
  custom: StageCustom;
  reduced: boolean;
}) {
  const flashVariants = getFlashVariants(theme, reduced);
  const boltVariants = getBoltVariants(theme, reduced);
  const paperShade = getPaperShadeVariants(theme, reduced);

  if (reduced) return null;

  if (theme === 'carbon') {
    return (
      <>
        {flashVariants && (
          <motion.div className="page-flash page-flash--carbon" variants={flashVariants} aria-hidden="true" />
        )}
        {boltVariants && (
          <motion.div className="page-bolt-layer" variants={boltVariants} aria-hidden="true">
            <LightningMark />
          </motion.div>
        )}
      </>
    );
  }

  if (theme === 'aurora') {
    return (
      <div className="page-fx page-fx--aurora" aria-hidden="true">
        <span className="page-drop" />
        <span className="page-splash" />
        <span className="page-ripple page-ripple--1" />
        <span className="page-ripple page-ripple--2" />
        <span className="page-ripple page-ripple--3" />
      </div>
    );
  }

  if (theme === 'paper' && paperShade) {
    return (
      <motion.div
        className="page-wipe page-wipe--paper"
        custom={custom}
        variants={paperShade}
        aria-hidden="true"
      />
    );
  }

  return null;
}

export function ViewStage({ stageKey, children }: ViewStageProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion() === true;
  const custom = useStageCustom(stageKey);
  const transition = getPageTransition(theme, reduced);
  const pageVariants = getPageVariants(theme, reduced);

  return (
    <AnimatePresence mode={getPresenceMode(theme)} custom={custom} initial={false}>
      <motion.div
        key={stageKey}
        className={`page-stage page-stage--${theme}`}
        custom={custom}
        variants={getOrchestratorVariants()}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={transition}
      >
        <ThemeEffects theme={theme} custom={custom} reduced={reduced} />
        <motion.div
          className="page-stage__body"
          custom={custom}
          variants={pageVariants}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ThemedTabPanelsProps {
  active: 'chat' | 'build';
  chat: ReactNode;
  build: ReactNode;
}

export function ThemedTabPanels({ active, chat, build }: ThemedTabPanelsProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion() === true;
  const custom = useStageCustom(active);
  const variants = getTabVariants(theme, reduced);

  return (
    <div className={`themed-tab-stage themed-tab-stage--${theme}`}>
      {([
        ['chat', chat],
        ['build', build],
      ] as const).map(([id, panel]) => (
        <motion.div
          key={id}
          className="themed-tab-panel"
          custom={{ ...custom, panel: id }}
          initial={false}
          animate={active === id ? 'show' : 'hide'}
          variants={variants}
          style={{ pointerEvents: active === id ? 'auto' : 'none', zIndex: active === id ? 1 : 0 }}
          aria-hidden={active !== id}
        >
          {panel}
        </motion.div>
      ))}
    </div>
  );
}

interface DockStageProps {
  show: boolean;
  children: ReactNode;
}

export function DockStage({ show, children }: DockStageProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion() === true;
  const variants = getDockVariants(theme, reduced);

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="dock"
          className="page-dock"
          variants={variants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
