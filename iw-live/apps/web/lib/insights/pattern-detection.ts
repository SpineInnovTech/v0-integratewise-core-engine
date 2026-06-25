/**
 * INSIGHTS-013: Pattern Detection Engine
 * 
 * Detects patterns in data:
 * - Batch processing (historical analysis)
 * - Incremental processing (real-time updates)
 * - Anomaly detection
 * - Trend analysis
 * - Correlation detection
 */

import { createClient } from '@/lib/supabase/server';

export interface Pattern {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'cycle' | 'spike' | 'drop';
  confidence: number; // 0-1
  description: string;
  detectedAt: string;
  metadata: {
    metric: string;
    value?: number;
    previousValue?: number;
    changePercentage?: number;
    timeframe?: string;
    relatedPatterns?: string[];
  };
}

export interface PatternDetectionConfig {
  workspaceId: string;
  metric: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  threshold?: number; // Sensitivity threshold (0-1)
}

/**
 * Detect patterns in metric data (batch processing)
 */
export async function detectPatternsBatch(
  config: PatternDetectionConfig
): Promise<Pattern[]> {
  const supabase = await createClient();
  const patterns: Pattern[] = [];

  // Fetch historical data
  const { data: metrics } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('workspace_id', config.workspaceId)
    .eq('metric_name', config.metric)
    .order('recorded_at', { ascending: false })
    .limit(100);

  if (!metrics || metrics.length < 2) {
    return patterns;
  }

  // Detect trends
  const trendPatterns = detectTrends(metrics, config);
  patterns.push(...trendPatterns);

  // Detect anomalies
  const anomalyPatterns = detectAnomalies(metrics, config);
  patterns.push(...anomalyPatterns);

  // Detect cycles
  const cyclePatterns = detectCycles(metrics, config);
  patterns.push(...cyclePatterns);

  // Store patterns
  for (const pattern of patterns) {
    await supabase.from('detected_patterns').upsert({
      workspace_id: config.workspaceId,
      pattern_type: pattern.type,
      confidence: pattern.confidence,
      description: pattern.description,
      metadata: pattern.metadata,
      detected_at: pattern.detectedAt,
    });
  }

  return patterns;
}

/**
 * Detect patterns incrementally (real-time)
 */
export async function detectPatternsIncremental(
  config: PatternDetectionConfig,
  newValue: number
): Promise<Pattern[]> {
  const supabase = await createClient();
  const patterns: Pattern[] = [];

  // Get recent values for comparison
  const { data: recentMetrics } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('workspace_id', config.workspaceId)
    .eq('metric_name', config.metric)
    .order('recorded_at', { ascending: false })
    .limit(10);

  if (!recentMetrics || recentMetrics.length === 0) {
    return patterns;
  }

  const previousValue = recentMetrics[0].value;
  const changePercentage = ((newValue - previousValue) / previousValue) * 100;

  // Detect spikes
  if (changePercentage > 50) {
    patterns.push({
      id: `spike-${Date.now()}`,
      type: 'spike',
      confidence: Math.min(1, changePercentage / 100),
      description: `${config.metric} increased by ${changePercentage.toFixed(1)}%`,
      detectedAt: new Date().toISOString(),
      metadata: {
        metric: config.metric,
        value: newValue,
        previousValue,
        changePercentage,
      },
    });
  }

  // Detect drops
  if (changePercentage < -30) {
    patterns.push({
      id: `drop-${Date.now()}`,
      type: 'drop',
      confidence: Math.min(1, Math.abs(changePercentage) / 100),
      description: `${config.metric} decreased by ${Math.abs(changePercentage).toFixed(1)}%`,
      detectedAt: new Date().toISOString(),
      metadata: {
        metric: config.metric,
        value: newValue,
        previousValue,
        changePercentage,
      },
    });
  }

  // Detect anomalies (statistical outliers)
  const mean = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
  const variance = recentMetrics.reduce((sum, m) => sum + Math.pow(m.value - mean, 2), 0) / recentMetrics.length;
  const stdDev = Math.sqrt(variance);
  const zScore = (newValue - mean) / stdDev;

  if (Math.abs(zScore) > 2) {
    patterns.push({
      id: `anomaly-${Date.now()}`,
      type: 'anomaly',
      confidence: Math.min(1, Math.abs(zScore) / 3),
      description: `${config.metric} is ${zScore > 0 ? 'above' : 'below'} normal range`,
      detectedAt: new Date().toISOString(),
      metadata: {
        metric: config.metric,
        value: newValue,
        zScore,
      },
    });
  }

  return patterns;
}

