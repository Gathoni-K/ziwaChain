/**
 * Crockford Base32 short code generator for SMS and USSD readability.
 *
 * Excludes ambiguous characters (I, L, O, U) to prevent transcription
 * errors over voice and SMS channels.
 */

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Derives a deterministic 10-character Crockford Base32 code from a payload hash,
 * formatted in two groups of 5 separated by a hyphen (e.g. "7QK4M-9X2TB").
 *
 * @param payloadHash 0x-prefixed 32-byte hex string (e.g. harvest payload hash)
 * @returns 11-character formatted string
 */
export function shortCode(payloadHash: string): string {
  if (!payloadHash) {
    throw new Error("payloadHash is required to derive shortCode");
  }

  const cleanHex = payloadHash.startsWith("0x") ? payloadHash.slice(2) : payloadHash;
  if (cleanHex.length < 16) {
    throw new Error("payloadHash must be at least 8 bytes (16 hex chars)");
  }

  // Use the first 16 hex characters (64 bits) to extract 10 5-bit symbols (50 bits)
  const bits = BigInt("0x" + cleanHex.slice(0, 16));
  let code = "";

  for (let i = 0; i < 10; i++) {
    const shift = BigInt((9 - i) * 5);
    const index = Number((bits >> shift) & 0x1fn);
    code += CROCKFORD_ALPHABET[index];
  }

  return `${code.slice(0, 5)}-${code.slice(5, 10)}`;
}
