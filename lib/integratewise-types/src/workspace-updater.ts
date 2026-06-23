/**
 * IntegrateWise - Workspace Updater
 *
 * PRIMARY PRINCIPLE: Workspace updates happen DURING and BETWEEN data flow stages.
 *
 * The workspace is the user's view into the system. As data flows through:
 * OAuth → Loader → Pipeline → Spine → Entity 360
 *
 * We update the workspace at EACH STAGE so users see progress in real-time.
 */

// =============================================================================
// WORKSPACE UPDATE TYPES
// =============================================================================

export type WorkspaceUpdateType =
  | "connector.connecting" // OAuth started
  | "connector.connected" // OAuth succeeded
  | "connector.failed" // OAuth failed
  | "sync.started" // Creamy sync started
  | "sync.progress" // Progress update (e.g., "5 of 10 records")
  | "sync.completed" // Sync done
  | "sync.failed" // Sync error
  | "entity.created" // New entity in Spine
  | "entity.updated" // Entity changed
  | "entity360.ready" // Entity 360 view available
  | "insight.generated" // AI insight created
  | "action.proposed" // Action needs approval
  | "action.approved" // Action approved
  | "action.executed"; // Action completed

export interface WorkspaceUpdate {
  // Identification
  updateId: string;
  tenantId: string;
  workspaceId: string;
  userId: string;

  // What happened
  type: WorkspaceUpdateType;
  timestamp: string;

  // Context
  connectorId?: string;
  provider?: string;
  entityType?: string;
  entityId?: string;

  // Progress info
  progress?: {
    current: number;
    total: number;
    percentage: number;
    message: string;
  };

  // Data payload
  data?: Record<string, unknown>;

  // UI hints
  ui: {
    toast?: boolean; // Show toast notification
    badge?: boolean; // Update badge count
    refresh?: string[]; // Refresh these views
    highlight?: string; // Highlight this element
  };
}

// =============================================================================
// STAGE-BY-STAGE WORKSPACE UPDATES
// =============================================================================

/**
 * During OAuth Flow:
 * 1. User clicks "Connect" → workspace shows "Connecting..."
 * 2. OAuth succeeds → workspace shows "Connected! Starting sync..."
 * 3. OAuth fails → workspace shows error + retry button
 */
export function createOAuthUpdate(
  status: "connecting" | "connected" | "failed",
  tenantId: string,
  userId: string,
  provider: string,
  error?: string
): WorkspaceUpdate {
  const base = {
    updateId: crypto.randomUUID(),
    tenantId,
    workspaceId: tenantId, // Default workspace
    userId,
    timestamp: new Date().toISOString(),
    provider,
  };

  switch (status) {
    case "connecting":
      return {
        ...base,
        type: "connector.connecting",
        ui: {
          toast: true,
          badge: false,
          refresh: ["connectors-list"],
        },
        data: { message: `Connecting to ${provider}...` },
      };
    case "connected":
      return {
        ...base,
        type: "connector.connected",
        ui: {
          toast: true,
          badge: true,
          refresh: ["connectors-list", "workspace-status"],
        },
        data: { message: `${provider} connected! Starting data import...` },
      };
    case "failed":
      return {
        ...base,
        type: "connector.failed",
        ui: {
          toast: true,
          badge: false,
          refresh: ["connectors-list"],
        },
        data: { message: `Failed to connect ${provider}`, error },
      };
  }
}

/**
 * During Sync:
 * Send progress updates as records are processed
 */
export function createSyncProgressUpdate(
  tenantId: string,
  connectorId: string,
  provider: string,
  current: number,
  total: number,
  entityType: string
): WorkspaceUpdate {
  const percentage = Math.round((current / total) * 100);

  return {
    updateId: crypto.randomUUID(),
    tenantId,
    workspaceId: tenantId,
    userId: "system", // System-generated
    type: "sync.progress",
    timestamp: new Date().toISOString(),
    connectorId,
    provider,
    entityType,
    progress: {
      current,
      total,
      percentage,
      message: `Imported ${current} of ${total} ${entityType}s from ${provider}`,
    },
    ui: {
      toast: percentage % 25 === 0, // Toast at 25%, 50%, 75%, 100%
      badge: false,
      refresh: percentage === 100 ? ["entity-list", "dashboard"] : [],
    },
  };
}

/**
 * When Entity Created/Updated in Spine:
 * Notify workspace in real-time
 */
