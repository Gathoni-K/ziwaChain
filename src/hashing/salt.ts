/**
 * Cryptographic salt generator.
 * Browser-safe: uses standard Web Crypto API (crypto.getRandomValues).
 */

/**
 * Generates 16 cryptographically secure random bytes as a 0x-prefixed hex string (34 characters).
 */
export function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
