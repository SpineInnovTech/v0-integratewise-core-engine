import { BaseConnector, SyncResult, CircuitStatus } from "@integratewise/connector-contracts";
import { CircuitBreaker, executeWithRetry } from "./resilience";

export interface ScheduledTask {
  connectorId: string;
  intervalMinutes: number;
  lastRun?: Date;
  status: "idle" | "running" | "failed";
}

export class IntelligentConnectorManager {
  private connectors: Map<string, BaseConnector> = new Map();
  private schedules: Map<string, ScheduledTask> = new Map();
  private healthStats: Map<
    string,
    {
      uptime: number;
      totalChecks: number;
      failedChecks: number;
      lastCheck?: Date;
      circuitStatus: CircuitStatus;
    }
  > = new Map();
  private syncHistory: Map<string, SyncResult[]> = new Map();
  private breakers: Map<string, CircuitBreaker> = new Map();

  // "Golden" versions for known APIs
  private latestApiVersions: Record<string, string> = {
    shopify: "2024-01",
    stripe: "2023-10-16",
    salesforce: "v60.0",
    quickbooks: "v3",
  };

  constructor() {}

  registerConnector(id: string, connector: BaseConnector) {
    this.connectors.set(id, connector);
    this.healthStats.set(id, {
      uptime: 100,
      totalChecks: 0,
      failedChecks: 0,
      circuitStatus: CircuitStatus.CLOSED,
    });
    this.schedules.set(id, { connectorId: id, intervalMinutes: 60, status: "idle" });

    // Initialize Circuit Breaker (3 failures = open, 30s reset)
    this.breakers.set(id, new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30000 }));

    this.auditConnector(id);
  }

  /**
   * Executes an operation on a connector with full resilience:
   * 1. Check Circuit Breaker
   * 2. Execute with Retry Policy
   * 3. Update Circuit State
   */
  async executeResilientOperation<T>(
    connectorId: string,
    operationName: string,
    op: () => Promise<T>
  ): Promise<T> {
    const breaker = this.breakers.get(connectorId);
    if (!breaker) throw new Error(`Unknown connector ${connectorId}`);

    if (breaker.isOpen()) {
      console.warn(`[Resilience] Circuit OPEN for ${connectorId}. Blocking ${operationName}.`);
      throw new Error(`Circuit Breaker is OPEN for ${connectorId}`);
    }

    try {
      // Retry Policy: 3 retries, start at 1s, max 10s
      const result = await executeWithRetry(
        op,
        { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 10000 },
        `${connectorId}:${operationName}`
      );

      breaker.recordSuccess();
      this.updateCircuitStatus(connectorId);
      return result;
    } catch (err) {
      breaker.recordFailure();
      this.updateCircuitStatus(connectorId);
      throw err;
    }
  }

  private updateCircuitStatus(id: string) {
    const stats = this.healthStats.get(id);
    const breaker = this.breakers.get(id);
    if (stats && breaker) {
      stats.circuitStatus = breaker.getStatus();
      this.healthStats.set(id, stats);
    }
  }

  getConnector(id: string): BaseConnector | undefined {
    return this.connectors.get(id);
  }

  async runHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [id, connector] of this.connectors) {
      const stats = this.healthStats.get(id)!;
      stats.totalChecks++;
      stats.lastCheck = new Date();
      try {
        const isHealthy = await connector.testConnection();
        if (!isHealthy) {
          stats.failedChecks++;
          console.warn(`[Health] Connector ${id} check failed logically.`);
        }
        results[id] = isHealthy;
      } catch (err) {
        stats.failedChecks++;
        console.error(`[Health] Connector ${id} threw error:`, err);
        results[id] = false;
      }
      stats.uptime = ((stats.totalChecks - stats.failedChecks) / stats.totalChecks) * 100;
      this.healthStats.set(id, stats);
    }
    return results;
  }

  optimizeSchedule(id: string) {
    const history = this.syncHistory.get(id);
    const schedule = this.schedules.get(id);
    if (!history || history.length === 0 || !schedule) return;

    const lastResult = history[history.length - 1];
    if (lastResult.status === "success") {
      if (lastResult.recordsProcessed > 1000) {
        schedule.intervalMinutes = Math.max(15, schedule.intervalMinutes / 2);
      } else if (lastResult.recordsProcessed === 0 && !lastResult.dataChanged) {
        schedule.intervalMinutes = Math.min(1440, schedule.intervalMinutes * 1.5);
      }
    }
    this.schedules.set(id, schedule);
  }

  recordSyncResult(result: SyncResult) {
    const history = this.syncHistory.get(result.connectorId) || [];
    history.push(result);
    if (history.length > 50) history.shift();
    this.syncHistory.set(result.connectorId, history);
    this.optimizeSchedule(result.connectorId);
  }

  auditConnector(id: string) {
    const connector = this.connectors.get(id);
    if (!connector) return;
    const meta = connector.getMetadata();
    const latest =
      this.latestApiVersions[meta.id] || this.latestApiVersions[meta.name.toLowerCase()];
    if (latest && meta.apiVersion !== latest && meta.apiVersion !== "unknown") {
      console.warn(`[Audit] Connector ${id} using ${meta.apiVersion}, recommended ${latest}`);
    }
    console.log(
      `[Audit] Connector ${id}: Version=${meta.version}, Healthy=${this.healthStats.get(id)?.uptime}%`
    );
  }

  getHealthReport() {
    return Array.from(this.healthStats.entries()).map(([id, stats]) => ({
      id,
      ...stats,
      status: stats.uptime > 90 ? "Healthy" : stats.uptime > 50 ? "Degraded" : "Critical",
    }));
  }
}
