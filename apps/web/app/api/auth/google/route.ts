import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "https://www.googleapis.com/auth/calendar.events",
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google OAuth error:", error.message);
    return NextResponse.redirect(
      new URL("/settings?error=google_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  if (data.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(
    new URL("/settings?error=google_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
  );
}
