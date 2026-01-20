import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@nevermiss/supabase";

export function createClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Set cookie on request for current request
        request.cookies.set({
          name,
          value,
          ...options,
        });
        // Set cookie on response for browser
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        // Remove cookie on request
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        // Remove cookie on response
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });
}
