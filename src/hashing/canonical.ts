/**
 * Canonical JSON serialization conforming to RFC 8785 (JSON Canonicalization Scheme / JCS).
 * Browser-safe with zero Node.js dependencies.
 */

function validateCanonicalValue(val: unknown, path = "$"): void {
  if (val === undefined) {
    throw new Error(`Invalid canonical value at ${path}: undefined is not permitted`);
  }
  if (typeof val === "function") {
    throw new Error(`Invalid canonical value at ${path}: functions are not permitted`);
  }
  if (typeof val === "symbol") {
    throw new Error(`Invalid canonical value at ${path}: symbols are not permitted`);
  }
  if (typeof val === "number") {
    if (Number.isNaN(val)) {
      throw new Error(`Invalid canonical value at ${path}: NaN is not permitted`);
    }
    if (!Number.isFinite(val)) {
      throw new Error(`Invalid canonical value at ${path}: Infinity is not permitted`);
    }
    if (!Number.isInteger(val)) {
      throw new Error(`Invalid canonical value at ${path}: non-integer number (${val}) is not permitted`);
    }
    return;
  }
  if (typeof val === "string" || typeof val === "boolean" || val === null) {
    return;
  }
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      validateCanonicalValue(val[i], `${path}[${i}]`);
    }
    return;
  }
  if (typeof val === "object") {
    const symbolKeys = Object.getOwnPropertySymbols(val);
    if (symbolKeys.length > 0) {
      throw new Error(`Invalid canonical value at ${path}: symbol keys are not permitted`);
    }
    const record = val as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      validateCanonicalValue(record[key], `${path}.${key}`);
    }
    return;
  }
  throw new Error(`Invalid canonical value at ${path}: unsupported type ${typeof val}`);
}

function serializeValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return val.toString();
  if (typeof val === "string") return JSON.stringify(val);
  if (Array.isArray(val)) {
    return "[" + val.map(serializeValue).join(",") + "]";
  }
  if (typeof val === "object") {
    const record = val as Record<string, unknown>;
    // RFC 8785: Object keys sorted lexicographically by UTF-16 code units
    const sortedKeys = Object.keys(record).sort();
    const entries = sortedKeys.map(k => `${JSON.stringify(k)}:${serializeValue(record[k])}`);
    return "{" + entries.join(",") + "}";
  }
  throw new Error(`Cannot serialize value of type ${typeof val}`);
}

/**
 * Validates the input object according to ZiwaChain canonicalization rules
 * and returns its deterministic RFC 8785 canonical JSON string representation.
 */
export function canonicalJson(value: unknown): string {
  validateCanonicalValue(value);
  return serializeValue(value);
}
