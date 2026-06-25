import { NextResponse, type NextRequest } from "next/server"
import { isDemoSession } from "@/lib/mock-auth"

export async function updateSession(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie")
  const hasDemoSession = isDemoSession(cookieHeader)

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Auto-set demo session cookie if not present
  const response = NextResponse.next({ request })

  // Always set demo_session cookie so UserMenu shows demo user
  if (!request.cookies.has("demo_session")) {
    response.cookies.set("demo_session", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
    })
  }

  // Redirect auth pages to home - no login needed
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // If user is not logged in and trying to access protected routes
  if (!hasDemoSession && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth routes, redirect to home
  if (hasDemoSession && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}
