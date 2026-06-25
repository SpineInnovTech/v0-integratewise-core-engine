/**
 * Cron Job Handlers
 * These are triggered by scheduled tasks (Vercel Cron, Cloudflare Cron, etc.)
 */

import { createGenericHandler } from "../lib/generic-handler";

// Daily Insights Cron
export const dailyInsightsHandler = createGenericHandler({
  toolId: "daily-insights",
  toolName: "Daily Insights",
});

// Hourly Insights Cron
export const hourlyInsightsHandler = createGenericHandler({
  toolId: "hourly-insights",
  toolName: "Hourly Insights",
});

// Spend Insights Cron
export const spendInsightsHandler = createGenericHandler({
  toolId: "spend-insights",
  toolName: "Spend Insights",
});

// Outbox Processor Cron
export const outboxHandler = createGenericHandler({
  toolId: "outbox",
  toolName: "Outbox Processor",
});

// Integrity Check Cron
export const integrityCheckHandler = createGenericHandler({
  toolId: "integrity-check",
  toolName: "Integrity Check",
});

// Sync Scheduler Cron
export const syncSchedulerHandler = createGenericHandler({
  toolId: "sync-scheduler",
  toolName: "Sync Scheduler",
});
