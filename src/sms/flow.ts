/**
 * ZiwaChain SMS settlement and PROOF flow.
 *
 * Two conversation legs:
 *   1. Settlement confirmation: harvester replies "YES <code>" after buyer acceptance.
 *   2. PROOF request: harvester sends "PROOF" and receives the short code and verify link.
 *
 * Plug-in points for the real ZiwaClear backend are marked with PLUG-IN comments.
 */

import type { ContractTransactionResponse } from "ethers";
import type { ZiwaChain } from "../../typechain-types/contracts/ZiwaChain";
import { hashConfirmation, hashRecord } from "../hashing/hash";
import { newSalt } from "../hashing/salt";
import { SettlementConfirmationPayload } from "../hashing/types";
import { maskPhone, type SmsGateway } from "./gateway";

/** Minimal shape that flow.ts needs from a batch. */
export interface BatchContext {
  batchId: string;
  harvestedKg: number;
  harvesterPhone: string;
  mpesaRef: string;
  /** Short code derived from harvest payload hash (from certificate). */
  certificateShortCode: string;
  /** Verify URL for the batch certificate. */
  verifyUrl: string;
  /** Salt used for the settlement confirmation payload. */
  settlementSalt?: string;
  /** Canonical settlement confirmation payload. */
  settlementPayload?: SettlementConfirmationPayload;
}

/** Internal per-batch state kept in memory for the duration of the conversation. */
interface PendingConfirmation {
  batchId: string;
  phone: string;
  code: string;
  batchContext: BatchContext;
  attempts: number;
}

const MAX_RETRIES = 3;

export class SmsFlow {
  private gateway: SmsGateway;
  private contract: ZiwaChain;
  private relayerSendTx: (
    batchId: string,
    confirmationHash: string,
    payloadHash: string
  ) => Promise<ContractTransactionResponse>;

  // batchId -> pending confirmation state
  private pending = new Map<string, PendingConfirmation>();

  /**
   * @param gateway  SMS gateway (simulated or real).
   * @param contract ZiwaChain contract instance connected to the relayer signer.
   * @param relayerSendTx
   *   Function that calls confirmSettlement on the contract.
   *   Injected so tests can swap in a mock; production passes the TypeChain method directly.
   *
   * PLUG-IN: In the real ZiwaClear backend, pass the contract instance wired to the
   * relayer's wallet (loaded from KMS or env), and pass `contract.confirmSettlement`
   * as the third argument. The SMS gateway is the Africa's Talking or Twilio adapter.
   */
  constructor(
    gateway: SmsGateway,
    contract: ZiwaChain,
    relayerSendTx: (
      batchId: string,
      confirmationHash: string,
      payloadHash: string
    ) => Promise<ContractTransactionResponse>
  ) {
    this.gateway = gateway;
    this.contract = contract;
    this.relayerSendTx = relayerSendTx;
    this.gateway.onReceive((from, text) => this.handleIncoming(from, text));
  }

  /**
   * Step 1: After buyer acceptance, send a 4-digit OTP to the harvester.
   * Stores the code in memory. Does not touch the chain.
   *
   * PLUG-IN: In production, call this immediately after the buyer's
   * `acceptBatch` transaction is confirmed. Retrieve the harvester phone
   * number from the ZiwaClear database using `batch.batchId`.
   */
  async requestConfirmation(batch: BatchContext): Promise<void> {
    const code = generateCode();
    this.pending.set(batch.batchId, {
      batchId: batch.batchId,
      phone: batch.harvesterPhone,
      code,
      batchContext: batch,
      attempts: 0,
    });

    await this.gateway.send(
      batch.harvesterPhone,
      `ZiwaClear: Your batch of ${batch.harvestedKg} kg was accepted.\n` +
        `Reply YES ${code} to confirm you were paid.\n` +
        `Ref ${batch.mpesaRef}.`
    );
  }

  /**
   * Step 2: Handle an inbound SMS from the harvester.
   * Routes to settlement confirmation or PROOF delivery.
   *
   * PLUG-IN: Wire this to the webhook that your SMS provider posts inbound
   * messages to. Call `flow.handleIncoming(from, body)` from the webhook handler.
   */
  async handleIncoming(from: string, text: string): Promise<void> {
    const normalised = text.trim().toUpperCase().replace(/\s+/g, " ");

    // Route PROOF requests independently of pending settlement state.
    if (normalised === "PROOF") {
      await this.handleProofRequest(from);
      return;
    }

    // Route YES <code> replies.
    const yesMatch = normalised.match(/^YES\s+(\d{4})$/);
    if (yesMatch) {
      await this.handleYesReply(from, yesMatch[1]);
      return;
    }

    // Unrecognised message: ignore silently (do not leak information about
    // which numbers have pending confirmations).
  }

