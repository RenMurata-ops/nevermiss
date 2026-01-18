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
// Client Factory
// ==============================================

/**
 * Creates a typed Supabase client instance
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
// Default Client Instance (for convenience)
// ==============================================

let _supabase: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton Supabase client instance
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
