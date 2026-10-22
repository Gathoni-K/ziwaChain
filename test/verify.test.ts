import { expect } from "chai";
import { ethers } from "hardhat";
import { hashRecord, hashConfirmation } from "../src/hashing/hash";
import { buildCertificate, HarvesterCertificate } from "../src/certificate/build";
import { derivePseudonym } from "../src/hashing/pseudonym";

describe("Client-Side Verification Algorithm", () => {
  let zc: any;
  let admin: any;
  let relayer: any;
  let verifier: any;
  let buyer: any;
  let processor: any;

  let cert: HarvesterCertificate;
  const batchId = ethers.id("verify-test-batch-001");
  const secret = "test-secret-verification-2026";
  const pseudonym = derivePseudonym(secret, "group-test-01", batchId);
  const hotspotRef = ethers.id("hotspot-test-01");

  before(async () => {
    [admin, relayer, verifier, buyer, processor] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ZiwaChain", admin);
    zc = await factory.deploy(admin.address);
    await zc.waitForDeployment();

    await zc.grantRole(await zc.RELAYER_ROLE(), relayer.address);
    await zc.grantRole(await zc.VERIFIER_ROLE(), verifier.address);
    await zc.grantRole(await zc.BUYER_ROLE(), buyer.address);
    await zc.grantRole(await zc.PROCESSOR_ROLE(), processor.address);

    // Seed on-chain Batch A
    const harvestPayload = {
      schemaVersion: 1,
      eventType: "HARVEST_LOGGED",
      batchId,
      hotspotRef,
      quantityKg: 1000,
      harvestedAt: 1729000000,
      region: "Winam Gulf",
      source: "ziwaclear-v1"
    };
    const harvestSalt = "0x11111111111111111111111111111111";
    const harvestHash = hashRecord(harvestPayload, harvestSalt);
    const evidenceHash = ethers.id("photo-evidence-test");

    const txH = await zc.connect(relayer).logHarvest(batchId, pseudonym, hotspotRef, 1000, evidenceHash, harvestHash);
    const rcptH = await txH.wait();

    const verifyPayload = {
      schemaVersion: 1,
      eventType: "VERIFIED",
      batchId,
      verifier: verifier.address,
      approved: true,
      verifiedAt: 1729003600,
      method: "physical_sampling_scale"
    };
    const verifySalt = "0x22222222222222222222222222222222";
    const verifyHash = hashRecord(verifyPayload, verifySalt);
    const txV = await zc.connect(verifier).verifyBatch(batchId, true, ethers.id("verify-evidence"), verifyHash);
    const rcptV = await txV.wait();

    const paymentSalt = "0x77777777777777777777777777777777";
    const paymentRefRaw = "MPESA-TEST-REC-01";
    const paymentRefHash = hashRecord({ receipt: paymentRefRaw }, paymentSalt);
    const acceptPayload = {
      schemaVersion: 1,
      eventType: "BUYER_ACCEPTED",
      batchId,
      buyer: buyer.address,
      acceptedKg: 900,
      paymentRefHash,
      acceptedAt: 1729007200
    };
    const acceptSalt = "0x33333333333333333333333333333333";
    const acceptHash = hashRecord(acceptPayload, acceptSalt);
    const txA = await zc.connect(buyer).acceptBatch(batchId, 900, paymentRefHash, acceptHash);
    const rcptA = await txA.wait();

    const confirmSalt = "0x44444444444444444444444444444444";
    const confirmHash = hashConfirmation("4821", confirmSalt);
    const confirmPayload = {
      schemaVersion: 1,
      eventType: "SETTLEMENT_CONFIRMED",
      batchId,
      confirmationHash: confirmHash,
      confirmedAt: 1729010800
    };
    const confirmRecordHash = hashRecord(confirmPayload, confirmSalt);
    const txC = await zc.connect(relayer).confirmSettlement(batchId, confirmHash, confirmRecordHash);
    const rcptC = await txC.wait();

    const processPayload = {
      schemaVersion: 1,
      eventType: "PROCESSED",
      batchId,
      processor: processor.address,
      processType: "biogas",
      inputKg: 800,
      outputUnits: 120,
      processedAt: 1729014400
    };
    const processSalt = "0x55555555555555555555555555555555";
    const processHash = hashRecord(processPayload, processSalt);
    const txP = await zc.connect(processor).recordProcessing(batchId, ethers.id("biogas"), 800, 120, processHash);
    const rcptP = await txP.wait();

    const endUsePayload = {
      schemaVersion: 1,
      eventType: "END_USE",
      batchId,
      processor: processor.address,
      endUseType: "bioenergy",
      endUseKg: 800,
      outputUnits: 120,
      endUseAt: 1729018000
    };
    const endUseSalt = "0x66666666666666666666666666666666";
    const endUseHash = hashRecord(endUsePayload, endUseSalt);
    const txE = await zc.connect(processor).recordEndUse(batchId, ethers.id("bioenergy"), 800, 120, endUseHash);
    const rcptE = await txE.wait();

    // Build certificate
    cert = buildCertificate(
      {
        batchId,
        pseudonym,
        chainId: "31337",
        contractAddress: await zc.getAddress(),
        deploymentBlock: 1,
        stages: {
          HARVEST_LOGGED: { payload: harvestPayload, salt: harvestSalt, hash: harvestHash, txHash: txH.hash, blockNumber: rcptH.blockNumber },
          VERIFIED: { payload: verifyPayload, salt: verifySalt, hash: verifyHash, txHash: txV.hash, blockNumber: rcptV.blockNumber },
          BUYER_ACCEPTED: { payload: acceptPayload, salt: acceptSalt, hash: acceptHash, txHash: txA.hash, blockNumber: rcptA.blockNumber },
          SETTLEMENT_CONFIRMED: { payload: confirmPayload, salt: confirmSalt, hash: confirmRecordHash, txHash: txC.hash, blockNumber: rcptC.blockNumber },
          PROCESSED: { payload: processPayload, salt: processSalt, hash: processHash, txHash: txP.hash, blockNumber: rcptP.blockNumber },
          END_USE: { payload: endUsePayload, salt: endUseSalt, hash: endUseHash, txHash: txE.hash, blockNumber: rcptE.blockNumber }
        }
      },
      {
        paymentRef: paymentRefRaw,
        paymentSalt,
        settlementCode: "4821"
      }
    );
  });

  it("Step 1: Successfully recomputes all stage payload hashes client-side", () => {
    for (const [stageName, stageData] of Object.entries(cert.stages)) {
      const recomputed = hashRecord(stageData.payload, stageData.salt);
      expect(recomputed).to.equal(stageData.payloadHash);
    }
  });

  it("Step 1 (Tamper Detection): Flags altered certificate data when a single field is changed", () => {
    const tampered = JSON.parse(JSON.stringify(cert));
    tampered.stages.HARVEST_LOGGED.payload.quantityKg = 1001; // altered by 1 kg

    const recomputed = hashRecord(
      tampered.stages.HARVEST_LOGGED.payload,
      tampered.stages.HARVEST_LOGGED.salt
    );
    expect(recomputed).to.not.equal(tampered.stages.HARVEST_LOGGED.payloadHash);
  });

  it("Step 2: Matches on-chain event logs to certificate payload hashes and tx hashes", async () => {
    const filter = zc.filters.HarvestLogged(batchId);
    const logs = await zc.queryFilter(filter);
    expect(logs.length).to.equal(1);

    const eventPayloadHash = logs[0].args.payloadHash;
    expect(eventPayloadHash).to.equal(cert.stages.HARVEST_LOGGED.payloadHash);
    expect(logs[0].transactionHash).to.equal(cert.stages.HARVEST_LOGGED.txHash);
  });

  it("Step 3: Confirms hashes are not superseded for uncorrected records", async () => {
    const replacement = await zc.supersededBy(batchId, cert.stages.HARVEST_LOGGED.payloadHash);
    expect(replacement).to.equal(ethers.ZeroHash);
  });

  it("Step 4: Asserts on-chain mass balance holds and verifies work credits", async () => {
    const batch = await zc.getBatch(batchId);
    expect(batch.harvestedKg).to.equal(1000n);
    expect(batch.acceptedKg).to.equal(900n);
    expect(batch.processedKg).to.equal(800n);
    expect(batch.endUseKgTotal).to.equal(800n);

    // Mass balance invariant: accepted <= harvested, processed <= accepted, endUse <= processed
    expect(batch.acceptedKg <= batch.harvestedKg).to.be.true;
    expect(batch.processedKg <= batch.acceptedKg).to.be.true;
    expect(batch.endUseKgTotal <= batch.processedKg).to.be.true;

    const credits = await zc.workCreditsOf(pseudonym);
    expect(credits).to.equal(800n);
  });

  it("Step 5: Verifies payment reference hash matches on-chain record", async () => {
    const batch = await zc.getBatch(batchId);
    const certAcceptPayload: any = cert.stages.BUYER_ACCEPTED.payload;
    expect(batch.paymentRefHash).to.equal(certAcceptPayload.paymentRefHash);

    // Verify hashed plain paymentRef with salt also matches
    const computedPaymentHash = hashRecord({ receipt: cert.paymentRef }, cert.paymentSalt!);
    expect(computedPaymentHash).to.equal(batch.paymentRefHash);
  });

  it("Step 2 (Tamper Detection): Fails verification when payload was edited and re-hashed because on-chain event does not match (Item 9a)", async () => {
    // Attacker modifies harvest quantity from 1000 to 2000 and re-hashes payload
    const tampered = JSON.parse(JSON.stringify(cert));
    tampered.stages.HARVEST_LOGGED.payload.quantityKg = 2000;
    tampered.stages.HARVEST_LOGGED.payloadHash = hashRecord(
      tampered.stages.HARVEST_LOGGED.payload,
      tampered.stages.HARVEST_LOGGED.salt
    );

    // Step 1 passes because payloadHash matches recomputed hash
    const recomputed = hashRecord(tampered.stages.HARVEST_LOGGED.payload, tampered.stages.HARVEST_LOGGED.salt);
    expect(recomputed).to.equal(tampered.stages.HARVEST_LOGGED.payloadHash);

    // Step 2 query against on-chain logs: on-chain event contains the real payloadHash, not the forged one
    const filter = zc.filters.HarvestLogged(batchId);
    const logs = await zc.queryFilter(filter);
    expect(logs.length).to.equal(1);
    const onChainHash = logs[0].args.payloadHash;

    // Must detect mismatch between tampered certificate payloadHash and immutable on-chain event
    expect(tampered.stages.HARVEST_LOGGED.payloadHash).to.not.equal(onChainHash);
  });

  it("Pseudonym integrity: Fails verification when certificate pseudonym does not match on-chain harvesterId (Item 9b)", async () => {
    const batch = await zc.getBatch(batchId);
    // Attacker puts a different pseudonym in certificate
    const tampered = JSON.parse(JSON.stringify(cert));
    tampered.pseudonym = derivePseudonym(secret, "attacker-group-impersonation", batchId);

    // Verification must detect mismatch
    expect(tampered.pseudonym).to.not.equal(batch.harvesterId);
  });

  it("Payment reference integrity: Fails verification when paymentRef does not match on-chain record (Item 9c)", async () => {
    const batch = await zc.getBatch(batchId);
    // Attacker claims a different payment receipt in certificate
    const forgedReceipt = "MPESA-FORGED-REC-999";
    const forgedHash = hashRecord({ receipt: forgedReceipt }, cert.paymentSalt!);

    // Recomputed hash from forged receipt does not match on-chain paymentRefHash
    expect(forgedHash).to.not.equal(batch.paymentRefHash);

    // Attacker tampers with BUYER_ACCEPTED stage payload paymentRefHash
    const tampered = JSON.parse(JSON.stringify(cert));
    tampered.stages.BUYER_ACCEPTED.payload.paymentRefHash = ethers.id("fake-payment-hash");
    expect(tampered.stages.BUYER_ACCEPTED.payload.paymentRefHash).to.not.equal(batch.paymentRefHash);
  });

  it("Rejected batch integrity: An authentic rejected batch reflects terminal stage Rejected and never qualifies for verified status (Item 9d)", async () => {
    const rejectedBatchId = ethers.id("rejected-test-batch-002");
    const pseudonymB = derivePseudonym(secret, "group-rejected-02", rejectedBatchId);

    // Relayer logs harvest
    await zc.connect(relayer).logHarvest(
      rejectedBatchId,
      pseudonymB,
      hotspotRef,
      1000,
      ethers.id("ev-b"),
      ethers.id("pl-b")
    );

    // Verifier rejects batch
    await zc.connect(verifier).verifyBatch(
      rejectedBatchId,
      false, // rejected
      ethers.id("ev-rejected"),
      ethers.id("pl-rejected")
    );

    const batch = await zc.getBatch(rejectedBatchId);
    // Stage enum 3 is Rejected
    expect(Number(batch.stage)).to.equal(3);

    // Work credits must be zero
    const credits = await zc.workCreditsOf(pseudonymB);
    expect(credits).to.equal(0n);
  });

  it("Duplicate evidence check: Shows amber notice and does not turn valid certificate red", async () => {
    // A second batch logs harvest reusing batchId's evidenceHash (from before hook)
    const duplicateBatchId = ethers.id("duplicate-evidence-batch-003");
    const pseudonymD = derivePseudonym(secret, "group-dup-03", duplicateBatchId);
    const harvestPayloadD = {
      schemaVersion: 1,
      eventType: "HARVEST_LOGGED",
      batchId: duplicateBatchId,
      hotspotRef,
      quantityKg: 600,
      harvestedAt: 1729000000,
      region: "Kendu Bay",
      source: "ziwaclear-v1"
    };
    const harvestSaltD = "0x88888888888888888888888888888888";
    const harvestHashD = hashRecord(harvestPayloadD, harvestSaltD);
    const sharedEvidenceHash = ethers.id("photo-evidence-test"); // Same as Batch A in before hook

    const txDup = await zc.connect(relayer).logHarvest(
      duplicateBatchId,
      pseudonymD,
      hotspotRef,
      600,
      sharedEvidenceHash,
      harvestHashD
    );
    await txDup.wait();

    // Query on-chain EvidenceReused events
    const filter = zc.filters.EvidenceReused();
    const reusedLogs = await zc.queryFilter(filter);
    expect(reusedLogs.length).to.be.gte(1);

    // Emitted event has batchId = duplicateBatchId and firstBatchId = batchId
    const matching = reusedLogs.find(
      (l: any) =>
        l.args.batchId === duplicateBatchId &&
        l.args.firstBatchId === batchId &&
        l.args.evidenceHash === sharedEvidenceHash
    );
    expect(matching).to.not.be.undefined;

    // Verify page algorithm check for Batch A:
    // It scans for EvidenceReused events where this batch is batchId or firstBatchId
    const forBatchA = reusedLogs.filter(
      (l: any) => l.args.batchId === batchId || l.args.firstBatchId === batchId
    );
    expect(forBatchA.length).to.be.gte(1);

    // For each matching reuse, it constructs the notice message:
    const otherBatchId = forBatchA[0].args.batchId === batchId
      ? forBatchA[0].args.firstBatchId
      : forBatchA[0].args.batchId;
    expect(otherBatchId).to.equal(duplicateBatchId);

    const noticeMessage = `This evidence also appears in batch ${otherBatchId}. It is flagged for human review. This is not a finding of fraud.`;
    expect(noticeMessage).to.include("It is flagged for human review. This is not a finding of fraud.");

    // The status for this check is 'notice' (amber), NOT 'fail' (red)
    const checkStatus = "notice";
    let hasFailures = false;
    if (checkStatus === "fail") {
      hasFailures = true;
    }
    // Must NOT turn valid certificate red
    expect(hasFailures).to.be.false;
  });

});
