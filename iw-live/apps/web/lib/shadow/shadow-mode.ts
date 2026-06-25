/**
 * IQCLONE-010: Proactive Shadow Mode
 * 
 * Background jobs for:
 * - Shadow sync (test syncs before applying)
 * - Scheduled syncs
 * - Idempotency keys
 * - Safeguards and rollback
 */

import { createClient } from '@/lib/supabase/server';

export interface ShadowJob {
  id: string;
  workspaceId: string;
  connectionId: string;
  type: 'shadow_sync' | 'scheduled_sync' | 'backfill';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  idempotencyKey: string;
  config: {
    source: string;
    destination: string;
    filters?: Record<string, any>;
    dryRun?: boolean;
  };
  result?: {
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    errors?: string[];
  };
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

/**
 * Create a shadow sync job
 */
export async function createShadowJob(
  workspaceId: string,
  connectionId: string,
  config: ShadowJob['config'],
  scheduledAt?: string
): Promise<ShadowJob> {
  const supabase = await createClient();

  const idempotencyKey = `${workspaceId}-${connectionId}-${Date.now()}`;

  const { data, error } = await supabase
    .from('shadow_jobs')
    .insert({
      workspace_id: workspaceId,
      connection_id: connectionId,
      type: 'shadow_sync',
      status: scheduledAt ? 'pending' : 'pending',
      idempotency_key: idempotencyKey,
      config,
      scheduled_at: scheduledAt,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data as ShadowJob;
}

/**
 * Execute shadow sync job
 */
export async function executeShadowJob(jobId: string): Promise<ShadowJob> {
  const supabase = await createClient();

  // Mark as running
  await supabase
    .from('shadow_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  // Get job config
  const { data: job } = await supabase
    .from('shadow_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  try {
    // Execute shadow sync (dry run)
    const result = await performShadowSync(job.config, job.workspace_id);

    // Update job with result
    await supabase
      .from('shadow_jobs')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return { ...job, status: 'completed', result } as ShadowJob;
  } catch (error: any) {
    // Mark as failed
    await supabase
      .from('shadow_jobs')
      .update({
        status: 'failed',
        result: {
          errors: [error.message],
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    throw error;
  }
}

/**
 * Perform shadow sync (dry run)
 */
async function performShadowSync(
  config: ShadowJob['config'],
  workspaceId: string
): Promise<ShadowJob['result']> {
  // This would integrate with actual sync logic
  // For now, return mock result
  return {
    recordsProcessed: 100,
    recordsSucceeded: 95,
    recordsFailed: 5,
    errors: [],
  };
}

/**
 * Schedule a sync job
 */
export async function scheduleSyncJob(
  workspaceId: string,
  connectionId: string,
  config: ShadowJob['config'],
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  }
): Promise<ShadowJob> {
  const supabase = await createClient();

  // Calculate next run time
  const scheduledAt = calculateNextRunTime(schedule);

  const idempotencyKey = `${workspaceId}-${connectionId}-${schedule.frequency}-${Date.now()}`;

  const { data, error } = await supabase
    .from('shadow_jobs')
    .insert({
      workspace_id: workspaceId,
      connection_id: connectionId,
      type: 'scheduled_sync',
      status: 'pending',
      idempotency_key: idempotencyKey,
      config,
      scheduled_at: scheduledAt,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data as ShadowJob;
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRunTime(schedule: {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}): string {
  const now = new Date();
  let nextRun = new Date();

  switch (schedule.frequency) {
    case 'hourly':
      nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      break;
    case 'daily':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(0, 0, 0, 0);
      }
      break;
    case 'weekly':
      if (schedule.dayOfWeek !== undefined) {
        const daysUntilNext = (schedule.dayOfWeek - now.getDay() + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilNext);
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
      } else {
        nextRun.setDate(now.getDate() + 7);
      }
      break;
    case 'monthly':
      if (schedule.dayOfMonth !== undefined) {
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(schedule.dayOfMonth);
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
      } else {
        nextRun.setMonth(now.getMonth() + 1);
      }
      break;
  }

  return nextRun.toISOString();
}

/**
 * Get jobs ready to run
 */
export async function getJobsReadyToRun(): Promise<ShadowJob[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('shadow_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(100);

  return (data || []) as ShadowJob[];
}

/**
 * Check idempotency - prevent duplicate jobs
 */
export async function checkIdempotency(idempotencyKey: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('shadow_jobs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .in('status', ['pending', 'running'])
    .single();

  return !!data; // Returns true if job already exists
}
