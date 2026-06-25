import { MorningContext } from "@integratewise/types";
import { IntelligenceEnv } from "../agents/types";

export class MorningContextBuilder {
  constructor(private env: IntelligenceEnv) {}

  /**
   * Parallel Edge Assembly of the Daily Operating Brief Morning Context.
   * Absolutely NO Supabase direct calls are made; queries are handled strictly
   * via edge-local D1 SQLite caches.
   */
  async build(tenantId: string, userId: string, sessionId?: string): Promise<MorningContext> {
    const [scheduleAndKpis, tasksAndDecisions, signals, conversationalMemory] = await Promise.all([
      this.fetchScheduleAndKpis(tenantId),
      this.fetchTasksAndDecisions(tenantId),
      this.fetchUnresolvedSignals(tenantId),
      this.fetchConversationalHistory(tenantId, sessionId),
    ]);

    // Fetch Strategic Focus from Layer-5/6 memory layer in D1
    const strategicFocus = await this.fetchStrategicFocus(tenantId, userId);

    return {
      day_overview: {
        schedule: scheduleAndKpis.schedule,
        kpis: scheduleAndKpis.kpis,
      },
      priorities: tasksAndDecisions.priorities,
      commitments: tasksAndDecisions.commitments,
      pending_decisions: tasksAndDecisions.decisions,
      unresolved_items: signals,
      memory_recall: [], // Semantic recall pulled from AI Search (pluggable/optional)
      active_conversations: conversationalMemory,
      strategic_focus: strategicFocus,
    };
  }

  private async fetchScheduleAndKpis(tenantId: string) {
    const schedule: { id: string; title: string; time?: string }[] = [];
    const kpis: {
      name: string;
      value: string | number;
      target?: string | number;
      trend: "up" | "down" | "stable";
    }[] = [];

    if (!this.env.D1) return { schedule, kpis };

    try {
      // 1. Fetch upcoming events (from build_data where type = 'calendar_event')
      const eventsResult = await this.env.D1.prepare(
        `SELECT id, name, data FROM build_data 
         WHERE type = 'calendar_event' AND json_extract(data, '$.tenant_id') = ?
         ORDER BY id DESC LIMIT 5`
      )
        .bind(tenantId)
        .all();

      eventsResult.results?.forEach((row: any) => {
        try {
          const parsed = JSON.parse(row.data);
          schedule.push({
            id: row.id,
            title: row.name || parsed.title || "Calendar Event",
            time: parsed.time || parsed.start_time || undefined,
          });
        } catch {
          schedule.push({ id: row.id, title: row.name || "Calendar Event" });
        }
      });

      // 2. Fetch pre-aggregated operational metrics (from run_data where type = 'ops_metric')
      const metricsResult = await this.env.D1.prepare(
        `SELECT id, name, data FROM run_data 
         WHERE type = 'ops_metric' AND json_extract(data, '$.tenant_id') = ?
         LIMIT 5`
      )
        .bind(tenantId)
        .all();

      metricsResult.results?.forEach((row: any) => {
        try {
          const parsed = JSON.parse(row.data);
          const rawTrend = parsed.trend || "stable";
          const trendVal: "up" | "down" | "stable" =
            rawTrend === "up" || rawTrend === "down" || rawTrend === "stable" ? rawTrend : "stable";

          kpis.push({
            name: row.name || parsed.name || "Metric",
            value: parsed.value !== undefined ? parsed.value : 0,
            target: parsed.target !== undefined ? parsed.target : undefined,
            trend: trendVal,
          });
        } catch {
          kpis.push({ name: row.name || "Metric", value: 0, trend: "stable" });
        }
      });
    } catch (err: any) {
      console.warn(`[MorningContextBuilder] Failed to fetch schedule and KPIs:`, err.message);
    }

    return { schedule, kpis };
  }

