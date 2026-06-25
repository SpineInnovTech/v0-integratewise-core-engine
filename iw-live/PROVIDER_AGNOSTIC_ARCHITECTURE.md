# Provider-Agnostic Architecture

## Overview

IntegrateWise now supports **multiple auth and database providers** through an abstraction layer. You can switch between providers via environment configuration without changing application code.

### Supported Combinations

| Auth Provider | Database Provider | Description |
|---------------|-------------------|-------------|
| Supabase Auth | Supabase DB | Full Supabase stack (PostgreSQL) |
| Supabase Auth | Cloudflare D1 | Auth via Supabase, DB via D1 |
| Clerk Auth | Supabase DB | Auth via Clerk, DB via Supabase |
| Clerk Auth | Cloudflare D1 | Full Cloudflare stack (Workers + D1) |

## Architecture

### Auth Abstraction Layer

**Location:** `lib/auth/`

**Interface:** `AuthProvider` (in `lib/auth/types.ts`)

```typescript
interface AuthProvider {
  getSession(): Promise<Session | null>
  getCurrentUser(): Promise<User | null>
  signUp(email, password, name?): Promise<User>
  signIn(email, password): Promise<Session>
  signOut(): Promise<void>
  getUserById(userId): Promise<User | null>
  updateUser(userId, updates): Promise<User>
  deleteUser(userId): Promise<void>
  provider: 'supabase' | 'clerk'
}
```

**Implementations:**
- `lib/auth/providers/supabase-auth.ts` - Supabase Auth implementation
- `lib/auth/providers/clerk-auth.ts` - Clerk Auth implementation

**Usage:**
```typescript
import { getAuthProvider } from '@/lib/auth/factory'

const auth = getAuthProvider()
const user = await auth.getCurrentUser()
```

---

### Database Abstraction Layer

**Location:** `lib/db/`

**Interface:** `DatabaseProvider` (in `lib/db/types.ts`)

```typescript
interface DatabaseProvider {
  query<T>(sql, params?, options?): Promise<QueryResult<T>>
  insert<T>(table, data, options?): Promise<QueryResult<T>>
  update<T>(table, updates, where, options?): Promise<QueryResult<T>>
  delete(table, where, options?): Promise<QueryResult>
  raw<T>(sql, params?, options?): Promise<QueryResult<T>>
  beginTransaction(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  healthCheck(): Promise<boolean>
  provider: 'supabase' | 'd1'
}
```

**Implementations:**
- `lib/db/providers/supabase-db.ts` - Supabase PostgreSQL implementation
- `lib/db/providers/d1-db.ts` - Cloudflare D1 implementation

**Usage:**
```typescript
import { getDatabaseProvider } from '@/lib/db/factory'

const db = getDatabaseProvider()
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId])
```

---

## Configuration

### Environment Variables

**Auth Provider Selection:**
```bash
# Set to 'supabase' or 'clerk'
NEXT_PUBLIC_AUTH_PROVIDER=clerk
```

**Database Provider Selection:**
```bash
# Set to 'supabase' or 'd1'
NEXT_PUBLIC_DB_PROVIDER=d1
```

### Supabase Credentials (if using Supabase)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Clerk Credentials (if using Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Deployment (Cloudflare)

For D1 database, add to `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "integratewise"
database_id = "your-db-id"
```

---

## Usage Examples

### Example 1: Get Current User (Auth Agnostic)

```typescript
// Works with both Supabase and Clerk
import { getAuthProvider } from '@/lib/auth/factory'

export async function getCurrentUserAction() {
  const auth = getAuthProvider()
  const user = await auth.getCurrentUser()
  return user
}
```

### Example 2: Query Database (DB Agnostic)

```typescript
// Works with both Supabase and D1
import { getDatabaseProvider } from '@/lib/db/factory'

export async function getUserData(userId: string) {
  const db = getDatabaseProvider()
  const result = await db.query(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  )
  return result.data?.[0]
}
```

### Example 3: Transaction (DB Agnostic)

