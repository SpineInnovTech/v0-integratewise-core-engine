/**
 * HandoffTimeoutDO — Independent AWAITING_OUTCOME Timeout Guard
 *
 * Separate from TenantBrainDO (which handles 15-min HITL approval timeouts).
 * This DO is per-package, created on EXECUTING → AWAITING_OUTCOME transition.
 * Default timeout: 1h (tenant-configurable via tenant_config.awaiting_outcome_timeout_seconds).
 *
 * On alarm fire:
 * - External tenant: transition to FAILED (outcome_timeout)
 * - Customer Zero: may escalate per CZ policy, still logs/audits
 *
 * Phase 6 Task 25
 * Requirements: 7.5, 7.6, 7.7
 */

import { DurableObject } from "cloudflare:workers";
import { transitionTo } from "./state-machine";
import { getTenantClass } from "../tenant";

interface TimeoutState {
  package_id: string;
  tenant_id: string;
  timeout_seconds: number;
}

export class HandoffTimeoutDO extends DurableObject {
  /**
   * Schedule a timeout alarm for a handoff package.
   * Called when package transitions to AWAITING_OUTCOME.
   */
  async scheduleTimeout(state: TimeoutState): Promise<void> {
    await this.ctx.storage.put("package_state", state);
    const alarmTime = Date.now() + state.timeout_seconds * 1000;
    await this.ctx.storage.setAlarm(alarmTime);

    console.log(JSON.stringify({
      event: "handoff_timeout_scheduled",
      package_id: state.package_id,
      tenant_id: state.tenant_id,
      timeout_seconds: state.timeout_seconds,
      fires_at: new Date(alarmTime).toISOString(),
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Cancel a pending timeout (called when outcome arrives before alarm).
   */
  async cancelTimeout(): Promise<void> {
    const state = await this.ctx.storage.get<TimeoutState>("package_state");
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();

    if (state) {
      console.log(JSON.stringify({
        event: "handoff_timeout_cancelled",
        package_id: state.package_id,
        tenant_id: state.tenant_id,
        reason: "outcome_received",
        timestamp: new Date().toISOString(),
      }));
    }
  }

  /**
   * Alarm handler — fires when outcome timeout expires.
   */
  async alarm(): Promise<void> {
    const state = await this.ctx.storage.get<TimeoutState>("package_state");
    if (!state) return; // Already cancelled or cleaned up

    const { package_id, tenant_id } = state;
    const now = new Date().toISOString();

    // Check tenant class
    const tenantClass = await getTenantClass(tenant_id, this.env as any);

    if (tenantClass === "customer_zero") {
      // CZ: log escalation but don't auto-fail (CZ policy may differ)
      console.warn(JSON.stringify({
        event: "handoff_timeout_cz_escalation",
        package_id,
        tenant_id,
        tenant_class: "customer_zero",
        action: "escalate_per_policy",
        timestamp: now,
      }));
      // CZ escalation logic can be extended here
      return;
    }

    // External tenant: hard fail with outcome_timeout
    const result = await transitionTo(
      (this.env as any).D1,
      package_id,
      "FAILED",
      "timeout_do",
      "outcome_timeout"
    );

    console.log(JSON.stringify({
      event: "handoff_timeout_fired",
      package_id,
      tenant_id,
      tenant_class: tenantClass,
      transition_success: result.success,
      reason: "outcome_timeout",
      timestamp: now,
    }));

    // Cleanup
    await this.ctx.storage.deleteAll();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname.split("/").pop();

    if (action === "schedule" && request.method === "POST") {
      const body = await request.json() as TimeoutState;
      await this.scheduleTimeout(body);
      return new Response(JSON.stringify({ scheduled: true }), { status: 200 });
    }

    if (action === "cancel" && request.method === "POST") {
      await this.cancelTimeout();
      return new Response(JSON.stringify({ cancelled: true }), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
}
