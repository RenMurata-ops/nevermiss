import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/booking-urls",
  "/settings",
  "/notifications",
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/login", "/register", "/reset-password", "/verify-email"];

// Public routes (no auth check needed)
const publicRoutes = ["/b/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createClient(request, response);

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session;

  // Root path redirects to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if route is public (e.g., /b/[slug])
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isPublicRoute) {
    return response;
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if route is auth route (login, register, etc.)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
