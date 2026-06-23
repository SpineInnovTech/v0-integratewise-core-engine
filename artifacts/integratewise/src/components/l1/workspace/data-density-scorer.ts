/**
 * Data Density Scorer
 *
 * Implements Section 6.3 of spec: "Data Density Scoring Formula (UI Guardrail)"
 * density_score = entity_count_weight + metric_weight + goal_link_weight + freshness_weight
 *
 * Only modules exceeding the threshold are displayed. No empty sections, no awkward blanks.
 */

export interface ModuleData {
  entities: any[];
  metrics: any[];
  goalLinks: any[];
  lastUpdate: number; // timestamp
}

export interface DensityWeights {
  entityWeight: number;
  metricWeight: number;
  goalLinkWeight: number;
  freshnessWeight: number;
}

export interface DomainThresholds {
  default: number;
  dashboard: number;
  listView: number;
  detailView: number;
}

// Default weights per spec Section 6.3
const DEFAULT_WEIGHTS: DensityWeights = {
  entityWeight: 0.3,
  metricWeight: 0.3,
  goalLinkWeight: 0.2,
  freshnessWeight: 0.2,
};

// Domain-specific thresholds
const DOMAIN_THRESHOLDS: Record<string, DomainThresholds> = {
  CUSTOMER_SUCCESS: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  SALES: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  MARKETING: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  REVOPS: {
    default: 0.6,
    dashboard: 0.5,
    listView: 0.4,
    detailView: 0.2,
  },
  PRODUCT_ENGINEERING: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  FINANCE: {
    default: 0.6,
    dashboard: 0.5,
    listView: 0.4,
    detailView: 0.2,
  },
  SERVICE: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  PROCUREMENT: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  IT_ADMIN: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  STUDENT_TEACHER: {
    default: 0.4,
    dashboard: 0.3,
    listView: 0.2,
    detailView: 0.1,
  },
  BIZOPS: {
    default: 0.5,
    dashboard: 0.4,
    listView: 0.3,
    detailView: 0.2,
  },
  PERSONAL: {
    default: 0.3,
    dashboard: 0.2,
    listView: 0.2,
    detailView: 0.1,
  },
};

/**
 * Calculate density score for a module
 *
 * @param data Module data (entities, metrics, goal links, last update)
 * @param weights Custom weights (optional, defaults to spec weights)
 * @returns Density score (0-1 scale)
 */
export function calculateDensity(
  data: ModuleData,
  weights: DensityWeights = DEFAULT_WEIGHTS
): number {
  // Normalize entity count (cap at 50 for scoring)
  const entityScore = Math.min(data.entities.length / 50, 1) * weights.entityWeight;

  // Normalize metric count (cap at 10 for scoring)
  const metricScore = Math.min(data.metrics.length / 10, 1) * weights.metricWeight;

  // Normalize goal link count (cap at 5 for scoring)
  const goalLinkScore = Math.min(data.goalLinks.length / 5, 1) * weights.goalLinkWeight;

  // Freshness: Last 24 hours = full score, decays linearly to 0 over 7 days
  const oneDayMs = 86400000; // 24 hours
  const sevenDaysMs = oneDayMs * 7;
  const timeSinceUpdate = Date.now() - data.lastUpdate;
  const freshnessScore =
    timeSinceUpdate < oneDayMs
      ? weights.freshnessWeight
      : timeSinceUpdate < sevenDaysMs
        ? (1 - (timeSinceUpdate - oneDayMs) / (sevenDaysMs - oneDayMs)) * weights.freshnessWeight
        : 0;

  return entityScore + metricScore + goalLinkScore + freshnessScore;
}

/**
 * Check if module should render based on density threshold
 *
 * @param data Module data
 * @param domain Domain ID
 * @param viewType View type (dashboard, listView, detailView)
 * @returns true if module should render
 */
export function shouldRenderModule(
  data: ModuleData,
  domain: string = "CUSTOMER_SUCCESS",
  viewType: keyof DomainThresholds = "default"
): boolean {
  const thresholds = DOMAIN_THRESHOLDS[domain] || DOMAIN_THRESHOLDS.CUSTOMER_SUCCESS;
  const threshold = thresholds[viewType];
  const density = calculateDensity(data);

  return density > threshold;
}

/**
 * Get rendering recommendation with reason
 *
 * @param data Module data
 * @param domain Domain ID
 * @param viewType View type
 * @returns Recommendation object with reason
 */
export function getRenderingRecommendation(
  data: ModuleData,
  domain: string = "CUSTOMER_SUCCESS",
  viewType: keyof DomainThresholds = "default"
): {
  shouldRender: boolean;
  density: number;
  threshold: number;
  reason: string;
} {
  const thresholds = DOMAIN_THRESHOLDS[domain] || DOMAIN_THRESHOLDS.CUSTOMER_SUCCESS;
  const threshold = thresholds[viewType];
  const density = calculateDensity(data);
  const shouldRender = density > threshold;

  let reason = "";
  if (!shouldRender) {
    if (data.entities.length === 0) {
      reason = "No entities available";
    } else if (data.metrics.length === 0 && data.goalLinks.length === 0) {
      reason = "No metrics or goal links";
    } else if (Date.now() - data.lastUpdate > 86400000 * 7) {
      reason = "Data is stale (>7 days)";
    } else {
      reason = `Density ${density.toFixed(2)} below threshold ${threshold}`;
    }
  } else {
    reason = `Density ${density.toFixed(2)} exceeds threshold ${threshold}`;
  }

  return {
    shouldRender,
    density,
    threshold,
    reason,
  };
}

/**
 * Batch check multiple modules and return only renderable ones
 *
 * @param modules Array of modules with data
 * @param domain Domain ID
 * @param viewType View type
 * @returns Filtered array of modules that should render
 */
export function filterRenderableModules<T extends { id: string; data: ModuleData }>(
  modules: T[],
  domain: string = "CUSTOMER_SUCCESS",
  viewType: keyof DomainThresholds = "default"
): T[] {
  return modules.filter((module) => shouldRenderModule(module.data, domain, viewType));
}

/**
 * Get empty state message based on density score
 *
 * @param data Module data
 * @returns User-friendly empty state message
 */
export function getEmptyStateMessage(data: ModuleData): string {
  if (data.entities.length === 0) {
    return "Connect your tools to see data here";
  }

  if (data.metrics.length === 0 && data.goalLinks.length === 0) {
    return "Data hydration in progress — values are being calculated";
  }

  if (Date.now() - data.lastUpdate > 86400000 * 7) {
    return "Data is stale — please sync your connectors";
  }

  return "Not enough data to display meaningful insights yet";
}
