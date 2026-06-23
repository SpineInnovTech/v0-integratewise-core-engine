export type UUID = string;
export type TenantId = UUID;
export type UserId = UUID;
export type EntityId = UUID;
export type SignalId = UUID;
export type EvidenceId = UUID;
export type InsightId = UUID;
export type DecisionId = UUID;
export type CorrelationId = UUID;

export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function generateUUID(): UUID {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
