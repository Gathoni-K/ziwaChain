/**
 * test/sms.test.ts
 *
 * Tests for src/sms/gateway.ts and src/sms/flow.ts.
 * All on-chain assertions use the in-process Hardhat network.
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { maskPhone, SimulatedGateway } from "../src/sms/gateway";
import { SmsFlow, type BatchContext } from "../src/sms/flow";
import { toUtf8Bytes, keccak256 } from "ethers";
import type { ZiwaChain } from "../typechain-types/contracts/ZiwaChain";

// ---------- helpers ----------

const id = (text: string) => ethers.id(text);

/** Deploy a fresh contract and bring batch to Accepted stage. */
async function deployAccepted(): Promise<{
  zc: ZiwaChain;
  relayer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  batchId: string;
}> {
  const [admin, relayer, verifier, buyer] = await ethers.getSigners();
  const zc = (await ethers.deployContract("ZiwaChain", [admin.address])) as unknown as ZiwaChain;
  await zc.grantRole(await zc.RELAYER_ROLE(), relayer.address);
  await zc.grantRole(await zc.VERIFIER_ROLE(), verifier.address);
  await zc.grantRole(await zc.BUYER_ROLE(), buyer.address);

  const batchId = id("sms-test-batch");
  await zc.connect(relayer).logHarvest(
    batchId, id("harvester-sms"), id("hotspot-sms"), 500,
    id("harvest-evidence"), id("harvest-payload")
  );
  await zc.connect(verifier).verifyBatch(batchId, true, id("verify-evidence"), id("verify-payload"));
  await zc.connect(buyer).acceptBatch(batchId, 450, id("mpesa-ref"), id("accept-payload"));

  return { zc, relayer, batchId };
}

/** Build a SmsFlow wired to the contract. Captures sent messages in an array. */
function buildFlow(zc: ZiwaChain, relayer: any) {
  const gateway = new SimulatedGateway();
  const sent: Array<{ to: string; text: string }> = [];

  // Override send to capture messages for assertions.
  const originalSend = gateway.send.bind(gateway);
  gateway.send = async (to: string, text: string) => {
    sent.push({ to, text });
    await originalSend(to, text);
  };

  const flow = new SmsFlow(
    gateway,
    zc,
    async (batchId, confirmationHash, payloadHash) => {
      return zc.connect(relayer).confirmSettlement(batchId, confirmationHash, payloadHash);
    }
  );

  return { flow, gateway, sent };
}

/** Extracts the 4-digit code from the outbound OTP message. */
function extractCode(text: string): string {
  const match = text.match(/Reply YES (\d{4})/);
  if (!match) throw new Error("No OTP found in message: " + text);
  return match[1];
}

// ---------- shared batch context ----------

const HARVESTER_PHONE = "+254712345678";
const BATCH_CONTEXT: Omit<BatchContext, "batchId"> = {
  harvestedKg: 500,
  harvesterPhone: HARVESTER_PHONE,
  mpesaRef: "MPESA-QKH78219XZ-2026",
  certificateShortCode: "TR8NZ-A9VC5",
  verifyUrl: "https://ziwachain.org/verify#c=abc123",
};

// ---------- tests ----------

