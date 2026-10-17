import { expect } from "chai";
import { ethers } from "hardhat";

// ─── Mirror the contract's Stage enum ────────────────────────────────────────
// BigInt literals (0n, 1n, …) match what ethers v6 returns for uint8 enum fields.
const Stage = {
  None:      0n,
  Harvested: 1n,
  Verified:  2n,
  Rejected:  3n,
  Accepted:  4n,
  Processed: 5n,
  EndUse:    6n,
};

// Shorthand: turn a plain string into a bytes32 keccak256 hash.
// This is how ZiwaClear will generate batchIds, evidenceHashes, etc.
const id = (text: string) => ethers.id(text);

// ─────────────────────────────────────────────────────────────────────────────

describe("ZiwaChain", () => {

  // Deploys a fresh contract and grants every role to a dedicated test account.
  async function deploy() {
    const [admin, relayer, verifier, buyer, processor, stranger] =
      await ethers.getSigners();

    const zc = await ethers.deployContract("ZiwaChain", [admin.address]);

    // Grant roles. DEFAULT_ADMIN_ROLE (admin) can grant everything.
    await zc.grantRole(await zc.RELAYER_ROLE(),    relayer.address);
    await zc.grantRole(await zc.VERIFIER_ROLE(),   verifier.address);
    await zc.grantRole(await zc.BUYER_ROLE(),      buyer.address);
    await zc.grantRole(await zc.PROCESSOR_ROLE(),  processor.address);

    return { zc, admin, relayer, verifier, buyer, processor, stranger };
  }

  // ── Shared test data ───────────────────────────────────────────────────────
  // Using named constants makes test assertions self-documenting.
  const batchId     = id("batch-1");
  const harvesterId = id("harvester-001");   // per-batch pseudonym
  const hotspotRef  = id("hotspot-001");     // off-chain hotspot reference
  const hEvidence   = id("harvest-evidence");
  const hPayload    = id("harvest-payload");

  // ── Shared fixture chain ───────────────────────────────────────────────────
  // Each fixture builds on the previous one so later tests start at the right stage.

  async function harvested() {
    const ctx = await deploy();
    await ctx.zc.connect(ctx.relayer)
      .logHarvest(batchId, harvesterId, hotspotRef, 1000, hEvidence, hPayload);
    return ctx;
  }

  async function verified() {
    const ctx = await harvested();
    await ctx.zc.connect(ctx.verifier)
      .verifyBatch(batchId, true, id("verify-evidence"), id("verify-payload"));
    return ctx;
  }

  async function accepted() {
    const ctx = await verified();
    await ctx.zc.connect(ctx.buyer)
      .acceptBatch(batchId, 900, id("payment-ref"), id("accept-payload"));
    return ctx;
  }

  async function processed() {
    const ctx = await accepted();
    await ctx.zc.connect(ctx.processor)
      .recordProcessing(batchId, id("biogas"), 800, 10, id("process-payload"));
    return ctx;
  }

  async function endUsed() {
    const ctx = await processed();
    await ctx.zc.connect(ctx.processor)
      .recordEndUse(batchId, id("bioenergy"), 400, 5, id("enduse-payload-1"));
    return ctx;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // logHarvest
  // ══════════════════════════════════════════════════════════════════════════

  describe("logHarvest", () => {

    it("lets the relayer log a harvest and sets the correct fields", async () => {
      const { zc, relayer } = await deploy();
      await expect(
        zc.connect(relayer).logHarvest(batchId, harvesterId, hotspotRef, 1000, hEvidence, hPayload)
      ).to.emit(zc, "HarvestLogged");

      const batch = await zc.getBatch(batchId);
      expect(batch.stage).to.equal(Stage.Harvested);
      expect(batch.harvestedKg).to.equal(1000n);
      expect(batch.custodian).to.equal(relayer.address);
      expect(batch.harvesterId).to.equal(harvesterId);
    });

    it("refuses anyone who does not hold RELAYER_ROLE", async () => {
      const { zc, stranger } = await deploy();
      await expect(
        zc.connect(stranger).logHarvest(batchId, harvesterId, hotspotRef, 1000, hEvidence, hPayload)
      ).to.be.revertedWithCustomError(zc, "AccessControlUnauthorizedAccount");
    });

    it("refuses a harvest of zero kg", async () => {
      const { zc, relayer } = await deploy();
      await expect(
        zc.connect(relayer).logHarvest(batchId, harvesterId, hotspotRef, 0, hEvidence, hPayload)
      ).to.be.revertedWithCustomError(zc, "InvalidQuantity");
    });

    it("refuses a batchId that already exists", async () => {
      const { zc, relayer } = await harvested();
      await expect(
        zc.connect(relayer).logHarvest(batchId, harvesterId, hotspotRef, 500, hEvidence, hPayload)
      ).to.be.revertedWithCustomError(zc, "BatchAlreadyExists");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // verifyBatch
  // ══════════════════════════════════════════════════════════════════════════

  describe("verifyBatch", () => {

    it("lets a verifier approve a harvest and advances to Verified", async () => {
      const { zc, verifier } = await harvested();
      await zc.connect(verifier).verifyBatch(batchId, true, id("ve"), id("vp"));
      expect((await zc.getBatch(batchId)).stage).to.equal(Stage.Verified);
    });

    it("lets a verifier reject a harvest and makes Rejected terminal", async () => {
      const { zc, verifier } = await harvested();
      await zc.connect(verifier).verifyBatch(batchId, false, id("ve"), id("vp"));
      expect((await zc.getBatch(batchId)).stage).to.equal(Stage.Rejected);

      // A second call on a rejected batch must fail
      await expect(
        zc.connect(verifier).verifyBatch(batchId, true, id("ve2"), id("vp2"))
      ).to.be.revertedWithCustomError(zc, "WrongStage");
    });

    it("stops a relayer from also acting as verifier (VerifierCannotBeRelayer)", async () => {
      const { zc, relayer } = await harvested();
      // Grant the relayer the verifier role too — the contract should still block this
      await zc.grantRole(await zc.VERIFIER_ROLE(), relayer.address);
      await expect(
        zc.connect(relayer).verifyBatch(batchId, true, id("ve"), id("vp"))
      ).to.be.revertedWithCustomError(zc, "VerifierCannotBeRelayer");
    });

    it("refuses a batch that does not exist", async () => {
      const { zc, verifier } = await deploy();
      await expect(
        zc.connect(verifier).verifyBatch(id("no-such-batch"), true, id("ve"), id("vp"))
      ).to.be.revertedWithCustomError(zc, "UnknownBatch");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // acceptBatch
  // ══════════════════════════════════════════════════════════════════════════

  describe("acceptBatch", () => {

    it("lets a buyer accept a verified batch and records buyer + acceptedKg", async () => {
      const { zc, buyer } = await verified();
      await expect(
        zc.connect(buyer).acceptBatch(batchId, 900, id("payment-ref"), id("accept-payload"))
      ).to.emit(zc, "BatchAccepted");

      const batch = await zc.getBatch(batchId);
      expect(batch.stage).to.equal(Stage.Accepted);
      expect(batch.acceptedKg).to.equal(900n);
      expect(batch.buyer).to.equal(buyer.address);
    });

    it("refuses anyone without BUYER_ROLE", async () => {
      const { zc, stranger } = await verified();
      await expect(
        zc.connect(stranger).acceptBatch(batchId, 900, id("payment-ref"), id("accept-payload"))
      ).to.be.revertedWithCustomError(zc, "AccessControlUnauthorizedAccount");
    });

    it("refuses acceptance when the batch is not at stage Verified", async () => {
      const { zc, buyer } = await harvested();  // still Harvested
      await expect(
        zc.connect(buyer).acceptBatch(batchId, 900, id("payment-ref"), id("accept-payload"))
      ).to.be.revertedWithCustomError(zc, "WrongStage");
    });

    it("refuses acceptedKg that exceeds harvestedKg (mass balance)", async () => {
      const { zc, buyer } = await verified();
      await expect(
        zc.connect(buyer).acceptBatch(batchId, 9999, id("payment-ref"), id("accept-payload"))
      ).to.be.revertedWithCustomError(zc, "MassBalanceViolation");
    });

    it("refuses an acceptedKg of zero", async () => {
      const { zc, buyer } = await verified();
      await expect(
        zc.connect(buyer).acceptBatch(batchId, 0, id("payment-ref"), id("accept-payload"))
      ).to.be.revertedWithCustomError(zc, "InvalidQuantity");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // confirmSettlement
  // ══════════════════════════════════════════════════════════════════════════

  describe("confirmSettlement", () => {

    it("lets the relayer confirm settlement after acceptance and marks batch settled", async () => {
      const { zc, relayer } = await accepted();
      await expect(
        zc.connect(relayer).confirmSettlement(batchId, id("yes-4821"), id("settlement-payload"))
      ).to.emit(zc, "SettlementConfirmed");

      const batch = await zc.getBatch(batchId);
      expect(batch.settled).to.be.true;
      expect(batch.settlementConfirmation).to.equal(id("yes-4821"));
    });

    it("lets the relayer confirm settlement after processing (stage need not be Accepted)", async () => {
      const { zc, relayer } = await processed();
      await expect(
        zc.connect(relayer).confirmSettlement(batchId, id("yes-4821"), id("settlement-payload"))
      ).to.emit(zc, "SettlementConfirmed");
    });

    it("lets the relayer confirm settlement even after end use", async () => {
      const { zc, relayer } = await endUsed();
      await expect(
        zc.connect(relayer).confirmSettlement(batchId, id("yes-4821"), id("settlement-payload"))
      ).to.emit(zc, "SettlementConfirmed");
    });

    it("refuses a second confirmSettlement on the same batch (AlreadySettled)", async () => {
      const { zc, relayer } = await accepted();
      await zc.connect(relayer).confirmSettlement(batchId, id("yes-4821"), id("settlement-payload"));
      await expect(
        zc.connect(relayer).confirmSettlement(batchId, id("yes-again"), id("s2"))
      ).to.be.revertedWithCustomError(zc, "AlreadySettled");
    });

    it("refuses confirmation when the batch is at stage Harvested (WrongStage)", async () => {
      const { zc, relayer } = await harvested();
      await expect(
        zc.connect(relayer).confirmSettlement(batchId, id("yes-4821"), id("settlement-payload"))
      ).to.be.revertedWithCustomError(zc, "WrongStage");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // recordProcessing
  // ══════════════════════════════════════════════════════════════════════════

  describe("recordProcessing", () => {

    it("lets a processor record processing and stores processor + processedKg", async () => {
      const { zc, processor } = await accepted();
      await expect(
        zc.connect(processor).recordProcessing(batchId, id("biogas"), 800, 10, id("process-payload"))
      ).to.emit(zc, "BatchProcessed");

      const batch = await zc.getBatch(batchId);
      expect(batch.stage).to.equal(Stage.Processed);
      expect(batch.processedKg).to.equal(800n);
      expect(batch.processor).to.equal(processor.address);
    });

    it("refuses anyone without PROCESSOR_ROLE", async () => {
      const { zc, stranger } = await accepted();
      await expect(
        zc.connect(stranger).recordProcessing(batchId, id("biogas"), 800, 10, id("process-payload"))
      ).to.be.revertedWithCustomError(zc, "AccessControlUnauthorizedAccount");
    });

    it("refuses inputKg that exceeds acceptedKg (mass balance)", async () => {
      const { zc, processor } = await accepted();
      // acceptedKg = 900; trying to process 9999
      await expect(
        zc.connect(processor).recordProcessing(batchId, id("biogas"), 9999, 10, id("process-payload"))
      ).to.be.revertedWithCustomError(zc, "MassBalanceViolation");
    });

    it("refuses processing when batch is not at stage Accepted", async () => {
      const { zc, processor } = await verified();  // Verified, not Accepted
      await expect(
        zc.connect(processor).recordProcessing(batchId, id("biogas"), 500, 5, id("process-payload"))
      ).to.be.revertedWithCustomError(zc, "WrongStage");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // recordEndUse
  // ══════════════════════════════════════════════════════════════════════════

  describe("recordEndUse", () => {

    it("lets the processor record end use and advances stage to EndUse", async () => {
      const { zc, processor } = await processed();
      await expect(
        zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 400, 5, id("eu-payload"))
      ).to.emit(zc, "EndUseRecorded");

      const batch = await zc.getBatch(batchId);
      expect(batch.stage).to.equal(Stage.EndUse);
      expect(batch.endUseKgTotal).to.equal(400n);
    });

    it("accumulates endUseKgTotal across multiple partial calls", async () => {
      const { zc, processor } = await processed();
      // processedKg = 800; split into two calls
      await zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 300, 3, id("eu1"));
      await zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 200, 2, id("eu2"));
      expect((await zc.getBatch(batchId)).endUseKgTotal).to.equal(500n);
    });

    it("mints one WORK_CREDIT per kg to the custodian and emits CreditsIssued", async () => {
      const { zc, processor, relayer } = await processed();
      await expect(
        zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 400, 5, id("eu-payload"))
      )
        .to.emit(zc, "CreditsIssued")
        .withArgs(batchId, harvesterId, 400n);

      // Custodian (relayer) holds the minted ERC-1155 tokens
      expect(await zc.balanceOf(relayer.address, 1n)).to.equal(400n);
    });

    it("tracks credits per harvesterId via workCreditsOf", async () => {
      const { zc, processor } = await processed();
      await zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 400, 5, id("eu-payload"));
      expect(await zc.workCreditsOf(harvesterId)).to.equal(400n);
    });

    it("accumulates workCreditsOf across multiple end-use calls for the same harvesterId", async () => {
      const { zc, processor } = await processed();
      await zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 300, 3, id("eu1"));
      await zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 200, 2, id("eu2"));
      expect(await zc.workCreditsOf(harvesterId)).to.equal(500n);
    });

    it("refuses recordEndUse from a different PROCESSOR_ROLE address (NotBatchProcessor)", async () => {
      const { zc, admin } = await processed();
      // Grant processor role to admin — but the stored processor for this batch is someone else
      await zc.grantRole(await zc.PROCESSOR_ROLE(), admin.address);
      await expect(
        zc.connect(admin).recordEndUse(batchId, id("bioenergy"), 400, 5, id("eu-payload"))
      ).to.be.revertedWithCustomError(zc, "NotBatchProcessor");
    });

    it("refuses endUseKg that would push endUseKgTotal above processedKg (mass balance)", async () => {
      const { zc, processor } = await processed();
      // processedKg = 800; trying to record 9999
      await expect(
        zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 9999, 5, id("eu-payload"))
      ).to.be.revertedWithCustomError(zc, "MassBalanceViolation");
    });

    it("refuses cumulative end-use that exceeds processedKg", async () => {
      const { zc, processor } = await processed();
      // processedKg = 800; first call takes 700, second tries 200 (total 900 > 800)
      await zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 700, 7, id("eu1"));
      await expect(
        zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 200, 2, id("eu2"))
      ).to.be.revertedWithCustomError(zc, "MassBalanceViolation");
    });

    it("refuses end use at the wrong stage (Accepted, not Processed)", async () => {
      const { zc, processor } = await accepted();
      await expect(
        zc.connect(processor).recordEndUse(batchId, id("bioenergy"), 400, 5, id("eu-payload"))
      ).to.be.revertedWithCustomError(zc, "WrongStage");
    });

    it("reverts recordEndUse with ERC1155InvalidReceiver if contract custodian lacks receiver (Item 9f)", async () => {
      const { zc, admin, verifier, buyer, processor } = await deploy();
      const plainRelayerFactory = await ethers.getContractFactory("PlainRelayer");
      const plainRelayer = await plainRelayerFactory.deploy();
      await plainRelayer.waitForDeployment();
      const relayerAddress = await plainRelayer.getAddress();

      // Grant RELAYER_ROLE to the PlainRelayer contract
      await zc.connect(admin).grantRole(await zc.RELAYER_ROLE(), relayerAddress);

      const contractBatchId = id("contract-custodian-batch");
      await plainRelayer.logHarvest(
        zc,
        contractBatchId,
        id("harvester-contract"),
        id("hotspot-contract"),
        1000,
        id("ev-contract"),
        id("pl-contract")
      );

      // Verify, accept, process
      await zc.connect(verifier).verifyBatch(contractBatchId, true, id("v-ev"), id("v-pl"));
      await zc.connect(buyer).acceptBatch(contractBatchId, 800, id("pay-ref"), id("a-pl"));
      await zc.connect(processor).recordProcessing(contractBatchId, id("biogas"), 800, 10, id("p-pl"));

      // Attempting to record end use mints to plainRelayer which has no onERC1155Received
      await expect(
        zc.connect(processor).recordEndUse(contractBatchId, id("bioenergy"), 400, 5, id("eu-pl"))
      ).to.be.revertedWithCustomError(zc, "ERC1155InvalidReceiver");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // correctRecord
  // ══════════════════════════════════════════════════════════════════════════

  describe("correctRecord", () => {

    it("lets the original hash author correct a hash and records the supersession", async () => {
      // hEvidence was recorded by the relayer in logHarvest; relayer can correct it
      const { zc, relayer } = await harvested();
      const newHash = id("corrected-evidence");
      await expect(
        zc.connect(relayer).correctRecord(batchId, hEvidence, newHash, id("typo-in-field"))
      ).to.emit(zc, "RecordCorrected");

      expect(await zc.supersededBy(batchId, hEvidence)).to.equal(newHash);
    });

    it("refuses a hash that was never recorded for this batch (HashNotFound)", async () => {
      const { zc, relayer } = await harvested();
      await expect(
        zc.connect(relayer).correctRecord(batchId, id("ghost-hash"), id("new-hash"), id("reason"))
      ).to.be.revertedWithCustomError(zc, "HashNotFound");
    });

    it("refuses correction by an address that is not the original author (NotHashAuthor)", async () => {
      // hEvidence was authored by the relayer; the verifier did not record it
      const { zc, verifier } = await harvested();
      await expect(
        zc.connect(verifier).correctRecord(batchId, hEvidence, id("new-hash"), id("reason"))
      ).to.be.revertedWithCustomError(zc, "NotHashAuthor");
    });

    it("refuses correcting a hash that has already been superseded (HashAlreadySuperseded)", async () => {
      const { zc, relayer } = await harvested();
      await zc.connect(relayer).correctRecord(batchId, hEvidence, id("first-correction"), id("reason"));
      // Try to supersede hEvidence a second time
      await expect(
        zc.connect(relayer).correctRecord(batchId, hEvidence, id("second-correction"), id("reason"))
      ).to.be.revertedWithCustomError(zc, "HashAlreadySuperseded");
    });

    it("refuses reusing an already-registered hash as the replacement (CannotReuseHash)", async () => {
      // hPayload is already registered for this batch; it cannot be used as newHash
      const { zc, relayer } = await harvested();
      await expect(
        zc.connect(relayer).correctRecord(batchId, hEvidence, hPayload, id("reason"))
      ).to.be.revertedWithCustomError(zc, "CannotReuseHash");
    });

    it("refuses newHash == bytes32(0) with InvalidHash (Item 9e)", async () => {
      const { zc, relayer } = await harvested();
      await expect(
        zc.connect(relayer).correctRecord(batchId, hEvidence, ethers.ZeroHash, id("reason"))
      ).to.be.revertedWithCustomError(zc, "InvalidHash");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // Non-transferability
  // ══════════════════════════════════════════════════════════════════════════

  describe("work credit non-transferability", () => {

    it("blocks safeTransferFrom for work credits", async () => {
      const { zc, relayer, admin } = await endUsed();
      // relayer holds 400 credits minted in the endUsed fixture
      await expect(
        zc.connect(relayer).safeTransferFrom(relayer.address, admin.address, 1n, 1n, "0x")
      ).to.be.revertedWithCustomError(zc, "NonTransferable");
    });

    it("blocks safeBatchTransferFrom for work credits", async () => {
      const { zc, relayer, admin } = await endUsed();
      await expect(
        zc.connect(relayer).safeBatchTransferFrom(relayer.address, admin.address, [1n], [1n], "0x")
      ).to.be.revertedWithCustomError(zc, "NonTransferable");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // View helpers
  // ══════════════════════════════════════════════════════════════════════════

  describe("view helpers", () => {

    it("getBatch reverts with UnknownBatch for an unrecognised batchId", async () => {
      const { zc } = await deploy();
      await expect(
        zc.getBatch(id("nobody"))
      ).to.be.revertedWithCustomError(zc, "UnknownBatch");
    });

    it("supersededBy returns the replacement hash after a correction", async () => {
      const { zc, relayer } = await harvested();
      const replacement = id("corrected-evidence");
      await zc.connect(relayer).correctRecord(batchId, hEvidence, replacement, id("reason"));
      expect(await zc.supersededBy(batchId, hEvidence)).to.equal(replacement);
    });

    it("supersededBy returns bytes32(0) for an un-superseded hash", async () => {
      const { zc } = await harvested();
      expect(await zc.supersededBy(batchId, hEvidence)).to.equal(ethers.ZeroHash);
    });

    it("workCreditsOf returns 0 for a harvesterId that has no credits yet", async () => {
      const { zc } = await deploy();
      expect(await zc.workCreditsOf(id("unknown-harvester"))).to.equal(0n);
    });

  });

});