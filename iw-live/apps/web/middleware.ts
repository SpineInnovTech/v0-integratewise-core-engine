import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  publicRoutes: ["/", "/api/public", "/public-demo", "/architecture-explorer"],
  ignoredRoutes: ["/api/webhooks", "/api/webhooks/clerk"],
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
