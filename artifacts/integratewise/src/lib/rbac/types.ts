export type { RoleName, RoleDefinition } from "./roles";

export type Permission = string;

export interface RBACContext {
  role: string;
  tenantId: string;
  permissions: Permission[];
}