describe("SMS Flow", () => {

  describe("Phone masking", () => {
    it("masks all but the last 3 digits of a standard phone number", () => {
      expect(maskPhone("+254712345678")).to.equal("+2547****678");
    });

    it("masks a short number without crashing", () => {
      expect(maskPhone("123")).to.equal("****");
    });

    it("does not include the full phone number in the masked output", () => {
      const masked = maskPhone("+254712345678");
      expect(masked).not.to.include("345");
      expect(masked).not.to.include("2345");
    });
  });

  describe("Inbound message parsing", () => {
    it("accepts YES <code> with a matching 4-digit code (case-insensitive)", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      await flow.requestConfirmation(ctx);
      const code = extractCode(sent[0].text);

      // Mixed case, extra spaces.
      await gateway.simulateInbound(HARVESTER_PHONE, `yes  ${code}`);

      const lastMessage = sent[sent.length - 1].text;
      expect(lastMessage).to.include("Confirmed");
      expect(lastMessage).to.include("Reply PROOF");
    });

    it("accepts YES <code> with extra leading and trailing whitespace", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      await flow.requestConfirmation(ctx);
      const code = extractCode(sent[0].text);

      await gateway.simulateInbound(HARVESTER_PHONE, `  YES   ${code}  `);

      const lastMessage = sent[sent.length - 1].text;
      expect(lastMessage).to.include("Confirmed");
    });

    it("rejects a wrong code with a polite error and retry count", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      await flow.requestConfirmation(ctx);
      // Send a wrong code.
      await gateway.simulateInbound(HARVESTER_PHONE, "YES 0000");

      const reply = sent[sent.length - 1].text;
      expect(reply).to.include("did not match");
      expect(reply).to.include("attempt");
    });

    it("ignores messages from an unknown sender phone number", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      await flow.requestConfirmation(ctx);
      const initialCount = sent.length;

      // Different phone number.
      await gateway.simulateInbound("+254700000000", "YES 4821");

      // No reply should have been sent.
      expect(sent.length).to.equal(initialCount);
    });

    it("ignores unrecognised messages silently", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      await flow.requestConfirmation({ batchId, ...BATCH_CONTEXT });
      const before = sent.length;

      await gateway.simulateInbound(HARVESTER_PHONE, "hello");

      expect(sent.length).to.equal(before);
    });
  });

  describe("Settlement on-chain recording", () => {
    it("records confirmSettlement on-chain when the correct code is received", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      await flow.requestConfirmation(ctx);
      const code = extractCode(sent[0].text);

      await gateway.simulateInbound(HARVESTER_PHONE, `YES ${code}`);

      // Verify on-chain: settled flag should be true.
      const batch = await zc.getBatch(batchId);
      expect(batch.settled).to.be.true;
      // confirmationHash on the contract is non-zero.
      expect(batch.settlementConfirmation).to.not.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("refuses a second settlement attempt on the same batch with a graceful reply", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      // First confirmation.
      await flow.requestConfirmation(ctx);
      const code = extractCode(sent[0].text);
      await gateway.simulateInbound(HARVESTER_PHONE, `YES ${code}`);

      // Manually trigger a second request for the same batch (simulates re-entry).
      await flow.requestConfirmation(ctx);
      const code2 = extractCode(sent[sent.length - 1].text);
      await gateway.simulateInbound(HARVESTER_PHONE, `YES ${code2}`);

      // The flow should send a graceful "already confirmed" message, not crash.
      const lastMsg = sent[sent.length - 1].text;
      expect(lastMsg).to.include("already confirmed");
    });

    it("locks out after 3 wrong code attempts and sends a contact message", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      await flow.requestConfirmation({ batchId, ...BATCH_CONTEXT });

      for (let i = 0; i < 3; i++) {
        await gateway.simulateInbound(HARVESTER_PHONE, "YES 0000");
      }

      const lastMsg = sent[sent.length - 1].text;
      expect(lastMsg).to.include("Too many incorrect attempts");
      // Lockout message must not contain the full phone number.
      expect(lastMsg).not.to.include("254712345678");
    });
  });

  describe("PROOF delivery", () => {
    it("sends the short code and verify link after a successful confirmation", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);
      const ctx: BatchContext = { batchId, ...BATCH_CONTEXT };

      await flow.requestConfirmation(ctx);
      const code = extractCode(sent[0].text);
      await gateway.simulateInbound(HARVESTER_PHONE, `YES ${code}`);

      // Now send PROOF.
      await gateway.simulateInbound(HARVESTER_PHONE, "PROOF");

      const proofMsg = sent[sent.length - 1].text;
      expect(proofMsg).to.include(ctx.certificateShortCode);
      expect(proofMsg).to.include(ctx.verifyUrl);
    });

    it("replies with a not-found message when PROOF is sent before settlement", async () => {
      const { zc, relayer, batchId } = await deployAccepted();
      const { flow, gateway, sent } = buildFlow(zc, relayer);

      await gateway.simulateInbound(HARVESTER_PHONE, "PROOF");

      const reply = sent[sent.length - 1].text;
      expect(reply).to.include("No confirmed batch found");
    });
  });
});
