// General utilities

// ============================================
// UUID GENERATION (Preferred for all entity IDs)
// ============================================

/**
 * Generate a UUID v4 (random)
 * Use this for all entity IDs unless time-sortable UUIDs are needed
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a UUID v7 (time-sortable)
 * Use for IDs where chronological ordering is beneficial (signals, events, logs)
 */
export function generateUUIDv7(): string {
  const timestamp = BigInt(Date.now());
  const timestampHex = timestamp.toString(16).padStart(12, "0");

  const randomBytes = crypto.getRandomValues(new Uint8Array(10));

  const timeLow = timestampHex.slice(0, 8);
  const timeMid = timestampHex.slice(8, 12);
  const timeHiAndVersion =
    "7" +
    randomBytes[0].toString(16).padStart(2, "0").slice(1) +
    randomBytes[1].toString(16).padStart(2, "0").slice(0, 2);
  const clockSeqHiAndReserved = (0x80 | (randomBytes[2] & 0x3f)).toString(16).padStart(2, "0");
  const clockSeqLow = randomBytes[3].toString(16).padStart(2, "0");
  const node = Array.from(randomBytes.slice(4, 10))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHiAndReserved}${clockSeqLow}-${node}`;
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ============================================
// TIMING UTILITIES
// ============================================

// Sleep/delay helper
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options;

  let lastError: Error = new Error("retry failed");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generate a short ID for display purposes only
 * @deprecated DO NOT use for entity IDs - use generateUUID() instead
 * This function is only for temporary display codes, reference numbers, etc.
 * All persistent entity IDs must be UUIDs.
 */
export function shortId(length = 8): string {
  console.warn(
    "DEPRECATED: shortId() should not be used for entity IDs. Use generateUUID() instead."
  );
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a human-readable reference code (NOT an ID)
 * Use for display purposes like "REF-ABC123" or ticket numbers
 * The underlying entity must still have a UUID primary key
 */
export function generateReferenceCode(prefix: string, length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (0,O,1,I)
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

// Omit keys from object
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Pick keys from object
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
