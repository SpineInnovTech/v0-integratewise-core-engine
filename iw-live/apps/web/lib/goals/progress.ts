/**
 * GOALS-015: Progress Calculation
 * 
 * Calculates progress toward goals:
 * - Goal completion percentage
 * - Milestone tracking
 * - Time-based progress
 * - Weighted progress (multiple metrics)
 */

import { createClient } from '@/lib/supabase/server';

export interface Goal {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  milestones?: Milestone[];
  weight?: number; // For weighted progress calculations
}

export interface Milestone {
  id: string;
  label: string;
  targetValue: number;
  achieved: boolean;
  achievedAt?: string;
}

export interface ProgressResult {
  goalId: string;
  progress: number; // 0-100
  currentValue: number;
  targetValue: number;
  remainingValue: number;
  timeProgress: number; // 0-100 (based on time elapsed)
  onTrack: boolean;
  estimatedCompletion?: string;
  milestones: Milestone[];
  lastUpdated: string;
}

/**
 * Calculate progress for a single goal
 */
export async function calculateGoalProgress(goalId: string): Promise<ProgressResult> {
  const supabase = await createClient();

  // Fetch goal
  const { data: goal } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (!goal) {
    throw new Error(`Goal not found: ${goalId}`);
  }

  // Calculate progress percentage
  const progress = Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100));

  // Calculate time progress
  const startDate = new Date(goal.start_date);
  const endDate = new Date(goal.end_date);
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = now.getTime() - startDate.getTime();
  const timeProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

  // Determine if on track
  const onTrack = progress >= timeProgress;

  // Estimate completion date
  let estimatedCompletion: string | undefined;
  if (progress > 0 && progress < 100) {
    const rate = progress / timeProgress; // Progress rate
    if (rate > 0) {
      const remainingProgress = 100 - progress;
      const estimatedDaysRemaining = (remainingProgress / rate) * (totalDuration / (1000 * 60 * 60 * 24));
      estimatedCompletion = new Date(now.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Update milestones
  const milestones = (goal.milestones || []).map((milestone: any) => {
    const achieved = goal.current_value >= milestone.target_value;
    return {
      ...milestone,
      achieved,
      achievedAt: achieved && !milestone.achieved_at ? new Date().toISOString() : milestone.achieved_at,
    };
  });

  // Update goal with current progress
  await supabase
    .from('goals')
    .update({
      current_value: goal.current_value,
      progress,
      on_track: onTrack,
      milestones,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  return {
    goalId,
    progress: Math.round(progress * 100) / 100,
    currentValue: goal.current_value,
    targetValue: goal.target_value,
    remainingValue: Math.max(0, goal.target_value - goal.current_value),
    timeProgress: Math.round(timeProgress * 100) / 100,
    onTrack,
    estimatedCompletion,
    milestones,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate weighted progress for multiple goals
 */
export async function calculateWeightedProgress(
  workspaceId: string,
  goalIds?: string[]
): Promise<{
  overallProgress: number;
  goalProgresses: ProgressResult[];
  weightedAverage: number;
}> {
  const supabase = await createClient();

  // Fetch goals
  let query = supabase
    .from('goals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  if (goalIds && goalIds.length > 0) {
    query = query.in('id', goalIds);
  }

  const { data: goals } = await query;

  if (!goals || goals.length === 0) {
    return {
      overallProgress: 0,
      goalProgresses: [],
      weightedAverage: 0,
    };
  }

  // Calculate progress for each goal
  const goalProgresses = await Promise.all(
    goals.map(goal => calculateGoalProgress(goal.id))
  );

  // Calculate weighted average
  const totalWeight = goals.reduce((sum, goal) => sum + (goal.weight || 1), 0);
  const weightedSum = goalProgresses.reduce(
    (sum, progress, index) => sum + progress.progress * (goals[index].weight || 1),
    0
  );
  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Calculate overall progress (simple average)
  const overallProgress = goalProgresses.reduce((sum, p) => sum + p.progress, 0) / goalProgresses.length;

  return {
    overallProgress: Math.round(overallProgress * 100) / 100,
    goalProgresses,
    weightedAverage: Math.round(weightedAverage * 100) / 100,
  };
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  newValue: number
): Promise<ProgressResult> {
  const supabase = await createClient();

  // Update goal current value
  await supabase
    .from('goals')
    .update({
      current_value: newValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  // Recalculate progress
  return await calculateGoalProgress(goalId);
}

/**
 * Get progress for all active goals in a workspace
 */
export async function getAllGoalProgress(workspaceId: string): Promise<ProgressResult[]> {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from('goals')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  if (!goals) return [];

  return Promise.all(goals.map(goal => calculateGoalProgress(goal.id)));
}
