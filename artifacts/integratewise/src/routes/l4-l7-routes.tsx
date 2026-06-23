/**
 * Route Registration for L4 Memory Hub and L7 Approval Center
 *
 * Import these routes into the main router to enable the external customer surfaces.
 * Both components require tenant_id from auth context.
 */

import React from "react";
import { ApprovalCenter } from "../components/l7";
import { MemoryHub } from "../components/l4";

// Route definitions for external customer surfaces
export const externalCustomerRoutes = [
  {
    path: "/approval-center",
    element: <ApprovalCenter tenantId="" />, // tenant_id injected from auth context at runtime
    label: "Approval Center",
    layer: "L7",
  },
  {
    path: "/memory",
    element: <MemoryHub tenantId="" />, // tenant_id injected from auth context at runtime
    label: "Memory Hub",
    layer: "L4",
  },
];

/**
 * Usage in main router:
 *
 * import { externalCustomerRoutes } from './routes/l4-l7-routes';
 *
 * // Add to your Route definitions:
 * {externalCustomerRoutes.map(route => (
 *   <Route key={route.path} path={route.path} element={route.element} />
 * ))}
 */
