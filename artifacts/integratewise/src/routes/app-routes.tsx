/**
 * App Routes — Integrates all customer-facing surfaces
 *
 * This file is the central route registry.
 * Import into the main router to enable L4 Memory Hub and L7 Approval Center.
 */

import React, { lazy, Suspense } from "react";

// Lazy-load L4 and L7 surfaces for code splitting
const ApprovalCenter = lazy(() =>
  import("../components/l7/ApprovalCenter").then(m => ({ default: m.ApprovalCenter }))
);
const MemoryHub = lazy(() =>
  import("../components/l4/MemoryHub").then(m => ({ default: m.MemoryHub }))
);

// Loading fallback
function RouteLoader() {
  return <div className="route-loader">Loading...</div>;
}

/**
 * External customer routes — add these to the app shell's child routes
 */
export const customerRoutes = [
  {
    path: "approval-center",
    element: (
      <Suspense fallback={<RouteLoader />}>
        <ApprovalCenter tenantId="" />
      </Suspense>
    ),
  },
  {
    path: "memory",
    element: (
      <Suspense fallback={<RouteLoader />}>
        <MemoryHub tenantId="" />
      </Suspense>
    ),
  },
];

/**
 * Integration instructions:
 *
 * In apps/web/src/routes.tsx, add to the app shell children:
 *
 * import { customerRoutes } from './routes/app-routes';
 *
 * const router = createBrowserRouter([
 *   {
 *     path: "/app",
 *     element: <AppShell />,
 *     children: [
 *       ...existingRoutes,
 *       ...customerRoutes,  // ← ADD THIS
 *     ]
 *   }
 * ]);
 */
