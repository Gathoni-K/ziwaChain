import { expect } from "chai";
import { ethers } from "hardhat";

// The same numbers as the Stage list in the contract
const Stage = { None: 0, Harvested: 1, Verified: 2, Rejected: 3 };

// Turns any text into a 32-byte value, like a batch ID
const id = (text: string) => ethers.id(text);

describe("ZiwaChain", () => {
  // Sets up a fresh contract with a relayer and a verifier for every test
  async function deploy() {
    const [admin, relayer, verifier, stranger] = await ethers.getSigners();
    const zc = await ethers.deployContract("ZiwaChain", [admin.address]);

    await zc.grantRole(await zc.RELAYER_ROLE(), relayer.address);
    await zc.grantRole(await zc.VERIFIER_ROLE(), verifier.address);

    return { zc, admin, relayer, verifier, stranger };
  }

  const batchId = id("batch-1");
  const harvesterId = id("harvester-001");
  const hotspotRef = id("hotspot-001");
  const h = id("hash"); // stands in for evidence and payload hashes

  // A deployed contract with one harvest already logged
  async function harvested() {
    const ctx = await deploy();
    await ctx.zc
      .connect(ctx.relayer)
      .logHarvest(batchId, harvesterId, hotspotRef, 1000, h, h);
    return ctx;
  }

  describe("logging a harvest", () => {
    it("lets the relayer log a harvest", async () => {
      const { zc, relayer } = await deploy();
      await expect(
        zc.connect(relayer).logHarvest(batchId, harvesterId, hotspotRef, 1000, h, h)
      ).to.emit(zc, "HarvestLogged");

      const batch = await zc.getBatch(batchId);
      expect(batch.stage).to.equal(Stage.Harvested);
      expect(batch.harvestedKg).to.equal(1000);
    });

    it("refuses anyone who is not the relayer", async () => {
      const { zc, stranger } = await deploy();
      await expect(
        zc.connect(stranger).logHarvest(batchId, harvesterId, hotspotRef, 1000, h, h)
      ).to.be.revertedWithCustomError(zc, "AccessControlUnauthorizedAccount");
    });

    it("refuses a harvest of zero kg", async () => {
      const { zc, relayer } = await deploy();
      await expect(
        zc.connect(relayer).logHarvest(batchId, harvesterId, hotspotRef, 0, h, h)
      ).to.be.revertedWithCustomError(zc, "InvalidQuantity");
    });

    it("refuses a batch ID that already exists", async () => {
      const { zc, relayer } = await harvested();
      await expect(
        zc.connect(relayer).logHarvest(batchId, harvesterId, hotspotRef, 10, h, h)
      ).to.be.revertedWithCustomError(zc, "BatchAlreadyExists");
    });
  });

  describe("verifying a harvest", () => {
    it("lets a verifier approve a harvest", async () => {
      const { zc, verifier } = await harvested();
      await zc.connect(verifier).verifyBatch(batchId, true, h, h);
      expect((await zc.getBatch(batchId)).stage).to.equal(Stage.Verified);
    });

    it("makes a rejection final", async () => {
      const { zc, verifier } = await harvested();
      await zc.connect(verifier).verifyBatch(batchId, false, h, h);
      expect((await zc.getBatch(batchId)).stage).to.equal(Stage.Rejected);

      await expect(
        zc.connect(verifier).verifyBatch(batchId, true, h, h)
      ).to.be.revertedWithCustomError(zc, "WrongStage");
    });

    it("stops a relayer from verifying its own submissions", async () => {
      const { zc, relayer } = await harvested();
      await zc.grantRole(await zc.VERIFIER_ROLE(), relayer.address);
      await expect(
        zc.connect(relayer).verifyBatch(batchId, true, h, h)
      ).to.be.revertedWithCustomError(zc, "VerifierCannotBeRelayer");
    });

    it("refuses a batch that does not exist", async () => {
      const { zc, verifier } = await deploy();
      await expect(
        zc.connect(verifier).verifyBatch(id("nope"), true, h, h)
      ).to.be.revertedWithCustomError(zc, "UnknownBatch");
    });
  });
});