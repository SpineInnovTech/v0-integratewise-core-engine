/**
 * Shim: next/navigation → react-router v7
 *
 * Maps Next.js navigation hooks to React Router equivalents.
 * Used during migration from Next.js to Vite + React Router.
 */

import { useLocation, useNavigate, useSearchParams } from "react-router";

export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => navigate(0),
    prefetch: (_path: string) => {
      /* no-op in SPA */
    },
  };
}

export function useSearchParamsShim() {
  const [searchParams] = useSearchParams();
  return searchParams;
}

export { useSearchParamsShim as useSearchParams };
