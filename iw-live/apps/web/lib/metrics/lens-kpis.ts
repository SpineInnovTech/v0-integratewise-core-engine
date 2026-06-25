/**
 * METRICS-016: Lens-Specific KPIs
 * 
 * Defines and calculates KPIs based on lens:
 * - Personal Lens: Task completion, productivity metrics
 * - Business Lens: Revenue, deals, pipeline metrics
 * - CS Lens: Health scores, adoption, retention metrics
 */

import { createClient } from '@/lib/supabase/server';

export type Lens = 'personal' | 'business' | 'cs';

export interface KPI {
  id: string;
  lens: Lens;
  name: string;
  description: string;
  value: number;
  target?: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  changePercentage?: number;
  lastUpdated: string;
}

/**
 * Get KPIs for a specific lens
 */
export async function getLensKPIs(
  workspaceId: string,
  lens: Lens
): Promise<KPI[]> {
  switch (lens) {
    case 'personal':
      return getPersonalKPIs(workspaceId);
    case 'business':
      return getBusinessKPIs(workspaceId);
    case 'cs':
      return getCSKPIs(workspaceId);
    default:
      return [];
  }
}

/**
 * Personal Lens KPIs
 * - Task completion rate
 * - Tasks completed this week
 * - Productivity score
 * - Goals progress
 */
async function getPersonalKPIs(workspaceId: string): Promise<KPI[]> {
  const supabase = await createClient();
  const kpis: KPI[] = [];

  // Task completion rate
  const { data: tasks } = await supabase
    .from('spine_tasks')
    .select('status')
    .eq('workspace_id', workspaceId);

  if (tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    kpis.push({
      id: 'task-completion-rate',
      lens: 'personal',
      name: 'Task Completion Rate',
      description: 'Percentage of tasks completed',
      value: Math.round(completionRate * 100) / 100,
      target: 80,
      unit: '%',
      trend: completionRate >= 80 ? 'up' : completionRate >= 60 ? 'stable' : 'down',
      lastUpdated: new Date().toISOString(),
    });
  }

  // Tasks completed this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: tasksThisWeek } = await supabase
    .from('spine_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'done')
    .gte('updated_at', weekAgo.toISOString());

  kpis.push({
    id: 'tasks-completed-week',
    lens: 'personal',
    name: 'Tasks Completed This Week',
    description: 'Number of tasks completed in the last 7 days',
    value: tasksThisWeek || 0,
    target: 10,
    unit: 'tasks',
    lastUpdated: new Date().toISOString(),
  });

  // Goals progress
  const { data: goals } = await supabase
    .from('goals')
    .select('progress')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  if (goals && goals.length > 0) {
    const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
    kpis.push({
      id: 'goals-progress',
      lens: 'personal',
      name: 'Goals Progress',
      description: 'Average progress across all active goals',
      value: Math.round(avgProgress * 100) / 100,
      target: 100,
      unit: '%',
      lastUpdated: new Date().toISOString(),
    });
  }

  return kpis;
}

/**
 * Business Lens KPIs
 * - Revenue (MRR/ARR)
 * - Pipeline value
 * - Deals closed this month
 * - Conversion rate
 */
async function getBusinessKPIs(workspaceId: string): Promise<KPI[]> {
  const supabase = await createClient();
  const kpis: KPI[] = [];

  // Pipeline value
  const { data: deals } = await supabase
    .from('deals')
    .select('value, stage')
    .eq('workspace_id', workspaceId);

  if (deals) {
    const pipelineValue = deals
      .filter(d => ['Qualified', 'Proposal', 'Negotiation'].includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    kpis.push({
      id: 'pipeline-value',
      lens: 'business',
      name: 'Pipeline Value',
      description: 'Total value of deals in pipeline',
      value: pipelineValue,
      unit: '$',
      lastUpdated: new Date().toISOString(),
    });

    // Deals closed this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const closedDeals = deals.filter(
      d => d.stage === 'Won' && new Date(d.updated_at) >= monthStart
    );
    const closedValue = closedDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    kpis.push({
      id: 'deals-closed-month',
      lens: 'business',
      name: 'Deals Closed This Month',
      description: 'Total value of deals closed this month',
      value: closedValue,
      unit: '$',
      lastUpdated: new Date().toISOString(),
    });

    // Conversion rate
    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === 'Won').length;
    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    kpis.push({
      id: 'conversion-rate',
      lens: 'business',
      name: 'Conversion Rate',
      description: 'Percentage of deals that closed successfully',
      value: Math.round(conversionRate * 100) / 100,
      target: 25,
      unit: '%',
      trend: conversionRate >= 25 ? 'up' : conversionRate >= 15 ? 'stable' : 'down',
      lastUpdated: new Date().toISOString(),
    });
  }

  return kpis;
}

/**
 * CS Lens KPIs
 * - Health score
 * - Adoption rate
 * - Retention rate
 * - NPS score
 */
async function getCSKPIs(workspaceId: string): Promise<KPI[]> {
  const supabase = await createClient();
  const kpis: KPI[] = [];

  // Health score
  const { data: healthScore } = await supabase
    .from('health_scores')
    .select('overall_score')
    .eq('workspace_id', workspaceId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  if (healthScore) {
    kpis.push({
      id: 'health-score',
      lens: 'cs',
      name: 'Health Score',
      description: 'Overall customer health score',
      value: healthScore.overall_score,
      target: 80,
      unit: '/100',
      trend: healthScore.overall_score >= 80 ? 'up' : healthScore.overall_score >= 60 ? 'stable' : 'down',
      lastUpdated: new Date().toISOString(),
    });
  }

  // Adoption rate
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: activeUsers } = await supabase
    .from('user_activity')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('last_active_at', thirtyDaysAgo.toISOString());

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('user_count')
    .eq('id', workspaceId)
    .single();

  const procuredUsers = workspace?.user_count || 1;
  const adoptionRate = (activeUsers || 0) / procuredUsers * 100;

  kpis.push({
    id: 'adoption-rate',
    lens: 'cs',
    name: 'Adoption Rate',
    description: 'Percentage of procured users who are active',
    value: Math.round(adoptionRate * 100) / 100,
    target: 70,
    unit: '%',
    trend: adoptionRate >= 70 ? 'up' : adoptionRate >= 50 ? 'stable' : 'down',
    lastUpdated: new Date().toISOString(),
  });

  // NPS score
  const { data: npsData } = await supabase
    .from('nps_scores')
    .select('score')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (npsData) {
    kpis.push({
      id: 'nps-score',
      lens: 'cs',
      name: 'NPS Score',
      description: 'Net Promoter Score',
      value: npsData.score,
      target: 50,
      unit: '/100',
      trend: npsData.score >= 50 ? 'up' : npsData.score >= 30 ? 'stable' : 'down',
      lastUpdated: new Date().toISOString(),
    });
  }

  return kpis;
}

/**
 * Get all KPIs for a workspace (all lenses)
 */
export async function getAllKPIs(workspaceId: string): Promise<Record<Lens, KPI[]>> {
  return {
    personal: await getPersonalKPIs(workspaceId),
    business: await getBusinessKPIs(workspaceId),
    cs: await getCSKPIs(workspaceId),
  };
}
