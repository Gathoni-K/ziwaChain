/**
 * scripts/demo-sms.ts
 *
 * Demonstrates the full SMS settlement and PROOF conversation against a fresh
 * Hardhat in-process network. Run with:
 *
 *   npx hardhat run scripts/demo-sms.ts
 *
 * What it does:
 *   1. Deploys ZiwaChain and grants roles.
 *   2. Runs a batch from logHarvest through acceptBatch.
 *   3. Sends the settlement OTP SMS to the harvester.
 *   4. Simulates the harvester replying YES <code>.
 *   5. Prints the on-chain confirmSettlement transaction hash.
 *   6. Simulates the harvester sending PROOF.
 *   7. Prints the certificate short code and verify link.
 */

import { ethers } from "hardhat";
import { hashRecord } from "../src/hashing/hash";
import { newSalt } from "../src/hashing/salt";
import { shortCode } from "../src/certificate/shortCode";
import { SimulatedGateway } from "../src/sms/gateway";
import { SmsFlow, type BatchContext } from "../src/sms/flow";
import type { ZiwaChain } from "../typechain-types/contracts/ZiwaChain";

// Helper: bytes32 from an arbitrary string.
const id = (text: string) => ethers.id(text);

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  ZiwaChain: Simulated SMS Settlement and PROOF Demo");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── 1. Deploy and grant roles ──────────────────────────────────────────────
  const [admin, relayer, verifier, buyer] = await ethers.getSigners();
  const zc = (await ethers.deployContract("ZiwaChain", [admin.address])) as unknown as ZiwaChain;
  await zc.grantRole(await zc.RELAYER_ROLE(), relayer.address);
  await zc.grantRole(await zc.VERIFIER_ROLE(), verifier.address);
  await zc.grantRole(await zc.BUYER_ROLE(), buyer.address);

  console.log(`  Contract deployed: ${await zc.getAddress()}`);
  console.log(`  Relayer:           ${relayer.address}`);

  // ── 2. Run batch to Accepted ───────────────────────────────────────────────
  const batchId = id("demo-sms-batch-2026");
  const harvestKg = 750;
  const acceptedKg = 700;

  // Build and hash a real harvest payload (same as seed.ts and verify page).
  const harvestSalt = newSalt();
  const harvestPayload = {
    schemaVersion: 1,
    eventType: "HARVEST_LOGGED",
    batchId,
    hotspotRef: id("hotspot-kisi-001"),
    quantityKg: harvestKg,
    harvestedAt: Math.floor(Date.now() / 1000),
    region: "Kisi Landing Site",
    source: "ziwaclear-v1",
  };
  const harvestHash = hashRecord(harvestPayload, harvestSalt);

  const harvestTx = await zc.connect(relayer).logHarvest(
    batchId, id("harvester-demo"), id("hotspot-kisi-001"), harvestKg,
    id("harvest-evidence"), harvestHash
  );
  await harvestTx.wait();
  console.log(`\n  logHarvest:       tx ${harvestTx.hash}`);

  const verifyTx = await zc.connect(verifier).verifyBatch(
    batchId, true, id("verify-evidence"), id("verify-payload")
  );
  await verifyTx.wait();
  console.log(`  verifyBatch:      tx ${verifyTx.hash}`);

  const mpesaRef = "MPESA-QKH78219XZ-2026";
  const paymentRefHash = id(mpesaRef);
  const acceptTx = await zc.connect(buyer).acceptBatch(
    batchId, acceptedKg, paymentRefHash, id("accept-payload")
  );
  await acceptTx.wait();
  console.log(`  acceptBatch:      tx ${acceptTx.hash} (${acceptedKg} kg accepted)`);

  // ── 3. Set up the SMS flow ─────────────────────────────────────────────────
  const harvesterPhone = "+254712345678";
  const certShortCode = shortCode(harvestHash);
  const verifyUrl = `https://ziwachain.org/verify#c=demoBase64UrlData`;

  const gateway = new SimulatedGateway("ZiwaClear");

  // Capture the outbound OTP so we can echo it back as the harvester's reply.
  let capturedCode = "";
  const originalSend = gateway.send.bind(gateway);
  gateway.send = async (to: string, text: string) => {
    await originalSend(to, text);
    const match = text.match(/Reply YES (\d{4})/);
    if (match) capturedCode = match[1];
  };

  const flow = new SmsFlow(
    gateway,
    zc,
    async (bId, confirmationHash, payloadHash) => {
      return zc.connect(relayer).confirmSettlement(bId, confirmationHash, payloadHash);
    }
  );

  const ctx: BatchContext = {
    batchId,
    harvestedKg: harvestKg,
    harvesterPhone,
    mpesaRef,
    certificateShortCode: certShortCode,
    verifyUrl,
  };

  // ── 4. Send OTP ────────────────────────────────────────────────────────────
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  SMS Conversation");
  console.log("───────────────────────────────────────────────────────────────");

  await flow.requestConfirmation(ctx);

  // ── 5. Harvester replies with the correct code ─────────────────────────────
  await gateway.simulateInbound(harvesterPhone, `YES ${capturedCode}`);

  // ── 6. Verify on-chain ─────────────────────────────────────────────────────
  const batch = await zc.getBatch(batchId);
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  On-Chain Result");
  console.log("───────────────────────────────────────────────────────────────");
  console.log(`  settled:               ${batch.settled}`);
  console.log(`  settlementConfirmation: ${batch.settlementConfirmation}`);

  // ── 7. Harvester sends PROOF ───────────────────────────────────────────────
  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  PROOF Request");
  console.log("───────────────────────────────────────────────────────────────");
  await gateway.simulateInbound(harvesterPhone, "PROOF");

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Demo complete. Batch is settled and certificate is delivered.");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
