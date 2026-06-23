import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

// Reject requests that do not carry a valid Clerk session. Web clients send the
// session cookie automatically on same-origin requests; clerkMiddleware (mounted
// in app.ts) populates the auth context that getAuth reads here.
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
