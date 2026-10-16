import { createHmac } from "node:crypto";

/**
 * Server-side (Node.js only) harvester pseudonym derivation.
 * Computes: HMAC-SHA256(secret, `${groupId}|${batchId}`)
 *
 * Privacy rationale:
 * Harvester phone numbers or national IDs have low entropy and can be rainbow-table
 * attacked if simply hashed. By combining a server secret with the harvester group ID
 * and the specific batchId via HMAC-SHA256, each batch receives a unique, unpredictable
 * pseudonym on-chain, preventing public correlation of batches belonging to the same harvester.
 *
 * @param secret Private server-side HMAC secret
 * @param groupId Unique identifier for the harvester group/individual (e.g. "group-kisumu-04")
 * @param batchId The unique batchId for the harvest lot
 * @returns 0x-prefixed 32-byte (66-character) hex string
 */
export function derivePseudonym(secret: string, groupId: string, batchId: string): string {
  if (!secret) {
    throw new Error("HMAC secret is required to derive pseudonym");
  }
  if (!groupId) {
    throw new Error("groupId is required to derive pseudonym");
  }
  if (!batchId) {
    throw new Error("batchId is required to derive pseudonym");
  }

  const hmac = createHmac("sha256", secret);
  hmac.update(`${groupId}|${batchId}`);
  return `0x${hmac.digest("hex")}`;
}
