import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/** Exchange a live Supabase session for the app JWT. Returns the app access token. */
export async function exchangeSupabaseSession(accessToken: string): Promise<{ id: string; email?: string } | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser(accessToken);
  const user = data?.user;
  if (!user) return null;
  return { id: user.id, email: user.email || undefined };
}
