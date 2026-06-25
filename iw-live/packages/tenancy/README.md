# @integratewise/tenancy

Shared tenant resolution and context middleware for IntegrateWise.

## Features

- **Multi-source tenant resolution**: Supports resolving tenant ID from:
  - HTTP headers (`x-tenant-id`) - highest priority
  - Subdomain (e.g., `acme.example.com` → `acme`)
  - JWT tokens (Authorization header)
  - Default fallback

- **Framework support**:
  - Next.js middleware
  - Cloudflare Workers (Hono framework)
  - Raw Cloudflare Workers

- **Advanced features**:
  - Subdomain lookup table support
  - Configurable subdomain patterns
  - Error codes for programmatic handling
  - Debug logging
  - Input validation and sanitization
  - Type-safe tenant IDs

## Installation

```bash
npm install @integratewise/tenancy
```

## Usage

### Next.js Middleware

```typescript
import { createTenantMiddleware } from "@integratewise/tenancy/middleware";
import type { TenantId } from "@integratewise/types";

const tenantMiddleware = createTenantMiddleware({
  defaultTenantId: "ten_demo" as TenantId,
  requireTenant: false,
  injectHeaders: true,
});

export async function middleware(request: NextRequest) {
  const response = await tenantMiddleware(request);
  // ... rest of middleware logic
  return response;
}
```

### Hono (Cloudflare Workers)

```typescript
import { Hono } from "hono";
import { tenantMiddleware, getTenantFromContext } from "@integratewise/tenancy/worker";

const app = new Hono<{ Bindings: Env & TenantContextEnv }>();

// Add tenant middleware
app.use(
  "*",
  tenantMiddleware({
    defaultTenantId: "ten_demo" as TenantId,
    requireTenant: false,
  })
);

// Use tenant context in routes
app.get("/api/data", async (c) => {
  const tenant = getTenantFromContext(c);
  if (tenant) {
    console.log(`Tenant: ${tenant.tenantId}`);
  }
  // ... rest of handler
});
```

### Raw Cloudflare Workers

```typescript
import { resolveTenantForWorker } from "@integratewise/tenancy/worker";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const result = await resolveTenantForWorker(request, {
      defaultTenantId: "ten_demo" as TenantId,
      requireTenant: false,
    });

    if (!result.context) {
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 401,
      });
    }

    // Use result.context.tenantId
    // ...
  },
};
```

## API Reference

### `resolveTenant(request, options)`

Resolves tenant from request using priority order:

1. Header (`x-tenant-id`)
2. Subdomain
3. JWT token
4. Default tenant (if provided)

### `createTenantMiddleware(options)`

Creates Next.js middleware function that resolves and injects tenant context.

### `tenantMiddleware(options)`

Hono middleware for tenant resolution.

### `resolveTenantForWorker(request, options)`

Raw Cloudflare Worker function for tenant resolution.

## Configuration Options

- `defaultTenantId`: Default tenant ID to use if resolution fails
- `requireTenant`: Whether to throw error if tenant cannot be resolved
- `tenantHeaderName`: Custom header name (default: `x-tenant-id`)
- `allowedSubdomains`: Array of allowed subdomain patterns (e.g., `['*.example.com']`)
- `subdomainLookup`: Async function to lookup tenant ID from subdomain string
- `baseDomain`: Base domain for subdomain extraction (e.g., `'example.com'`)
- `debug`: Enable debug logging (default: `false`)
- `logger`: Custom logger function
- `injectHeaders`: Whether to inject tenant context into response headers (Next.js only)

## Advanced Usage

### Subdomain Lookup Table

```typescript
import { createTenantMiddleware } from "@integratewise/tenancy/middleware";

const tenantMiddleware = createTenantMiddleware({
  subdomainLookup: async (subdomain: string) => {
    // Lookup tenant ID from database or cache
    const tenant = await db.tenants.findBySubdomain(subdomain);
    return tenant?.id || null;
  },
  baseDomain: "example.com",
});
```

### Error Handling

```typescript
import { resolveTenant, TenantResolutionErrorCode } from "@integratewise/tenancy";

const result = await resolveTenant(request);

if (!result.success) {
  switch (result.errorCode) {
    case TenantResolutionErrorCode.NOT_FOUND:
      // Handle not found
      break;
    case TenantResolutionErrorCode.INVALID_FORMAT:
      // Handle invalid format
      break;
    case TenantResolutionErrorCode.SUBDOMAIN_NOT_ALLOWED:
      // Handle disallowed subdomain
      break;
  }
}
```

### Debug Mode

```typescript
const tenantMiddleware = createTenantMiddleware({
  debug: process.env.NODE_ENV === "development",
  logger: (message, data) => {
    console.log(`[Tenancy] ${message}`, data);
  },
});
```

## Error Codes

- `TENANT_NOT_FOUND`: No tenant identifier found
- `TENANT_INVALID_FORMAT`: Invalid tenant ID format
- `TENANT_NOT_ALLOWED`: Tenant ID not in allowed list
- `JWT_INVALID`: JWT token invalid or expired
- `SUBDOMAIN_NOT_ALLOWED`: Subdomain not allowed
- `TENANT_CONFLICT`: Multiple tenant identifiers found

## License

MIT
