// L2 Cognitive Layer - Sliding Panel System

// Core sliding panel component
export { SlidingPanel } from "./sliding-panel";
export type { PanelPosition, PanelSize } from "./sliding-panel";

// Provider-based panel system (alternative)
export { CognitivePanelProvider, useCognitivePanel } from "./cognitive-panel-provider";
export type { CognitiveSurface } from "./cognitive-panel-provider";

// Trigger components - note: some may be re-exports or stubs if not fully implemented
export { useCognitiveTriggers, CognitiveEventListener } from "./cognitive-triggers";

// Placeholder exports for missing components
export const CognitiveTrigger = () => null;
export const CognitiveLink = ({ children }: { children: any }) => children;
export const ExplainButton = () => null;
export const CognitiveToolbar = () => null;
export const CommandPaletteTrigger = () => null;

// Main L2 Layer — CognitiveLayer.tsx moved to _deprecated/l2-components/
// export { CognitiveLayer, openCognitiveLayer, openEvidence } from "./CognitiveLayer";
// Active L2 drawer: l2-drawer-animated.tsx (imported directly by workspace-shell-new)
