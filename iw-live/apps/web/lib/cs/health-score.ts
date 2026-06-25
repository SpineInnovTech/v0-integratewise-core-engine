/**
 * CS-019: Health Score Engine + Risk Detection
 * 
 * Calculates customer health scores based on:
 * - Technical metrics (architecture, performance, code quality)
 * - Adoption metrics (active users, feature usage)
 * - Engagement metrics (support tickets, NPS)
 * - Risk signals (downgrades, churn indicators)
 */

import { createClient } from '@/lib/supabase/server';

export interface HealthScoreInputs {
  workspaceId: string;
  technicalScore?: number; // 0-100
  adoptionScore?: number; // 0-100
  engagementScore?: number; // 0-100
  riskSignals?: RiskSignal[];
}

export interface RiskSignal {
  type: 'downgrade' | 'churn' | 'support_spike' | 'usage_drop' | 'payment_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  metadata?: Record<string, any>;
}

export interface HealthScoreResult {
  overallScore: number; // 0-100
  technicalScore: number;
  adoptionScore: number;
  engagementScore: number;
  riskLevel: 'green' | 'amber' | 'red';
  riskSignals: RiskSignal[];
  recommendations: string[];
  lastCalculated: string;
}

/**
 * Calculate health score for a workspace
 */
export async function calculateHealthScore(
  inputs: HealthScoreInputs
): Promise<HealthScoreResult> {
  const supabase = await createClient();

  // Fetch metrics if not provided
  const technicalScore = inputs.technicalScore ?? await calculateTechnicalScore(inputs.workspaceId);
  const adoptionScore = inputs.adoptionScore ?? await calculateAdoptionScore(inputs.workspaceId);
  const engagementScore = inputs.engagementScore ?? await calculateEngagementScore(inputs.workspaceId);

  // Detect risk signals
  const riskSignals = inputs.riskSignals ?? await detectRiskSignals(inputs.workspaceId);

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    technicalScore * 0.35 +
    adoptionScore * 0.35 +
    engagementScore * 0.30
  );

  // Determine risk level
  const riskLevel = determineRiskLevel(overallScore, riskSignals);

  // Generate recommendations
  const recommendations = generateRecommendations(
    overallScore,
    technicalScore,
    adoptionScore,
    engagementScore,
    riskSignals
  );

  // Store health score
  await supabase.from('health_scores').upsert({
    workspace_id: inputs.workspaceId,
    overall_score: overallScore,
    technical_score: technicalScore,
    adoption_score: adoptionScore,
    engagement_score: engagementScore,
    risk_level: riskLevel,
    risk_signals: riskSignals,
    recommendations,
    calculated_at: new Date().toISOString(),
  });

  return {
    overallScore,
    technicalScore,
    adoptionScore,
    engagementScore,
    riskLevel,
    riskSignals,
    recommendations,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Calculate technical score (0-100)
 * Based on architecture maturity, best practices, infrastructure health, performance, code quality
 */
async function calculateTechnicalScore(workspaceId: string): Promise<number> {
  const supabase = await createClient();

  // Fetch technical metrics
  const { data: metrics } = await supabase
    .from('tam_accounts')
    .select('arch_maturity, best_practices, infra_health, performance, code_quality')
    .eq('workspace_id', workspaceId)
    .single();

  if (!metrics) {
    return 50; // Default score if no metrics
  }

  // Weighted average
  const technicalScore = Math.round(
    (metrics.arch_maturity || 50) * 0.25 +
    (metrics.best_practices || 50) * 0.25 +
    (metrics.infra_health || 50) * 0.20 +
    (metrics.performance || 50) * 0.15 +
    (metrics.code_quality || 50) * 0.15
  );

  return Math.max(0, Math.min(100, technicalScore));
}

/**
 * Calculate adoption score (0-100)
 * Based on active users, feature usage, growth trends
 */
async function calculateAdoptionScore(workspaceId: string): Promise<number> {
  const supabase = await createClient();

  // Get active users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: activeUsers } = await supabase
    .from('user_activity')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('last_active_at', thirtyDaysAgo.toISOString());

  // Get total procured users
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('user_count')
    .eq('id', workspaceId)
    .single();

  const procuredUsers = workspace?.user_count || 1;
  const adoptionRate = (activeUsers || 0) / procuredUsers;

  // Score: 0-100 based on adoption rate
  const adoptionScore = Math.round(Math.min(100, adoptionRate * 100));

  return adoptionScore;
}

/**
 * Calculate engagement score (0-100)
 * Based on support tickets, NPS, feature usage frequency
 */
async function calculateEngagementScore(workspaceId: string): Promise<number> {
  const supabase = await createClient();

  // Get support ticket count (lower is better)
  const { count: supportTickets } = await supabase
    .from('support_requests')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'open');

  // Get NPS score if available
  const { data: npsData } = await supabase
    .from('nps_scores')
    .select('score')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const npsScore = npsData?.score || 50; // Default to neutral

  // Calculate engagement score
  // Lower support tickets = higher score
  // Higher NPS = higher score
  const ticketScore = Math.max(0, 100 - (supportTickets || 0) * 10);
  const engagementScore = Math.round((ticketScore * 0.5) + (npsScore * 0.5));

  return Math.max(0, Math.min(100, engagementScore));
}

