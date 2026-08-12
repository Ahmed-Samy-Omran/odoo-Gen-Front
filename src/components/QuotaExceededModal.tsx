import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Gauge, Sparkles, X } from 'lucide-react';

interface QuotaExceededModalProps {
  open: boolean;
  isGuest: boolean;
  onClose: () => void;
  /** For guests: sign out and open the Create Account screen. */
  onCreateAccount?: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  open,
  isGuest,
  onClose,
  onCreateAccount,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="glass-card relative z-10 w-full max-w-sm overflow-hidden p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quota-exceeded-title"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10">
                  <Gauge className="h-7 w-7 text-rose-400" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-xl opacity-50 animate-pulse" />
              </div>
              <h2 id="quota-exceeded-title" className="text-lg font-semibold text-white">
                Daily quota reached
              </h2>
              <p className="text-center text-sm leading-relaxed text-white/50">
                {isGuest
                  ? 'You have used all of your guest tokens for today.'
                  : 'You have reached your daily generation limit.'}
              </p>
            </div>

            {isGuest ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Sign up to unlock more
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5 text-xs text-white/45">
                    <li>• Higher daily token limit</li>
                    <li>• Your history is saved across devices</li>
                    <li>• Continue right where you left off</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="cyber-button-accent inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Create a free account
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  Not now
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300/90">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Need more capacity?
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                    Upgrade your plan to raise your daily token limit and keep generating
                    uninterrupted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.08]"
                >
                  Got it
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