```typescript
import { getDatabaseProvider } from '@/lib/db/factory'

export async function transferCredits(fromId: string, toId: string, amount: number) {
  const db = getDatabaseProvider()

  try {
    await db.beginTransaction()

    // Deduct from sender
    await db.update(
      'users',
      { credits: db.raw('credits - ?', [amount]) },
      { id: fromId }
    )

    // Add to receiver
    await db.update(
      'users',
      { credits: db.raw('credits + ?', [amount]) },
      { id: toId }
    )

    await db.commit()
  } catch (error) {
    await db.rollback()
    throw error
  }
}
```

### Example 4: Check Provider (Advanced)

```typescript
import { 
  isSupabaseAuth, 
  isClerkAuth, 
  isSupabaseDatabase, 
  isD1Database 
} from '@/lib/auth/factory'
import { isDatabaseProvider } from '@/lib/db/factory'

// Can provide provider-specific optimizations
if (isClerkAuth()) {
  // Clerk-specific logic
}

if (isD1Database()) {
  // D1-specific optimizations
}
```

---

## File Structure

```
apps/web/lib/
├── auth/
│   ├── types.ts                      # Auth provider interface
│   ├── env.ts                        # Auth config
│   ├── factory.ts                    # Auth provider factory
│   └── providers/
│       ├── supabase-auth.ts          # Supabase implementation
│       └── clerk-auth.ts             # Clerk implementation
└── db/
    ├── types.ts                      # Database provider interface
    ├── env.ts                        # Database config
    ├── factory.ts                    # Database provider factory
    └── providers/
        ├── supabase-db.ts            # Supabase implementation
        └── d1-db.ts                  # D1 implementation
```

---

## Implementation Considerations

### Supabase Auth

**Pros:**
- Full-featured auth system
- RLS (Row Level Security) support
- Built-in email verification
- OAuth providers built-in

**Cons:**
- Requires Supabase account
- Additional service dependency

**When to use:**
- Need advanced auth features
- Using Supabase PostgreSQL for data
- Need RLS policies

### Clerk Auth

**Pros:**
- Modern auth UI/UX
- No passwords option (passkeys, OAuth only)
- Multi-tenancy support
- Great developer experience

**Cons:**
- Another service dependency
- Can't disable email/password if you want it

**When to use:**
- Want modern auth experience
- Using D1 for data
- Multi-tenant requirements

### Supabase Database

**Pros:**
- Full PostgreSQL power
- Built-in real-time subscriptions
- RLS policies
- Full SQL support

**Cons:**
- External service
- Can be costly at scale
- Network latency

**When to use:**
- Complex relational queries needed
- Using Supabase Auth (same provider)
- Need advanced features

### Cloudflare D1

**Pros:**
- Zero cold starts (Workers)
- Integrated with Cloudflare ecosystem
- No external dependencies
- Edge-optimized

**Cons:**
- SQLite (not PostgreSQL)
- Fewer advanced features
- Learning curve for distributed queries

**When to use:**
- Using Cloudflare Workers for backend
- Deploying on Cloudflare stack
- Want edge-first architecture

---

## Migration Guide

### Switching from Supabase → Clerk Auth

1. Update `.env.local`:
```bash
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

2. Add ClerkProvider to `app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>{children}</html>
    </ClerkProvider>
  )
}
```

3. No code changes needed! Factory automatically returns Clerk provider.

### Switching from Supabase DB → D1

1. Set up D1 in `wrangler.toml`
2. Update `.env.local`:
```bash
NEXT_PUBLIC_DB_PROVIDER=d1
```

3. Optional: Add D1 migrations
4. Code continues to work with factory

---

## Testing

### Test with Supabase Stack

```bash
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Test with Cloudflare Stack

```bash
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_DB_PROVIDER=d1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### Test with Mixed Stack

```bash
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_DB_PROVIDER=supabase
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Best Practices

1. **Always use factory functions**, never import providers directly
2. **Only check provider when necessary** for optimizations
3. **Keep business logic provider-agnostic**
4. **Document provider-specific behavior** in comments
5. **Test all supported combinations** before deployment
6. **Use TypeScript** for compile-time safety
7. **Handle errors gracefully** in provider implementations

---

## Future Enhancements

- Add Firebase Auth support
- Add AWS Cognito support
- Add PostgreSQL (non-Supabase) support
- Add MongoDB support
- Add dynamic provider switching
- Add provider health monitoring
- Add metrics per provider