/**
 * Detect trends in data
 */
function detectTrends(
  metrics: any[],
  config: PatternDetectionConfig
): Pattern[] {
  const patterns: Pattern[] = [];

  if (metrics.length < 5) return patterns;

  // Simple linear regression to detect trend
  const n = metrics.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = metrics.map(m => m.value);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const trendStrength = Math.abs(slope) / (sumY / n);

  if (trendStrength > 0.1) {
    patterns.push({
      id: `trend-${Date.now()}`,
      type: 'trend',
      confidence: Math.min(1, trendStrength),
      description: `${config.metric} is ${slope > 0 ? 'increasing' : 'decreasing'}`,
      detectedAt: new Date().toISOString(),
      metadata: {
        metric: config.metric,
        timeframe: config.timeframe,
      },
    });
  }

  return patterns;
}

/**
 * Detect anomalies using statistical methods
 */
function detectAnomalies(
  metrics: any[],
  config: PatternDetectionConfig
): Pattern[] {
  const patterns: Pattern[] = [];

  if (metrics.length < 3) return patterns;

  const values = metrics.map(m => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  metrics.forEach((metric, index) => {
    const zScore = (metric.value - mean) / stdDev;
    if (Math.abs(zScore) > 2.5) {
      patterns.push({
        id: `anomaly-${metric.id}`,
        type: 'anomaly',
        confidence: Math.min(1, Math.abs(zScore) / 3),
        description: `Anomaly detected in ${config.metric} at ${new Date(metric.recorded_at).toLocaleString()}`,
        detectedAt: metric.recorded_at,
        metadata: {
          metric: config.metric,
          value: metric.value,
          zScore,
        },
      });
    }
  });

  return patterns;
}

/**
 * Detect cyclical patterns
 */
function detectCycles(
  metrics: any[],
  config: PatternDetectionConfig
): Pattern[] {
  const patterns: Pattern[] = [];

  if (metrics.length < 7) return patterns;

  // Simple cycle detection: check for repeating patterns
  const values = metrics.map(m => m.value);
  const windowSize = Math.floor(values.length / 3);

  // Check for daily cycles (if timeframe is hour)
  if (config.timeframe === 'hour' && values.length >= 24) {
    const dailyPattern = detectRepeatingPattern(values.slice(-24), 24);
    if (dailyPattern.confidence > 0.6) {
      patterns.push({
        id: `cycle-daily-${Date.now()}`,
        type: 'cycle',
        confidence: dailyPattern.confidence,
        description: `Daily cycle detected in ${config.metric}`,
        detectedAt: new Date().toISOString(),
        metadata: {
          metric: config.metric,
          timeframe: 'daily',
        },
      });
    }
  }

  // Check for weekly cycles (if timeframe is day)
  if (config.timeframe === 'day' && values.length >= 7) {
    const weeklyPattern = detectRepeatingPattern(values.slice(-7), 7);
    if (weeklyPattern.confidence > 0.6) {
      patterns.push({
        id: `cycle-weekly-${Date.now()}`,
        type: 'cycle',
        confidence: weeklyPattern.confidence,
        description: `Weekly cycle detected in ${config.metric}`,
        detectedAt: new Date().toISOString(),
        metadata: {
          metric: config.metric,
          timeframe: 'weekly',
        },
      });
    }
  }

  return patterns;
}

/**
 * Detect repeating patterns in data
 */
function detectRepeatingPattern(values: number[], period: number): { confidence: number } {
  if (values.length < period * 2) {
    return { confidence: 0 };
  }

  // Compare first period with second period
  const firstPeriod = values.slice(0, period);
  const secondPeriod = values.slice(period, period * 2);

  let matches = 0;
  for (let i = 0; i < period; i++) {
    const diff = Math.abs(firstPeriod[i] - secondPeriod[i]);
    const avg = (firstPeriod[i] + secondPeriod[i]) / 2;
    const similarity = 1 - (diff / (avg || 1));
    if (similarity > 0.8) {
      matches++;
    }
  }

  return { confidence: matches / period };
}

/**
 * Get detected patterns for a workspace
 */
export async function getDetectedPatterns(
  workspaceId: string,
  limit: number = 50
): Promise<Pattern[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('detected_patterns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map(p => ({
    id: p.id,
    type: p.pattern_type,
    confidence: p.confidence,
    description: p.description,
    detectedAt: p.detected_at,
    metadata: p.metadata || {},
  }));
}