export function createEntityUpdate(
  type: "created" | "updated",
  tenantId: string,
  entityType: string,
  entityId: string,
  entityData: Record<string, unknown>
): WorkspaceUpdate {
  return {
    updateId: crypto.randomUUID(),
    tenantId,
    workspaceId: tenantId,
    userId: "system",
    type: type === "created" ? "entity.created" : "entity.updated",
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    data: entityData,
    ui: {
      toast: false, // Don't spam with entity updates
      badge: true,
      refresh: [`entity-list-${entityType}`, "dashboard"],
      highlight: entityId,
    },
  };
}

/**
 * When Entity 360 is Ready:
 * User can now view the full 360 view
 */
export function createEntity360ReadyUpdate(
  tenantId: string,
  entityType: string,
  entityId: string,
  entityName: string
): WorkspaceUpdate {
  return {
    updateId: crypto.randomUUID(),
    tenantId,
    workspaceId: tenantId,
    userId: "system",
    type: "entity360.ready",
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    data: { entityName, message: `${entityName} 360 view is ready` },
    ui: {
      toast: true,
      badge: false,
      refresh: [`entity360-${entityId}`],
    },
  };
}

// =============================================================================
// WORKSPACE UPDATE CHANNEL
// =============================================================================

export interface WorkspaceChannel {
  // Send update to all connected clients for a workspace
  broadcast(update: WorkspaceUpdate): Promise<void>;

  // Send update to specific user
  sendToUser(userId: string, update: WorkspaceUpdate): Promise<void>;

  // Subscribe to updates (client-side)
  subscribe(workspaceId: string, callback: (update: WorkspaceUpdate) => void): () => void;
}

// =============================================================================
// INTEGRATION WITH DATA FLOW
// =============================================================================

/**
 * Data Flow with Workspace Updates:
 *
 * Stage 1: OAuth
 *   → workspace: "Connecting..."
 *   → workspace: "Connected! Starting sync..."
 *
 * Stage 2: Loader (Creamy Sync)
 *   → workspace: "Importing 1 of 10 records..."
 *   → workspace: "Importing 5 of 10 records..."
 *   → workspace: "Import complete! 10 records added"
 *
 * Stage 3: Pipeline (per record)
 *   → workspace: "New account: Acme Corp"
 *   → workspace: "New contact: John Doe"
 *
 * Stage 4: Entity 360
 *   → workspace: "Acme Corp 360 view is ready"
 *
 * Stage 5: Think (AI)
 *   → workspace: "New insight: Churn risk detected"
 *   → workspace: "Action proposed: Schedule check-in"
 */

export const WORKSPACE_INTEGRATION_POINTS = {
  // OAuth callback
  "oauth.start": (provider: string) => {
    return createOAuthUpdate("connecting", "t_xxx", "u_xxx", provider);
  },

  "oauth.success": (provider: string) => {
    return createOAuthUpdate("connected", "t_xxx", "u_xxx", provider);
  },

  // Sync progress
  "sync.record": (provider: string, current: number, total: number, entityType: string) => {
    return createSyncProgressUpdate("t_xxx", "conn_xxx", provider, current, total, entityType);
  },

  // Entity updates
  "entity.new": (entityType: string, entityId: string, data: any) => {
    return createEntityUpdate("created", "t_xxx", entityType, entityId, data);
  },

  "entity360.ready": (entityType: string, entityId: string, name: string) => {
    return createEntity360ReadyUpdate("t_xxx", entityType, entityId, name);
  },
};

// =============================================================================
// WORKSPACE STATE MANAGEMENT
// =============================================================================

export interface WorkspaceState {
  tenantId: string;
  workspaceId: string;

  // Connection status
  connectors: Array<{
    id: string;
    provider: string;
    status: "connecting" | "connected" | "syncing" | "error" | "disconnected";
    lastSyncAt?: string;
    recordCount: number;
  }>;

  // Sync status
  activeSyncs: Array<{
    connectorId: string;
    provider: string;
    phase: "creamy" | "full" | "delta";
    progress: number;
    startedAt: string;
  }>;

  // Recent activity
  recentEntities: Array<{
    entityType: string;
    entityId: string;
    name: string;
    action: "created" | "updated";
    timestamp: string;
  }>;

  // Notifications
  unreadCount: number;
  notifications: WorkspaceUpdate[];

  // Readiness
  isReady: boolean;
  readyPercentage: number;
  missingConnectors: string[];
}

// Calculate workspace readiness based on connected connectors
export function calculateWorkspaceReadiness(
  connectedConnectors: string[],
  requiredConnectors: string[]
): { percentage: number; isReady: boolean; missing: string[] } {
  const missing = requiredConnectors.filter((c) => !connectedConnectors.includes(c));
  const percentage = Math.round(
    ((requiredConnectors.length - missing.length) / requiredConnectors.length) * 100
  );
  return {
    percentage,
    isReady: percentage >= 80, // Ready when 80% connected
    missing,
  };
}
