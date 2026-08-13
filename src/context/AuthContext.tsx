import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AUTH_LOGOUT_EVENT,
  fetchCurrentUser,
  getRole,
  getToken,
  login,
  loginWithSupabase,
  logout as clearAppAuth,
  type CurrentUserInfo,
  type LoginResult,
} from '../services/api';
import { supabase } from '../services/supabaseClient';

export type AuthRole = 'admin' | 'user' | 'guest';

export interface AuthUser {
  /** The user id (Supabase ``auth.users.id`` or the admin username). */
  id: string | null;
  email: string | null;
  role: AuthRole;
  isGuest: boolean;
  isAdmin: boolean;
}

export interface QuotaInfo {
  tokenLimit: number | null;
  tokensUsedToday: number;
  requestsUsedToday: number;
  /** Remaining tokens for today (null = unlimited). */
  remainingTokens: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while restoring a persisted session on first load. */
  loading: boolean;
  quota: QuotaInfo | null;
  /** Re-fetch the profile + quota from ``GET /api/auth/me``. */
  refreshProfile: () => Promise<void>;
  /** Supabase email/password sign in (falls back to local admin login). */
  signIn: (email: string, password: string) => Promise<void>;
  /** Local admin login via ``POST /api/auth/login`` (bypasses Supabase). */
  signInAsAdmin: (username: string, password: string) => Promise<void>;
  /** Supabase email/password sign up. */
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  /** Anonymous guest session via ``supabase.auth.signInAnonymously()``. */
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredRole(): AuthRole {
  const role = getRole();
  return role ?? 'user';
}

/** Decode the payload of the app JWT to extract ``sub`` / ``email`` / ``exp``. */
function decodeJwtPayload(token: string): { sub?: string; role?: string; email?: string } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = window.atob(normalized);
    return JSON.parse(json) as { sub?: string; role?: string; email?: string };
  } catch {
    return null;
  }
}

function roleToAuthUser(result: LoginResult): AuthUser {
  const payload = decodeJwtPayload(result.access_token);
  const role: AuthRole = result.role === 'admin' || result.role === 'guest' ? result.role : 'user';
  const id = payload?.sub ?? result.username ?? null;
  const email = payload?.email ?? result.username ?? null;
  return {
    id,
    email: role === 'guest' ? null : email,
    role,
    isGuest: role === 'guest',
    isAdmin: role === 'admin',
  };
}

function profileToAuthUser(profile: CurrentUserInfo): AuthUser {
  const role: AuthRole = profile.role === 'admin' || profile.role === 'user' || profile.role === 'guest' ? profile.role : 'user';
  return {
    id: profile.sub,
    email: profile.email,
    role,
    isGuest: profile.is_guest || role === 'guest',
    isAdmin: profile.is_admin || role === 'admin',
  };
}

const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

const SKIP_AUTH_USER: AuthUser = {
  id: 'skip-auth',
  email: 'dev@local',
  role: 'admin',
  isGuest: false,
  isAdmin: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const busyRef = useRef(false);

  const applyStoredToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const payload = decodeJwtPayload(token);
    const role = payload?.role === 'admin' || payload?.role === 'guest' ? payload.role : readStoredRole();
    setUser({
      id: payload?.sub ?? null,
      email: payload?.email ?? (role === 'admin' ? payload?.sub ?? null : null),
      role,
      isGuest: role === 'guest',
      isAdmin: role === 'admin',
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profileToAuthUser(profile));
      setQuota({
        tokenLimit: profile.token_limit,
        tokensUsedToday: profile.tokens_used_today,
        requestsUsedToday: profile.requests_used_today,
        remainingTokens: profile.token_limit != null && profile.token_limit > 0 ? Math.max(0, profile.token_limit - profile.tokens_used_today) : null,
      });
    } catch {
      // Profile fetch is best-effort; auth state is still valid.
    }
  }, []);

  const applySupabaseSession = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) return;
    const result = await loginWithSupabase(accessToken);
    setUser(roleToAuthUser(result));
    await refreshProfile();
  }, [refreshProfile]);

  // Restore a persisted session on first load and react to Supabase auth events.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (SKIP_AUTH) {
        setUser(SKIP_AUTH_USER);
        if (!cancelled) setLoading(false);
        return;
      }
      if (supabase) {
        try {
          await applySupabaseSession();
        } catch {
          // Exchange failed (e.g. backend offline) - keep the stored app token if any.
          applyStoredToken();
        }
      } else {
        applyStoredToken();
      }
      if (!cancelled) setLoading(false);
    };

    void bootstrap();

    if (supabase) {
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          void (async () => {
            if (busyRef.current) return;
            busyRef.current = true;
            try {
              const result = await loginWithSupabase(session.access_token);
              setUser(roleToAuthUser(result));
              await refreshProfile();
            } catch {
              // Ignore transient exchange errors; the app token stays valid.
            } finally {
              busyRef.current = false;
            }
          })();
        }
      });
      return () => {
        cancelled = true;
        subscription.subscription.unsubscribe();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [applySupabaseSession, applyStoredToken, refreshProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        await applySupabaseSession();
        return;
      }
      const result = await login(email.trim(), password);
      setUser(roleToAuthUser(result));
      await refreshProfile();
    },
    [applySupabaseSession, refreshProfile],
  );

  const signInAsAdmin = useCallback(
    async (username: string, password: string) => {
      const result = await login(username.trim(), password);
      setUser(roleToAuthUser(result));
      await refreshProfile();
    },
    [refreshProfile],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error('Sign up requires Supabase to be configured.');
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      if (data.session) {
        await applySupabaseSession();
        return { needsConfirmation: false };
      }
      return { needsConfirmation: true };
    },
    [applySupabaseSession],
  );

  const signInAsGuest = useCallback(async () => {
    if (!supabase) throw new Error('Guest access requires Supabase to be configured.');
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(error.message);
    await applySupabaseSession();
  }, [applySupabaseSession]);

  const signOut = useCallback(async () => {
    if (SKIP_AUTH) {
      setUser(SKIP_AUTH_USER);
      setQuota(null);
      return;
    }
    try {
      await supabase?.auth.signOut();
    } catch {
      // Ignore Supabase sign-out errors; still clear local auth below.
    }
    clearAppAuth();
    setUser(null);
    setQuota(null);
  }, []);

  // When the backend rejects a call with 401 it clears the token and dispatches
  // AUTH_LOGOUT_EVENT (see apiFetch) - react by dropping the local session.
  useEffect(() => {
    const handleLogoutEvent = () => {
      if (SKIP_AUTH) {
        setUser(SKIP_AUTH_USER);
        return;
      }
      setUser(null);
      setQuota(null);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      quota,
      refreshProfile,
      signIn,
      signInAsAdmin,
      signUp,
      signInAsGuest,
      signOut,
    }),
    [user, loading, quota, refreshProfile, signIn, signInAsAdmin, signUp, signInAsGuest, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