/**
 * Detect risk signals
 */
async function detectRiskSignals(workspaceId: string): Promise<RiskSignal[]> {
  const supabase = await createClient();
  const signals: RiskSignal[] = [];

  // Check for downgrades
  const { data: subscription } = await supabase
    .from('org_subscriptions')
    .select('status, plan_id, metadata')
    .eq('org_id', workspaceId)
    .single();

  if (subscription?.status === 'past_due') {
    signals.push({
      type: 'payment_failed',
      severity: 'high',
      detectedAt: new Date().toISOString(),
    });
  }

  // Check for usage drops
  const { data: usage } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('recorded_at', { ascending: false })
    .limit(2);

  if (usage && usage.length === 2) {
    const currentUsage = usage[0].value;
    const previousUsage = usage[1].value;
    const dropPercentage = ((previousUsage - currentUsage) / previousUsage) * 100;

    if (dropPercentage > 30) {
      signals.push({
        type: 'usage_drop',
        severity: dropPercentage > 50 ? 'high' : 'medium',
        detectedAt: new Date().toISOString(),
        metadata: { dropPercentage },
      });
    }
  }

  // Check for support spike
  const { count: recentTickets } = await supabase
    .from('support_requests')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if ((recentTickets || 0) > 5) {
    signals.push({
      type: 'support_spike',
      severity: (recentTickets || 0) > 10 ? 'high' : 'medium',
      detectedAt: new Date().toISOString(),
      metadata: { ticketCount: recentTickets },
    });
  }

  return signals;
}

/**
 * Determine risk level based on score and signals
 */
function determineRiskLevel(
  overallScore: number,
  riskSignals: RiskSignal[]
): 'green' | 'amber' | 'red' {
  const criticalSignals = riskSignals.filter(s => s.severity === 'critical').length;
  const highSignals = riskSignals.filter(s => s.severity === 'high').length;

  if (criticalSignals > 0 || overallScore < 40) {
    return 'red';
  }

  if (highSignals > 0 || overallScore < 60) {
    return 'amber';
  }

  return 'green';
}

/**
 * Generate recommendations based on scores and signals
 */
function generateRecommendations(
  overallScore: number,
  technicalScore: number,
  adoptionScore: number,
  engagementScore: number,
  riskSignals: RiskSignal[]
): string[] {
  const recommendations: string[] = [];

  if (technicalScore < 60) {
    recommendations.push('Improve technical architecture maturity and best practices');
  }

  if (adoptionScore < 60) {
    recommendations.push('Increase user adoption through training and onboarding');
  }

  if (engagementScore < 60) {
    recommendations.push('Improve customer engagement and reduce support tickets');
  }

  riskSignals.forEach(signal => {
    switch (signal.type) {
      case 'payment_failed':
        recommendations.push('Address payment issues to prevent service interruption');
        break;
      case 'usage_drop':
        recommendations.push('Investigate usage drop and re-engage users');
        break;
      case 'support_spike':
        recommendations.push('Address support ticket spike to improve satisfaction');
        break;
    }
  });

  return recommendations;
}

/**
 * Get health score for a workspace
 */
export async function getHealthScore(workspaceId: string): Promise<HealthScoreResult | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('health_scores')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    // Calculate if doesn't exist
    return await calculateHealthScore({ workspaceId });
  }

  return {
    overallScore: data.overall_score,
    technicalScore: data.technical_score,
    adoptionScore: data.adoption_score,
    engagementScore: data.engagement_score,
    riskLevel: data.risk_level,
    riskSignals: data.risk_signals || [],
    recommendations: data.recommendations || [],
    lastCalculated: data.calculated_at,
  };
}
