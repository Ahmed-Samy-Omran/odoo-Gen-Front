import React, { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chrome, Layers, Lock, LogIn, Mail, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

type AuthTab = 'signin' | 'signup';

const inputClasses =
  'w-full bg-transparent text-sm text-white placeholder-white/30 outline-none';
const fieldWrapper =
  'flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 focus-within:border-white/30 transition-colors';

function fieldLabel(text: string) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">{text}</span>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

interface LoginViewProps {
  /** Preselect the auth tab when the landing page mounts. */
  initialTab?: 'signin' | 'signup';
}

export const LoginView: React.FC<LoginViewProps> = ({ initialTab = 'signin' }) => {
  const { signIn, signUp, signInAsGuest } = useAuth();

  const [tab, setTab] = useState<AuthTab>(initialTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (tab === 'signin') {
        await signIn(email.trim(), password);
      } else {
        const result = await signUp(email.trim(), password);
        if (result.needsConfirmation) {
          setNotice('Account created! Check your email to confirm your address before signing in.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setNotice('');
    setGuestLoading(true);
    try {
      await signInAsGuest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start guest session');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    setError('');
    setSupabaseLoading(true);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) {
        console.error('[Auth] Google OAuth error:', oauthError);
        throw oauthError;
      }
      console.log('[Auth] Google OAuth redirect initiated:', data);
    } catch (err) {
      console.error('[Auth] Google sign-in failed:', err);
      setSupabaseLoading(false);
      setError(err instanceof Error ? err.message : 'Could not start Google sign-in');
    }
  };

  const subheading = tab === 'signin'
    ? 'Sign in to continue generating modules'
    : 'Get more tokens and save your history';

  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="glass-card w-full max-w-sm p-8"
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-white/10 blur-xl opacity-40 animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-wide text-white">Odoo AI Module Generator</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">{subheading}</p>
          </div>
        </div>

        {isSupabaseConfigured && supabase && (
          <button
            type="button"
            onClick={handleGoogle}
            disabled={supabaseLoading}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {supabaseLoading ? <Spinner /> : <Chrome className="h-4 w-4" />}
            {supabaseLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
        )}

        <div className="flex flex-col gap-4">
          {isSupabaseConfigured && supabase && (
            <>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                {(
                  [
                    { id: 'signin', label: 'Sign In' },
                    { id: 'signup', label: 'Create Account' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchTab(item.id)}
                    className={`relative flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      tab === item.id ? 'text-white' : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {tab === item.id && (
                      <motion.span
                        layoutId="auth-tab-pill"
                        className="absolute inset-0 rounded-full bg-white/10 shadow-glow-sm"
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mb-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">or use a password</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1.5">
                {fieldLabel(tab === 'signin' ? 'Email or Username' : 'Email address')}
                <div className={fieldWrapper}>
                  <Mail className="h-4 w-4 shrink-0 text-white/40" />
                  <input
                    type={tab === 'signup' ? 'email' : 'text'}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={tab === 'signup' ? 'you@example.com' : 'you@example.com or admin'}
                    autoComplete="email"
                    required
                    className={inputClasses}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                {fieldLabel('Password')}
                <div className={fieldWrapper}>
                  <Lock className="h-4 w-4 shrink-0 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
                    autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                    minLength={tab === 'signup' ? 6 : undefined}
                    required
                    className={inputClasses}
                  />
                </div>
              </label>

              {error && <ErrorBanner message={error} />}
              {notice && <NoticeBanner message={notice} />}

              <button
                type="submit"
                disabled={loading}
                className="cyber-button-accent mt-1 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Spinner /> : <LogIn className="h-4 w-4" />}
                {loading
                  ? 'Please wait...'
                  : tab === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </motion.form>
          </AnimatePresence>

          {!isSupabaseConfigured && (
            <p className="text-center text-[11px] text-white/35">
              Enter your username and password to continue.
            </p>
          )}
        </div>

        <>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <motion.button
              type="button"
              onClick={handleGuest}
              disabled={guestLoading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guestLoading ? <Spinner /> : <User className="h-4 w-4" />}
              {guestLoading ? 'Starting guest session...' : 'Try as Guest'}
            </motion.button>
            <p className="mt-2 text-center text-[11px] text-white/30">
              Explore instantly without an account. Limited daily tokens.
            </p>
          </>
      </motion.div>
    </div>
  );
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
    >
      {message}
    </motion.div>
  );
}

function NoticeBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
    >
      <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
      {message}
    </motion.div>
  );
}
