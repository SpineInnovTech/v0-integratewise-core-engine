export {
  registerAgent,
  lookupAgent,
  queryAgentsByCapability,
  type AgentRegistryEntry,
} from "./registry";
export { sendMessage, getInbox, markProcessed, type AgentMessage } from "./communication";
export { putAgentContext, getAgentContext, listAgentContextKeys } from "./spine-cache";