  private async fetchTasksAndDecisions(tenantId: string) {
    const priorities: {
      id: string;
      title: string;
      priority: "low" | "medium" | "high" | "critical";
    }[] = [];
    const commitments: { id: string; title: string; description: string; due_date?: string }[] = [];
    const decisions: {
      id: string;
      title: string;
      description: string;
      status: string;
      score: number;
    }[] = [];

    if (!this.env.D1) return { priorities, commitments, decisions };

    try {
      // 1. Fetch active tasks (from build_data where type = 'task' AND status != 'completed')
      const tasksResult = await this.env.D1.prepare(
        `SELECT id, name, status, data FROM build_data 
         WHERE type = 'task' AND status != 'completed' AND json_extract(data, '$.tenant_id') = ?
         LIMIT 10`
      )
        .bind(tenantId)
        .all();

      tasksResult.results?.forEach((row: any) => {
        try {
          const parsed = JSON.parse(row.data);
          const rawPriority = parsed.priority || "medium";
          const priorityVal: "low" | "medium" | "high" | "critical" =
            rawPriority === "critical" ||
            rawPriority === "high" ||
            rawPriority === "medium" ||
            rawPriority === "low"
              ? rawPriority
              : "medium";

          priorities.push({
            id: row.id,
            title: row.name || parsed.title || "Active Task",
            priority: priorityVal,
          });

          commitments.push({
            id: row.id,
            title: row.name || parsed.title || "Active Task",
            description: parsed.description || "",
            due_date: parsed.due_date || parsed.deadline || undefined,
          });
        } catch {
          priorities.push({ id: row.id, title: row.name || "Active Task", priority: "medium" });
          commitments.push({ id: row.id, title: row.name || "Active Task", description: "" });
        }
      });

      // 2. Query pending approvals (from governance_data where type = 'approval' AND status = 'pending_review')
      const approvalsResult = await this.env.D1.prepare(
        `SELECT id, status, score, proposal_data FROM governance_data 
         WHERE type = 'approval' AND status = 'pending_review'
         LIMIT 10`
      ).all();

      approvalsResult.results?.forEach((row: any) => {
        try {
          const parsedData = JSON.parse(row.proposal_data);
          if (parsedData.tenant_id === tenantId) {
            const rawScore = Number(row.score);
            const scoreVal = !isNaN(rawScore) ? Math.max(0, Math.min(1, rawScore)) : 0.5;

            decisions.push({
              id: row.id,
              title: parsedData.action_type || "Pending Approval",
              description: parsedData.action_description || "",
              status: row.status || "pending_review",
              score: scoreVal,
            });
          }
        } catch {
          decisions.push({
            id: row.id,
            title: "Pending Approval",
            description: "",
            status: row.status || "pending_review",
            score: 0.5,
          });
        }
      });
    } catch (err: any) {
      console.warn(`[MorningContextBuilder] Failed to fetch tasks and decisions:`, err.message);
    }

    return { priorities, commitments, decisions };
  }

  private async fetchUnresolvedSignals(tenantId: string) {
    const signals: {
      id: string;
      title: string;
      severity: "low" | "medium" | "high" | "critical";
      category: string;
      description: string;
    }[] = [];
    if (!this.env.D1) return signals;

    try {
      const result = await this.env.D1.prepare(
        `SELECT id, name, severity, category, data FROM cross_data 
         WHERE type = 'signal' AND status = 'new'
         LIMIT 10`
      ).all();

      result.results?.forEach((row: any) => {
        try {
          const parsedData = JSON.parse(row.data);
          if (parsedData.tenant_id === tenantId) {
            const rawSeverity = row.severity || "medium";
            const severityVal: "low" | "medium" | "high" | "critical" =
              rawSeverity === "critical" ||
              rawSeverity === "high" ||
              rawSeverity === "medium" ||
              rawSeverity === "low"
                ? rawSeverity
                : "medium";

            signals.push({
              id: row.id,
              title: row.name || parsedData.title || "Active Signal",
              severity: severityVal,
              category: row.category || "general",
              description: parsedData.description || "",
            });
          }
        } catch {
          signals.push({
            id: row.id,
            title: row.name || "Active Signal",
            severity: "medium",
            category: row.category || "general",
            description: "",
          });
        }
      });
    } catch (err: any) {
      console.warn(`[MorningContextBuilder] Failed to fetch unresolved signals:`, err.message);
    }
    return signals;
  }

  private async fetchConversationalHistory(tenantId: string, sessionId?: string): Promise<string> {
    if (!sessionId || !this.env.D1) {
      return "No conversational history found.";
    }

    try {
      const result = await this.env.D1.prepare(
        `SELECT role, content FROM conversational_memory 
         WHERE tenant_id = ? AND session_id = ? 
         ORDER BY created_at DESC LIMIT 15`
      )
        .bind(tenantId, sessionId)
        .all();

      if (result.results && result.results.length > 0) {
        return result.results
          .reverse()
          .map((m: any) => `[${m.role}] ${m.content}`)
          .join("\n");
      }
    } catch (err: any) {
      console.warn(
        `[MorningContextBuilder] Failed to fetch conversational memory from D1:`,
        err.message
      );
    }
    return "Conversational history unavailable.";
  }

  private async fetchStrategicFocus(tenantId: string, userId: string): Promise<string> {
    if (!this.env.D1) return "Strategic focus settings unavailable.";

    try {
      const result = await this.env.D1.prepare(
        `SELECT category, title, content FROM personal_memory 
         WHERE tenant_id = ? AND user_id = ? AND category IN ('goal', 'preference')
         ORDER BY updated_at DESC LIMIT 5`
      )
        .bind(tenantId, userId)
        .all();

      if (result.results && result.results.length > 0) {
        return result.results
          .map((row: any) => `[${row.category}] ${row.title}: ${row.content}`)
          .join("\n");
      }
    } catch (err: any) {
      console.warn(`[MorningContextBuilder] Failed to fetch strategic focus from D1:`, err.message);
    }

    return "Maintain normal system operations and focus on high priority task resolution.";
  }
}
