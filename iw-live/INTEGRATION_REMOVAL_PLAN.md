# Integration Removal & Clerk Auth Migration Plan

## Current State Analysis

### Currently Installed Integrations
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`)
- **Stripe** (`stripe`)
- **Neon** (`@neondatabase/serverless`)
- **OpenAI** (referenced in env but not installed)

### Currently Configured
- **Supabase Auth** (middleware + lib/auth.ts)
- **Mock Auth** (fallback in lib/mock-auth.ts)
- **CLERK_SECRET_KEY** defined in env.ts but **NOT INSTALLED**

### Migration Target
- **Clerk Auth** - To be installed and configured as primary auth

---

## Removal Strategy

### Phase 1: Remove Unnecessary Integrations
1. Remove Supabase dependencies (auth only, keep if needed for data)
2. Remove Stripe (if not needed)
3. Remove Neon if using only Supabase

### Phase 2: Install & Configure Clerk
1. Install `@clerk/nextjs` 
2. Install `@clerk/types` for TypeScript
3. Create Clerk middleware
4. Create Clerk auth utilities
5. Update layout with `<ClerkProvider>`

### Phase 3: Update Components
1. Replace Supabase auth calls with Clerk
2. Update session handling
3. Update protected routes
4. Remove mock auth

### Phase 4: Clean Up
1. Remove Supabase middleware
2. Remove old auth utilities
3. Remove unused packages
4. Update environment variables

---

## Files to Remove/Modify

### Remove These Files
- `lib/supabase/middleware.ts` - Replaced by Clerk middleware
- `lib/mock-auth.ts` - No longer needed
- `lib/supabase/server.ts` - Supabase client (if not using for data)
- `lib/supabase/client.ts` - Supabase client (if not using for data)
- `app/api/auth/` - Old auth routes (if any)

### Modify These Files
- `lib/env.ts` - Remove Supabase vars, add Clerk vars
- `lib/auth.ts` - Replace with Clerk auth
- `middleware.ts` - Replace Supabase middleware with Clerk
- `app/layout.tsx` - Add ClerkProvider
- `package.json` - Remove/add dependencies

---

## Dependencies to Remove
```json
{
  "@supabase/ssr": "0.8.0",
  "@supabase/supabase-js": "latest",
  "stripe": "^14.0.0",
  "@neondatabase/serverless": "^1.0.0"
}
```

## Dependencies to Add
```json
{
  "@clerk/nextjs": "^4.29.0",
  "@clerk/types": "^3.48.0"
}
```

---

## Required Environment Variables

### Remove
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`

### Keep/Modify
- `CLERK_SECRET_KEY` - Keep (move from optional to required)
- Add: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Add: `CLERK_WEBHOOK_SECRET` (optional, for webhook events)

### Others (not auth-related)
- `EMBEDDING_MODEL_ID`
- `EMBEDDING_DIMENSION`
- `VECTOR_DISTANCE_METRIC`
- `CRON_ENABLED`
- etc.

---

## Migration Steps (Detailed)

### Step 1: Install Clerk
```bash
cd apps/web
pnpm add @clerk/nextjs @clerk/types
```

### Step 2: Create Clerk Auth Utilities
Create `lib/clerk-auth.ts`:
```typescript
import { auth, currentUser } from "@clerk/nextjs/server"

export async function getSession() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId || !user) return null
  
  return {
    user: {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName ? `${user.firstName} ${user.lastName || ""}` : undefined,
      avatar: user.imageUrl,
    }
  }
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}
```

### Step 3: Update Layout
Update `app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Step 4: Replace Middleware
Update `middleware.ts`:
```typescript
import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  publicRoutes: ["/", "/api/public"],
  ignoredRoutes: ["/api/webhooks"],
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### Step 5: Update Env
Update `lib/env.ts`:
- Remove Supabase public/private keys
- Add Clerk keys
- Keep other config

### Step 6: Remove Old Files
- Delete `lib/supabase/middleware.ts`
- Delete `lib/mock-auth.ts`
- Delete `lib/supabase/` directory (if not using Supabase for data)
- Delete old auth routes

### Step 7: Update Components
Replace auth usage:
- Remove Supabase auth calls
- Use `useAuth()` from `@clerk/nextjs`
- Use `useUser()` for current user
- Use `<SignInButton />`, `<SignUpButton />` etc.

---

## Testing Checklist

- [ ] Install succeeds without errors
- [ ] Dev server starts without errors
- [ ] Clerk provider initializes
- [ ] Sign up page works
- [ ] Sign in page works
- [ ] Session persists across pages
- [ ] Protected routes redirect to sign in
- [ ] User metadata accessible in components
- [ ] Build succeeds
- [ ] No TypeScript errors

---

## Rollback Plan

If issues arise:
1. Revert package.json
2. Restore original files from git
3. Reinstall dependencies
4. Checkout original middleware.ts

---

## Notes

- Clerk provides a ready-made UI (prebuilt components)
- Can customize styling with CSS variables
- Webhook support available for events
- Multi-factor authentication supported
- Organization support available
- Can keep Supabase for data, just remove auth

