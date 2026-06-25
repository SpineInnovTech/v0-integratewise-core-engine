/**
 * Bridge Control Panel API Service
 *
 * Connects to the Think service for situations and the Act service for decisions
 */

const THINK_SERVICE_URL =
  (import.meta as any).env?.VITE_THINK_SERVICE_URL ||
  "https://integratewise-think.connect-a1b.workers.dev";
const ACT_SERVICE_URL =
  (import.meta as any).env?.VITE_ACT_SERVICE_URL ||
  "https://integratewise-act.connect-a1b.workers.dev";

export interface Situation {
  id: string;
  label: string;
  domain: "sales" | "marketing" | "cs" | "ops" | "product";
  analysis: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence: {
    flow_a: string[]; // Truth references (Spine IDs)
    flow_b: string[]; // Context references (Document IDs)
  };
  proposals: Proposal[];
  created_at: string;
}

export interface Proposal {
  id: string;
  situation_id: string;
  description: string;
  action_type: string;
  target_tool: string;
  status: "pending" | "approved" | "rejected" | "executed";
  created_at: string;
}

/**
 * Get all active situations requiring review
 */
export async function getSituations(tenantId?: string): Promise<Situation[]> {
  try {
    const url = `${THINK_SERVICE_URL}/v1/situations`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(tenantId && { "x-tenant-id": tenantId }),
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch situations:", response.status);
      return [];
    }

    const data = await response.json();
    return data.data || data.situations || [];
  } catch (error) {
    console.error("Error fetching situations:", error);
    return [];
  }
}

/**
 * Approve or reject an action proposal
 */
export async function decideAction(
  proposalId: string,
  decision: "approve" | "reject",
  tenantId?: string
): Promise<boolean> {
  try {
    const url = `${ACT_SERVICE_URL}/v1/proposals/${proposalId}/${decision}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenantId && { "x-tenant-id": tenantId }),
      },
    });

    return response.ok;
  } catch (error) {
    console.error(`Error ${decision}ing proposal:`, error);
    return false;
  }
}

/**
 * Trigger analysis for all domains
 */
export async function triggerAnalysis(tenantId: string): Promise<boolean> {
  try {
    const url = `${THINK_SERVICE_URL}/v1/think/analyze`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        entity_type: "workspace",
        entity_id: tenantId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error triggering analysis:", error);
    return false;
  }
}
