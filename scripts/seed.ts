import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

import { newSalt } from "../src/hashing/salt";
import { hashRecord, hashConfirmation } from "../src/hashing/hash";
import { derivePseudonym } from "../src/hashing/pseudonym";
import {
  HarvestPayload,
  VerifyPayload,
  BuyerAcceptancePayload,
  SettlementConfirmationPayload,
  ProcessingPayload,
  EndUsePayload
} from "../src/hashing/types";

// Constant test ETH funding amount for each ephemeral wallet on live testnets
const EPHEMERAL_WALLET_FUNDING = ethers.parseEther("0.0005");

interface StageRecord {
  stage: string;
  txHash: string;
  blockNumber: number;
  payload: object;
  salt: string;
  hash: string;
}

interface BatchDemoData {
  batchId: string;
  pseudonym: string;
  status: string;
  stages: Record<string, StageRecord>;
  supersededRecords?: Array<{
    targetHash: string;
    newHash: string;
    reasonHash: string;
    txHash: string;
    blockNumber: number;
  }>;
}

async function main() {
  console.log("================================================================================");
  console.log("ZiwaChain Demo Seed Script");
  console.log("================================================================================");

  const pseudonymSecret = process.env.PSEUDONYM_SECRET;
  if (!pseudonymSecret) {
    throw new Error(
      "Missing PSEUDONYM_SECRET environment variable. Please set PSEUDONYM_SECRET in your .env file."
    );
  }

  const networkName = network.name;
  const isLocalNetwork = networkName === "hardhat" || networkName === "localhost";
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No deployer signer available. Ensure DEPLOYER_PRIVATE_KEY is configured.");
  }
  const deployer = signers[0];
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const demoDir = path.join(process.cwd(), "demo");
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  // Set up role actors
  let relayer: any;
  let verifier: any;
  let buyer: any;
  let processor: any;

  if (isLocalNetwork) {
    console.log("\nLocal environment detected, using in-memory local accounts for role actors.");
    if (signers.length < 5) {
      throw new Error("Local test environment requires at least 5 default accounts.");
    }
    relayer = signers[1];
    verifier = signers[2];
    buyer = signers[3];
    processor = signers[4];
  } else {
    console.log("\nLive network detected, generating ephemeral wallets for role actors...");
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const totalFundingNeeded = EPHEMERAL_WALLET_FUNDING * 4n;

    console.log(`Deployer balance: ${ethers.formatEther(deployerBalance)} ETH`);
    if (deployerBalance < totalFundingNeeded) {
      throw new Error(
        `Insufficient testnet ETH. Deployer requires at least ${ethers.formatEther(
          totalFundingNeeded
        )} ETH to fund 4 ephemeral wallets, but currently holds ${ethers.formatEther(deployerBalance)} ETH.`
      );
    }

    const relayerWallet = ethers.Wallet.createRandom(ethers.provider);
    const verifierWallet = ethers.Wallet.createRandom(ethers.provider);
    const buyerWallet = ethers.Wallet.createRandom(ethers.provider);
    const processorWallet = ethers.Wallet.createRandom(ethers.provider);

    console.log("Funding ephemeral wallets...");
    const fundTxs = [
      await deployer.sendTransaction({ to: relayerWallet.address, value: EPHEMERAL_WALLET_FUNDING }),
      await deployer.sendTransaction({ to: verifierWallet.address, value: EPHEMERAL_WALLET_FUNDING }),
      await deployer.sendTransaction({ to: buyerWallet.address, value: EPHEMERAL_WALLET_FUNDING }),
      await deployer.sendTransaction({ to: processorWallet.address, value: EPHEMERAL_WALLET_FUNDING })
    ];
    await Promise.all(fundTxs.map(tx => tx.wait()));
    console.log("Ephemeral wallets funded successfully.");

    // Save private keys strictly to gitignored demo/.demo-wallets.json
    const walletsPath = path.join(demoDir, ".demo-wallets.json");
    fs.writeFileSync(
      walletsPath,
      JSON.stringify(
        {
          network: networkName,
          createdAt: new Date().toISOString(),
          relayer: { address: relayerWallet.address, privateKey: relayerWallet.privateKey },
          verifier: { address: verifierWallet.address, privateKey: verifierWallet.privateKey },
          buyer: { address: buyerWallet.address, privateKey: buyerWallet.privateKey },
          processor: { address: processorWallet.address, privateKey: processorWallet.privateKey }
        },
        null,
        2
      )
    );
    console.log(`Ephemeral wallet keys saved to ${walletsPath}`);

    relayer = relayerWallet;
    verifier = verifierWallet;
    buyer = buyerWallet;
    processor = processorWallet;
  }

  console.log(`Relayer:   ${relayer.address}`);
  console.log(`Verifier:  ${verifier.address}`);
  console.log(`Buyer:     ${buyer.address}`);
  console.log(`Processor: ${processor.address}`);

  // 1. Deploy ZiwaChain contract
  console.log("\nDeploying ZiwaChain smart contract...");
  const factory = await ethers.getContractFactory("ZiwaChain", deployer);
  const zc = await factory.deploy(deployer.address);
  await zc.waitForDeployment();

  const zcAddress = await zc.getAddress();
  const deployTx = zc.deploymentTransaction();
  const deployReceipt = await deployTx?.wait();
  const deploymentBlock = deployReceipt ? deployReceipt.blockNumber : await ethers.provider.getBlockNumber();
  console.log(`ZiwaChain deployed to: ${zcAddress} at block ${deploymentBlock}`);

  // 2. Grant roles
  console.log("Granting access control roles...");
  await (await zc.grantRole(await zc.RELAYER_ROLE(), relayer.address)).wait();
  await (await zc.grantRole(await zc.VERIFIER_ROLE(), verifier.address)).wait();
  await (await zc.grantRole(await zc.BUYER_ROLE(), buyer.address)).wait();
  await (await zc.grantRole(await zc.PROCESSOR_ROLE(), processor.address)).wait();
  console.log("All roles assigned successfully.");

  const demoData: {
    chainId: string;
    network: string;
    contractAddress: string;
    deploymentBlock: number;
    batches: Record<string, BatchDemoData>;
  } = {
    chainId,
    network: networkName,
    contractAddress: zcAddress,
    deploymentBlock,
    batches: {}
  };

  // ════════════════════════════════════════════════════════════════════════════
  // BATCH A: Full Happy Path Journey
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Executing BATCH A (Full Journey, 1000 kg harvest, buyer acceptance, end use)");
  console.log("--------------------------------------------------------------------------------");

  const batchIdA = ethers.id("ziwachain-batch-2026-001");
  const pseudonymA = derivePseudonym(pseudonymSecret, "group-dunga-01", batchIdA);
  const hotspotRefA = ethers.id("hotspot-winam-bay-01");
  const stagesA: Record<string, StageRecord> = {};

  // Stage 1: Log Harvest
  const harvestSaltA = newSalt();
  const harvestPayloadA: HarvestPayload = {
    schemaVersion: 1,
    eventType: "HARVEST_LOGGED",
    batchId: batchIdA,
    hotspotRef: hotspotRefA,
    quantityKg: 1000,
    harvestedAt: Math.floor(Date.now() / 1000) - 86400 * 2,
    region: "Winam Gulf",
    source: "ziwaclear-v1"
  };
  const harvestHashA = hashRecord(harvestPayloadA, harvestSaltA);
  const harvestEvidenceSaltA = newSalt();
  const harvestEvidenceA = hashRecord(
    { photo: "ipfs://bafybeiharvest01", note: "Dense mature water hyacinth mat harvested at Dunga Beach" },
    harvestEvidenceSaltA
  );

  console.log("  [1/6] logHarvest (1000 kg)...");
  const txHarvestA = await zc.connect(relayer).logHarvest(
    batchIdA,
    pseudonymA,
    hotspotRefA,
    1000,
    harvestEvidenceA,
    harvestHashA
  );
  const rcptHarvestA = await txHarvestA.wait();
  stagesA["HARVEST_LOGGED"] = {
    stage: "Harvested",
    txHash: txHarvestA.hash,
    blockNumber: rcptHarvestA!.blockNumber,
    payload: harvestPayloadA,
    salt: harvestSaltA,
    hash: harvestHashA
  };

  // Stage 2: Verify Batch (Approved)
  const verifySaltA = newSalt();
  const verifyPayloadA: VerifyPayload = {
    schemaVersion: 1,
    eventType: "VERIFIED",
    batchId: batchIdA,
    verifier: verifier.address,
    approved: true,
    verifiedAt: Math.floor(Date.now() / 1000) - 86400,
    method: "physical_sampling_scale"
  };
  const verifyHashA = hashRecord(verifyPayloadA, verifySaltA);
  const verifyEvidenceSaltA = newSalt();
  const verifyEvidenceA = hashRecord(
    { moisturePercent: 91, foreignMatterPercent: 2, scaleCalibrationRef: "CAL-2026-99" },
    verifyEvidenceSaltA
  );

  console.log("  [2/6] verifyBatch (Approved)...");
  const txVerifyA = await zc.connect(verifier).verifyBatch(
    batchIdA,
    true,
    verifyEvidenceA,
    verifyHashA
  );
  const rcptVerifyA = await txVerifyA.wait();
  stagesA["VERIFIED"] = {
    stage: "Verified",
    txHash: txVerifyA.hash,
    blockNumber: rcptVerifyA!.blockNumber,
    payload: verifyPayloadA,
    salt: verifySaltA,
    hash: verifyHashA
  };

  // Stage 3: Buyer Accept Batch
  const acceptSaltA = newSalt();
  const paymentRefRawA = "MPESA-QKH78219XZ-2026";
  const paymentSaltA = newSalt();
  const paymentRefHashA = hashRecord({ receipt: paymentRefRawA }, paymentSaltA);

  const acceptPayloadA: BuyerAcceptancePayload = {
    schemaVersion: 1,
    eventType: "BUYER_ACCEPTED",
    batchId: batchIdA,
    buyer: buyer.address,
    acceptedKg: 900,
    paymentRefHash: paymentRefHashA,
    acceptedAt: Math.floor(Date.now() / 1000) - 43200
  };
  const acceptHashA = hashRecord(acceptPayloadA, acceptSaltA);

  console.log("  [3/6] acceptBatch (900 kg accepted)...");
  const txAcceptA = await zc.connect(buyer).acceptBatch(
    batchIdA,
    900,
    paymentRefHashA,
    acceptHashA
  );
  const rcptAcceptA = await txAcceptA.wait();
  stagesA["BUYER_ACCEPTED"] = {
    stage: "Accepted",
    txHash: txAcceptA.hash,
    blockNumber: rcptAcceptA!.blockNumber,
    payload: acceptPayloadA,
    salt: acceptSaltA,
    paymentSalt: paymentSaltA,
    hash: acceptHashA
  };

  // Stage 4: Confirm Settlement
  const confirmCodeA = "4821";
  const confirmSaltA = newSalt();
  const confirmationHashA = hashConfirmation(confirmCodeA, confirmSaltA);

  const confirmPayloadA: SettlementConfirmationPayload = {
    schemaVersion: 1,
    eventType: "SETTLEMENT_CONFIRMED",
    batchId: batchIdA,
    confirmationHash: confirmationHashA,
    confirmedAt: Math.floor(Date.now() / 1000) - 21600
  };
  const confirmHashA = hashRecord(confirmPayloadA, confirmSaltA);

  console.log("  [4/6] confirmSettlement (SMS confirmation code 4821 co-sign)...");
  const txConfirmA = await zc.connect(relayer).confirmSettlement(
    batchIdA,
    confirmationHashA,
    confirmHashA
  );
  const rcptConfirmA = await txConfirmA.wait();
  stagesA["SETTLEMENT_CONFIRMED"] = {
    stage: "Settled",
    txHash: txConfirmA.hash,
    blockNumber: rcptConfirmA!.blockNumber,
    payload: confirmPayloadA,
    salt: confirmSaltA,
    hash: confirmHashA
  };

  // Stage 5: Record Processing
  const processSaltA = newSalt();
  const processTypeA = ethers.id("biogas");
  const processPayloadA: ProcessingPayload = {
    schemaVersion: 1,
    eventType: "PROCESSED",
    batchId: batchIdA,
    processor: processor.address,
    processType: "biogas",
    inputKg: 800,
    outputUnits: 120,
    processedAt: Math.floor(Date.now() / 1000) - 10800
  };
  const processHashA = hashRecord(processPayloadA, processSaltA);

  console.log("  [5/6] recordProcessing (800 kg input into anaerobic digester)...");
  const txProcessA = await zc.connect(processor).recordProcessing(
    batchIdA,
    processTypeA,
    800,
    120,
    processHashA
  );
  const rcptProcessA = await txProcessA.wait();
  stagesA["PROCESSED"] = {
    stage: "Processed",
    txHash: txProcessA.hash,
    blockNumber: rcptProcessA!.blockNumber,
    payload: processPayloadA,
    salt: processSaltA,
    hash: processHashA
  };

  // Stage 6a: Record End Use (Call 1, 500 kg)
  const endUseSaltA1 = newSalt();
  const endUseTypeA = ethers.id("bioenergy");
  const endUsePayloadA1: EndUsePayload = {
    schemaVersion: 1,
    eventType: "END_USE",
    batchId: batchIdA,
    processor: processor.address,
    endUseType: "bioenergy",
    endUseKg: 500,
    outputUnits: 75,
    endUseAt: Math.floor(Date.now() / 1000) - 3600
  };
  const endUseHashA1 = hashRecord(endUsePayloadA1, endUseSaltA1);

  console.log("  [6a/6] recordEndUse #1 (500 kg converted to grid bioenergy)...");
  const txEndUseA1 = await zc.connect(processor).recordEndUse(
    batchIdA,
    endUseTypeA,
    500,
    75,
    endUseHashA1
  );
  const rcptEndUseA1 = await txEndUseA1.wait();
  stagesA["END_USE_1"] = {
    stage: "EndUse",
    txHash: txEndUseA1.hash,
    blockNumber: rcptEndUseA1!.blockNumber,
    payload: endUsePayloadA1,
    salt: endUseSaltA1,
    hash: endUseHashA1
  };

  // Stage 6b: Record End Use (Call 2, 300 kg)
  const endUseSaltA2 = newSalt();
  const endUsePayloadA2: EndUsePayload = {
    schemaVersion: 1,
    eventType: "END_USE",
    batchId: batchIdA,
    processor: processor.address,
    endUseType: "bioenergy",
    endUseKg: 300,
    outputUnits: 45,
    endUseAt: Math.floor(Date.now() / 1000) - 600
  };
  const endUseHashA2 = hashRecord(endUsePayloadA2, endUseSaltA2);

  console.log("  [6b/6] recordEndUse #2 (300 kg converted to bottled biogas)...");
  const txEndUseA2 = await zc.connect(processor).recordEndUse(
    batchIdA,
    endUseTypeA,
    300,
    45,
    endUseHashA2
  );
  const rcptEndUseA2 = await txEndUseA2.wait();
  stagesA["END_USE_2"] = {
    stage: "EndUse",
    txHash: txEndUseA2.hash,
    blockNumber: rcptEndUseA2!.blockNumber,
    payload: endUsePayloadA2,
    salt: endUseSaltA2,
    hash: endUseHashA2
  };

  demoData.batches["batchA"] = {
    batchId: batchIdA,
    pseudonym: pseudonymA,
    status: "Completed (EndUse)",
    stages: stagesA
  };

  // ════════════════════════════════════════════════════════════════════════════
  // BATCH B: Rejected Journey
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Executing BATCH B (Rejected Journey, quality failure terminal state)");
  console.log("--------------------------------------------------------------------------------");

  const batchIdB = ethers.id("ziwachain-batch-2026-002");
  const pseudonymB = derivePseudonym(pseudonymSecret, "group-usenge-02", batchIdB);
  const hotspotRefB = ethers.id("hotspot-usenge-bay-02");
  const stagesB: Record<string, StageRecord> = {};

  // Log Harvest
  const harvestSaltB = newSalt();
  const harvestPayloadB: HarvestPayload = {
    schemaVersion: 1,
    eventType: "HARVEST_LOGGED",
    batchId: batchIdB,
    hotspotRef: hotspotRefB,
    quantityKg: 1000,
    harvestedAt: Math.floor(Date.now() / 1000) - 86400,
    region: "Usenge Bay",
    source: "ziwaclear-v1"
  };
  const harvestHashB = hashRecord(harvestPayloadB, harvestSaltB);
  const harvestEvidenceSaltB = newSalt();
  const harvestEvidenceB = hashRecord(
    { photo: "ipfs://bafybeiharvest02", note: "Lot collected near Usenge pier" },
    harvestEvidenceSaltB
  );

  console.log("  [1/2] logHarvest (1000 kg)...");
  const txHarvestB = await zc.connect(relayer).logHarvest(
    batchIdB,
    pseudonymB,
    hotspotRefB,
    1000,
    harvestEvidenceB,
    harvestHashB
  );
  const rcptHarvestB = await txHarvestB.wait();
  stagesB["HARVEST_LOGGED"] = {
    stage: "Harvested",
    txHash: txHarvestB.hash,
    blockNumber: rcptHarvestB!.blockNumber,
    payload: harvestPayloadB,
    salt: harvestSaltB,
    hash: harvestHashB
  };

  // Verify Batch (Rejected)
  const verifySaltB = newSalt();
  const verifyPayloadB: VerifyPayload = {
    schemaVersion: 1,
    eventType: "VERIFIED",
    batchId: batchIdB,
    verifier: verifier.address,
    approved: false,
    verifiedAt: Math.floor(Date.now() / 1000) - 3600,
    method: "visual_and_scale_moisture_exceeded"
  };
  const verifyHashB = hashRecord(verifyPayloadB, verifySaltB);
  const verifyEvidenceSaltB = newSalt();
  const verifyEvidenceB = hashRecord(
    { failureReason: "Excessive mud and inorganic plastic contamination over 25%", sampledBags: 10 },
    verifyEvidenceSaltB
  );

  console.log("  [2/2] verifyBatch (Rejected, high foreign matter)...");
  const txVerifyB = await zc.connect(verifier).verifyBatch(
    batchIdB,
    false,
    verifyEvidenceB,
    verifyHashB
  );
  const rcptVerifyB = await txVerifyB.wait();
  stagesB["VERIFIED"] = {
    stage: "Rejected",
    txHash: txVerifyB.hash,
    blockNumber: rcptVerifyB!.blockNumber,
    payload: verifyPayloadB,
    salt: verifySaltB,
    hash: verifyHashB
  };

  demoData.batches["batchB"] = {
    batchId: batchIdB,
    pseudonym: pseudonymB,
    status: "Terminal (Rejected)",
    stages: stagesB
  };

  // ════════════════════════════════════════════════════════════════════════════
  // BATCH C: Tamper-Evident Hash Correction Journey
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n--------------------------------------------------------------------------------");
  console.log("Executing BATCH C (Hash Correction Journey, superseding typo in evidence hash)");
  console.log("--------------------------------------------------------------------------------");

  const batchIdC = ethers.id("ziwachain-batch-2026-003");
  const pseudonymC = derivePseudonym(pseudonymSecret, "group-homabay-03", batchIdC);
  const hotspotRefC = ethers.id("hotspot-homabay-03");
  const stagesC: Record<string, StageRecord> = {};

  // Log Harvest with initial evidence hash
  const harvestSaltC = newSalt();
  const harvestPayloadC: HarvestPayload = {
    schemaVersion: 1,
    eventType: "HARVEST_LOGGED",
    batchId: batchIdC,
    hotspotRef: hotspotRefC,
    quantityKg: 1000,
    harvestedAt: Math.floor(Date.now() / 1000) - 3600,
    region: "Homa Bay",
    source: "ziwaclear-v1"
  };
  const harvestHashC = hashRecord(harvestPayloadC, harvestSaltC);
  const initialEvidenceSaltC = newSalt();
  const initialEvidenceC = hashRecord(
    { photo: "ipfs://bafybeierrorphoto", note: "Low-resolution photo reference recorded with typographical error" },
    initialEvidenceSaltC
  );

  console.log("  [1/2] logHarvest (with initial photo evidence)...");
  const txHarvestC = await zc.connect(relayer).logHarvest(
    batchIdC,
    pseudonymC,
    hotspotRefC,
    1000,
    initialEvidenceC,
    harvestHashC
  );
  const rcptHarvestC = await txHarvestC.wait();
  stagesC["HARVEST_LOGGED"] = {
    stage: "Harvested",
    txHash: txHarvestC.hash,
    blockNumber: rcptHarvestC!.blockNumber,
    payload: harvestPayloadC,
    salt: harvestSaltC,
    hash: harvestHashC
  };

  // Correct record
  const correctedEvidenceSaltC = newSalt();
  const correctedEvidencePayloadC = {
    photo: "ipfs://bafybeicorrectedphoto-highres-4k",
    note: "High-resolution authenticated landing photo replacing miskeyed metadata"
  };
  const correctedEvidenceHashC = hashRecord(correctedEvidencePayloadC, correctedEvidenceSaltC);
  const reasonHashC = ethers.id("photographic-metadata-typographical-correction");

  console.log("  [2/2] correctRecord (Superseding evidence hash with auditable reason)...");
  const txCorrectC = await zc.connect(relayer).correctRecord(
    batchIdC,
    initialEvidenceC,
    correctedEvidenceHashC,
    reasonHashC
  );
  const rcptCorrectC = await txCorrectC.wait();

  demoData.batches["batchC"] = {
    batchId: batchIdC,
    pseudonym: pseudonymC,
    status: "Corrected (Harvested)",
    stages: stagesC,
    supersededRecords: [
      {
        targetHash: initialEvidenceC,
        newHash: correctedEvidenceHashC,
        reasonHash: reasonHashC,
        txHash: txCorrectC.hash,
        blockNumber: rcptCorrectC!.blockNumber
      }
    ]
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Write Demo Data File
  // ════════════════════════════════════════════════════════════════════════════
  const demoDataPath = path.join(demoDir, "demo-data.json");
  fs.writeFileSync(demoDataPath, JSON.stringify(demoData, null, 2));
  console.log("\n================================================================================");
  console.log(`Demo data successfully written to: ${demoDataPath}`);

  // ════════════════════════════════════════════════════════════════════════════
  // Print Execution Summary
  // ════════════════════════════════════════════════════════════════════════════
  const batchARecord = await zc.getBatch(batchIdA);
  const batchBRecord = await zc.getBatch(batchIdB);
  const batchCRecord = await zc.getBatch(batchIdC);

  const creditsA = await zc.workCreditsOf(pseudonymA);
  const creditsB = await zc.workCreditsOf(pseudonymB);
  const creditsC = await zc.workCreditsOf(pseudonymC);

  console.log("\nSUMMARY OF SEEDED BATCHES:");
  console.log("--------------------------------------------------------------------------------");
  console.log("BATCH A (Full Lifecycle):");
  console.log(`  Batch ID:         ${batchIdA}`);
  console.log(`  Pseudonym:        ${pseudonymA}`);
  console.log(`  Stage:            EndUse (Enum: ${batchARecord.stage.toString()})`);
  console.log(`  Harvested:        ${batchARecord.harvestedKg.toString()} kg`);
  console.log(`  Accepted:         ${batchARecord.acceptedKg.toString()} kg`);
  console.log(`  Processed:        ${batchARecord.processedKg.toString()} kg`);
  console.log(`  Total End Use:    ${batchARecord.endUseKgTotal.toString()} kg`);
  console.log(`  Settled:          ${batchARecord.settled ? "YES (SMS Code 4821 Confirmed)" : "NO"}`);
  console.log(`  Work Credits:     ${creditsA.toString()} WORK_CREDIT tokens`);

  console.log("\nBATCH B (Quality Rejection):");
  console.log(`  Batch ID:         ${batchIdB}`);
  console.log(`  Pseudonym:        ${pseudonymB}`);
  console.log(`  Stage:            Rejected (Enum: ${batchBRecord.stage.toString()})`);
  console.log(`  Harvested:        ${batchBRecord.harvestedKg.toString()} kg`);
  console.log(`  Work Credits:     ${creditsB.toString()} WORK_CREDIT tokens`);

  console.log("\nBATCH C (Hash Correction):");
  console.log(`  Batch ID:         ${batchIdC}`);
  console.log(`  Pseudonym:        ${pseudonymC}`);
  console.log(`  Stage:            Harvested (Enum: ${batchCRecord.stage.toString()})`);
  console.log(`  Superseded Hash:  ${initialEvidenceC}`);
  console.log(`  Replacement Hash: ${await zc.supersededBy(batchIdC, initialEvidenceC)}`);
  console.log(`  Work Credits:     ${creditsC.toString()} WORK_CREDIT tokens`);
  console.log("================================================================================\n");
}

main().catch((error) => {
  console.error("Seed script failed:", error);
  process.exitCode = 1;
});
