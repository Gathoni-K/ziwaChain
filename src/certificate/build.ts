import { shortCode } from "./shortCode";

/**
 * Base64URL string encoder (Browser and Node compatible).
 */
export function toBase64Url(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64URL string decoder (Browser and Node compatible).
 */
export function fromBase64Url(base64url: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64url, "base64url").toString("utf8");
  }
  let b64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export interface CertificateStage {
  eventType: string;
  payload: object;
  salt: string;
  payloadHash: string;
  txHash: string;
  blockNumber: number;
}

export interface SettlementConfirmationData {
  code: string;
  salt: string;
}

export interface HarvesterCertificate {
  version: 1;
  chainId: string;
  contractAddress: string;
  batchId: string;
  pseudonym: string;
  deploymentBlock: number;
  stages: Record<string, CertificateStage>;
  paymentRef: string;
  settlementConfirmation: SettlementConfirmationData;
  shortCode: string;
  verifyUrl: string;
}

export interface BuildCertificateOptions {
  verifyBaseUrl?: string;
  paymentRef?: string;
  settlementCode?: string;
  chainId?: string;
  contractAddress?: string;
  deploymentBlock?: number;
}

/**
 * Builds a portable Harvester Certificate (JSON Version 1) from demo batch data.
 * Browser-safe with zero Node.js native dependencies.
 */
export function buildCertificate(
  batchData: any,
  options: BuildCertificateOptions = {}
): HarvesterCertificate {
  const chainId = options.chainId || batchData.chainId || "31337";
  const contractAddress = options.contractAddress || batchData.contractAddress || "0x0000000000000000000000000000000000000000";
  const deploymentBlock = Number(options.deploymentBlock ?? batchData.deploymentBlock ?? 0);
  const batchId = batchData.batchId;
  const pseudonym = batchData.pseudonym;
  const rawStages = batchData.stages || {};

  const stages: Record<string, CertificateStage> = {};
  let harvestPayloadHash = "";
  let settlementSalt = "";

  for (const [key, stageObj] of Object.entries<any>(rawStages)) {
    const eventType = stageObj.payload?.eventType || key;
    stages[key] = {
      eventType,
      payload: stageObj.payload,
      salt: stageObj.salt,
      payloadHash: stageObj.hash,
      txHash: stageObj.txHash,
      blockNumber: Number(stageObj.blockNumber)
    };

    if (eventType === "HARVEST_LOGGED") {
      harvestPayloadHash = stageObj.hash;
    }
    if (eventType === "SETTLEMENT_CONFIRMED") {
      settlementSalt = stageObj.salt;
    }
  }

  // Derive human-readable Crockford short code from the harvest payload hash
  const code = harvestPayloadHash ? shortCode(harvestPayloadHash) : "00000-00000";

  // Plain M-Pesa payment reference
  const paymentRef = options.paymentRef || "MPESA-QKH78219XZ-2026";
  const settlementCode = options.settlementCode || "4821";

  const certificateBase: Omit<HarvesterCertificate, "verifyUrl"> = {
    version: 1,
    chainId: String(chainId),
    contractAddress,
    batchId,
    pseudonym,
    deploymentBlock,
    stages,
    paymentRef,
    settlementConfirmation: {
      code: settlementCode,
      salt: settlementSalt
    },
    shortCode: code
  };

  const verifyBaseUrl = options.verifyBaseUrl || "https://ziwachain.org/verify";
  const compactJson = JSON.stringify(certificateBase);
  const base64UrlData = toBase64Url(compactJson);
  const verifyUrl = `${verifyBaseUrl}#c=${base64UrlData}`;

  return {
    ...certificateBase,
    verifyUrl
  };
}
