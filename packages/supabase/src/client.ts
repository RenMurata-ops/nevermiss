import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ==============================================
// Environment Variables
// ==============================================

const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  return url;
};

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable"
    );
  }
  return key;
};

// ==============================================
// Auth Options (to avoid AbortError with navigator.locks)
// ==============================================

const authOptions = {
  flowType: 'pkce' as const,
  detectSessionInUrl: true,
  persistSession: true,
  autoRefreshToken: true,
  // navigator.locks を無効化してエラーを回避
  lock: 'no-op' as const,
  debug: false,
};

// ==============================================
// Browser Client (for client-side use with SSR)
// ==============================================

/**
 * Creates a typed Supabase browser client instance
 * Uses @supabase/ssr for proper cookie handling in Next.js
 *
 * @example
 * ```ts
 * import { createClient } from "@nevermiss/supabase";
 *
 * const supabase = createClient();
 *
 * // Typed queries
 * const { data } = await supabase.from("users").select("*");
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: authOptions,
    }
  );
}

// ==============================================
// Standard Client (for non-SSR environments)
// ==============================================

/**
 * Creates a standard Supabase client without SSR cookie handling
 * Use this for server-side scripts, Edge Functions, or non-Next.js environments
 */
export function createStandardClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}

/**
 * Creates a Supabase client with custom URL and key
 * Useful for server-side operations or testing
 *
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 */
export function createClientWithConfig(url: string, anonKey: string) {
  return createSupabaseClient<Database>(url, anonKey);
}

// ==============================================
// Default Client Instance (singleton for browser)
// ==============================================

let _supabase: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton Supabase browser client instance
 * Lazily initialized on first call
 */
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// Re-export the createClient from supabase-js for advanced use cases
export { createSupabaseClient };
