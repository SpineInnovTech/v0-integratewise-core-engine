/**
 * Dedicated Layer Workbenches
 *
 * Customer product (Intelligence Infrastructure):
 *   L4 Memory Hub + L7 Approval Center (insights)
 *
 * Internal / Customer Zero only (full, including Execution Infrastructure):
 *   L5 Operations + L6 Execution
 *
 * Core doctrine: IW provides L1 + L2 + L3 (Twin) + L4 + L7 insights.
 * Twin produces formal Execution Packages (handoff artifacts) for the customer's own execution environment.
 * IW never executes customer workflows.
 */

export { LayerShell, LayerLoading, LayerEmptyState, formatCompact } from "./layer-shell";
export { L4MemoryHub } from "./l4-memory-hub";
export { L5OperationsWorkbench } from "./l5-operations-workbench";
export { L6ExecutionWorkbench } from "./l6-execution-workbench";
export { L7GovernanceWorkbench } from "./l7-governance-workbench";
