import { keccak256, toUtf8Bytes } from "ethers";
import { canonicalJson } from "./canonical";

/**
 * Computes the keccak256 hash of a canonical record combined with a salt.
 * Formula: keccak256(utf8(canonicalJson({ salt, payload })))
 *
 * @param payload Arbitrary record object (must satisfy canonical validation)
 * @param salt 0x-prefixed hex string salt
 * @returns 0x-prefixed 32-byte (66-character) hex hash string
 */
export function hashRecord(payload: object, salt: string): string {
  const canonicalString = canonicalJson({ salt, payload });
  return keccak256(toUtf8Bytes(canonicalString));
}

/**
 * Computes the keccak256 hash of a harvester settlement confirmation code combined with a salt.
 * Formula: keccak256(utf8(canonicalJson({ type: "settlement_confirmation", code, salt })))
 *
 * @param code The confirmation code or message (e.g. "YES 4821")
 * @param salt 0x-prefixed hex string salt
 * @returns 0x-prefixed 32-byte (66-character) hex hash string
 */
export function hashConfirmation(code: string, salt: string): string {
  const canonicalString = canonicalJson({
    type: "settlement_confirmation",
    code,
    salt
  });
  return keccak256(toUtf8Bytes(canonicalString));
}
