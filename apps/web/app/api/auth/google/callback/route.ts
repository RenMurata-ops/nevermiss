import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("No code in callback");
    return NextResponse.redirect(
      new URL("/settings?error=no_code", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

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

  // Exchange code for session
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("Session exchange error:", sessionError.message);
    return NextResponse.redirect(
      new URL("/settings?error=session_error", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  // Get the provider refresh token from the session
  const providerRefreshToken = sessionData.session?.provider_refresh_token;

  if (!providerRefreshToken) {
    console.error("No provider_refresh_token in session");
    return NextResponse.redirect(
      new URL("/settings?error=no_refresh_token", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  // Get current user ID
  const userId = sessionData.session?.user?.id;

  if (!userId) {
    console.error("No user ID in session");
    return NextResponse.redirect(
      new URL("/settings?error=no_user", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  // Update user's google_refresh_token in the database
  // Use service role client for this update
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ google_refresh_token: providerRefreshToken })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to update google_refresh_token:", updateError.message);
    return NextResponse.redirect(
      new URL("/settings?error=update_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  // Redirect to settings with success
  return NextResponse.redirect(
    new URL("/settings?google_connected=true", process.env.NEXT_PUBLIC_APP_URL!)
  );
}
