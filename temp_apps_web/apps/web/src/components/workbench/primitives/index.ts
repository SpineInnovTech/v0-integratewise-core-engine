/**
 * Workbench Primitives — 8 canonical closure components
 *
 * Doctrine: Do not build 132 custom pages.
 * Build ~8 primitives that can express any projected slice.
 */

export { MetricTile, type MetricTileProps } from "./metric-tile";
export { EntityCard, type EntityCardProps } from "./entity-card";
export { InsightBlock, type InsightBlockProps } from "./insight-block";
export { TimelineStream, type TimelineStreamProps, type TimelineEvent } from "./timeline-stream";
export {
  GovernancePanel,
  type GovernancePanelProps,
  type GovernanceItem,
} from "./governance-panel";
export { ActionTile, type ActionTileProps } from "./action-tile";
export { HealthRing, type HealthRingProps } from "./health-ring";
export {
  OperationalCanvas,
  type OperationalCanvasProps,
  type CanvasSection,
} from "./operational-canvas";
