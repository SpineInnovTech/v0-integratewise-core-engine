/**
 * Idempotency Key Generator
 *
 * Generates a unique, deterministic-format key for each handoff dispatch.
 * Format: idem_{package_id}_{timestamp_hex}
 */

export function generateIdempotencyKey(packageId: string): string {
  const timestamp = Date.now().toString(16);
  const random = crypto.randomUUID().split("-")[0];
  return `idem_${packageId.split("-")[0]}_${timestamp}_${random}`;
}
