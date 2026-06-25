/**
 * AES-256-GCM Token Encryption Helpers
 *
 * Shared module for encrypting/decrypting OAuth tokens and other secrets.
 * Uses Web Crypto API (available in Cloudflare Workers and modern browsers).
 *
 * Format: encrypted values are prefixed with "enc:" followed by base64(iv + ciphertext).
 * Key derivation: raw import of first 32 bytes of the secret (padded with "0").
 *
 * IMPORTANT: This is the SINGLE source of truth for token encryption.
 * Do NOT duplicate this code — import from @integratewise/lib/crypto.
 */

// ---------------------------------------------------------------------------
// Key Derivation
// ---------------------------------------------------------------------------

/**
 * Derive an AES-256-GCM CryptoKey from a string secret.
 * Takes first 32 chars (padded with "0" if shorter).
 */
export async function deriveKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.slice(0, 32).padEnd(32, "0")),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// ---------------------------------------------------------------------------
// Encrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns "enc:<base64(iv + ciphertext)>" or the original string if no key.
 */
export async function encryptToken(plaintext: string, encryptionKey?: string): Promise<string> {
  if (!encryptionKey || !plaintext) return plaintext;
  const key = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return `enc:${btoa(String.fromCharCode(...combined))}`;
}

// ---------------------------------------------------------------------------
// Decrypt
// ---------------------------------------------------------------------------

/**
 * Decrypt an "enc:..." ciphertext string using AES-256-GCM.
 * Returns plaintext. If the input is not prefixed with "enc:", returns as-is
 * (backward compat for unencrypted values).
 */
export async function decryptToken(ciphertext: string, encryptionKey?: string): Promise<string> {
  if (!encryptionKey || !ciphertext) return ciphertext;
  if (!ciphertext.startsWith("enc:")) return ciphertext; // not encrypted
  const key = await deriveKey(encryptionKey);
  const raw = atob(ciphertext.slice(4));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
