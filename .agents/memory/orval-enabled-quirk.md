---
name: orval useQuery enabled pattern
description: orval-generated hooks require queryKey in UseQueryOptions — use raw useQuery when you need conditional fetching
---

When an orval-generated hook (e.g. `useListLeads`) is called with `{ query: { enabled: false } }`, TypeScript fails with `Property 'queryKey' is missing` because the generated type is `UseQueryOptions<...>` (not partial) — `queryKey` is required.

**Fix:** Use `useQuery` from `@tanstack/react-query` directly with `getList*QueryKey()` as the queryKey and a manual fetch in queryFn. This gives full control over `enabled` and avoids the generated type constraint.

```typescript
const relayQuery = useQuery<Lead[], Error>({
  queryKey: getListLeadsQueryKey(),
  queryFn: async ({ signal }) => {
    const res = await fetch("/api/leads", { signal });
    if (!res.ok) throw new Error(`Relay HTTP ${res.status}`);
    return res.json() as Promise<Lead[]>;
  },
  enabled: !isConnected,
  staleTime: 30_000,
});
```

**Why:** The orval-generated `UseQueryOptions` type in this project makes `queryKey` required. The workaround is idiomatic React Query and stays compatible with the existing cache keys.

**How to apply:** Whenever you need `enabled` or other conditional query options on an orval hook, reach for raw `useQuery` + the generated `get*QueryKey()` helper instead of fighting the generated type.