  // ---------- private helpers ----------

  private async handleYesReply(from: string, receivedCode: string): Promise<void> {
    // Find the pending confirmation for this phone number.
    const entry = this.findPendingByPhone(from);
    if (!entry) {
      // Wrong sender or no pending confirmation. Ignore silently.
      return;
    }

    const batchId = entry.value.batchId || entry.key;
    const { code, batchContext } = entry.value;

    entry.value.attempts += 1;

    if (receivedCode !== code) {
      if (entry.value.attempts >= MAX_RETRIES) {
        this.pending.delete(batchId);
        await this.gateway.send(
          from,
          `ZiwaClear: Too many incorrect attempts. Please call us on 0700 123 456 to resolve your payment for batch ${batchId}.`
        );
      } else {
        const remaining = MAX_RETRIES - entry.value.attempts;
        await this.gateway.send(
          from,
          `ZiwaClear: Code did not match. You have ${remaining} attempt(s) remaining. Reply YES <code>.`
        );
      }
      return;
    }

    // Code matched. Compute hash and record on-chain.
    const salt = newSalt();
    const confirmationHash = hashConfirmation(receivedCode, salt);

    // Canonical SettlementConfirmationPayload event envelope
    const now = Math.floor(Date.now() / 1000);
    const settlementPayload: SettlementConfirmationPayload = {
      schemaVersion: 1,
      eventType: "SETTLEMENT_CONFIRMED",
      batchId,
      confirmationHash,
      confirmedAt: now
    };
    const payloadHash = hashRecord(settlementPayload, salt);

    // Retain salt and payload in batch context so a certificate can include them.
    batchContext.settlementSalt = salt;
    batchContext.settlementPayload = settlementPayload;

    let txHash: string;
    try {
      const tx = await this.relayerSendTx(batchId, confirmationHash, payloadHash);
      await tx.wait();
      txHash = tx.hash;
    } catch (err: any) {
      // If the contract reverts because it was already settled, handle gracefully.
      if (err?.message?.includes("AlreadySettled")) {
        await this.gateway.send(
          from,
          `ZiwaClear: This batch was already confirmed. Reply PROOF to get your certificate.`
        );
        this.pending.delete(batchId);
        return;
      }
      throw err;
    }

    this.pending.delete(batchId);

    await this.gateway.send(
      from,
      `ZiwaClear: Confirmed. Your payment for ${batchContext.harvestedKg} kg is recorded.\n` +
        `Tx: ${txHash.slice(0, 10)}...\n` +
        `Reply PROOF to get your certificate.`
    );

    // Store the batchId against the phone so PROOF can look it up.
    this.storeProofReady(from, batchContext);
  }

  // batchId -> batch context, keyed by phone for PROOF lookup.
  private proofReady = new Map<string, BatchContext>();

  private storeProofReady(phone: string, ctx: BatchContext): void {
    this.proofReady.set(phone, ctx);
  }

  private async handleProofRequest(from: string): Promise<void> {
    const ctx = this.proofReady.get(from);
    if (!ctx) {
      await this.gateway.send(
        from,
        `ZiwaClear: No confirmed batch found for your number. Complete your settlement first.`
      );
      return;
    }

    await this.gateway.send(
      from,
      `ZiwaClear: Your certificate code is ${ctx.certificateShortCode}.\n` +
        `Verify at: ${ctx.verifyUrl}`
    );
  }

  /** Finds the pending confirmation entry whose phone matches `from`. */
  private findPendingByPhone(
    from: string
  ): { key: string; value: PendingConfirmation } | undefined {
    for (const [key, value] of this.pending.entries()) {
      if (value.phone === from) {
        return { key, value };
      }
    }
    return undefined;
  }
}

/**
 * Generates a 4-digit numeric OTP, zero-padded.
 * In production, use a cryptographically random source (e.g. crypto.randomInt).
 */
function generateCode(): string {
  // Use crypto.getRandomValues if available (browser + Node 19+), else Math.random.
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return String(buf[0] % 10000).padStart(4, "0");
  }
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}
