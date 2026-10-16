/**
 * Canonical payload interfaces for ZiwaChain provenance events.
 *
 * Privacy rule: Personal Identifiable Information (PII) such as personal names,
 * phone numbers, exact GPS coordinates, and raw financial balances MUST NOT
 * be included in any payload type.
 */

export interface BasePayload {
  schemaVersion: 1;
  eventType: string;
  batchId: string;
}

export interface HarvestPayload extends BasePayload {
  schemaVersion: 1;
  eventType: "HARVEST_LOGGED";
  batchId: string;
  hotspotRef: string;
  quantityKg: number;
  harvestedAt: number;
  region: string;
  source: string;
}

export interface VerifyPayload extends BasePayload {
  schemaVersion: 1;
  eventType: "VERIFIED";
  batchId: string;
  verifier: string;
  approved: boolean;
  verifiedAt: number;
  method: string;
}

export interface BuyerAcceptancePayload extends BasePayload {
  schemaVersion: 1;
  eventType: "BUYER_ACCEPTED";
  batchId: string;
  buyer: string;
  acceptedKg: number;
  paymentRefHash: string;
  acceptedAt: number;
}

export interface SettlementConfirmationPayload extends BasePayload {
  schemaVersion: 1;
  eventType: "SETTLEMENT_CONFIRMED";
  batchId: string;
  confirmationHash: string;
  confirmedAt: number;
}

export interface ProcessingPayload extends BasePayload {
  schemaVersion: 1;
  eventType: "PROCESSED";
  batchId: string;
  processor: string;
  processType: string;
  inputKg: number;
  outputUnits: number;
  processedAt: number;
}

export interface EndUsePayload extends BasePayload {
  schemaVersion: 1;
  eventType: "END_USE";
  batchId: string;
  processor: string;
  endUseType: string;
  endUseKg: number;
  outputUnits: number;
  endUseAt: number;
}

export type StagePayload =
  | HarvestPayload
  | VerifyPayload
  | BuyerAcceptancePayload
  | SettlementConfirmationPayload
  | ProcessingPayload
  | EndUsePayload;
