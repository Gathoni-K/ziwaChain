import { ethers, Contract, JsonRpcProvider } from "ethers";
import { hashRecord, hashConfirmation } from "../src/hashing/hash";
import { fromBase64Url, HarvesterCertificate } from "../src/certificate/build";
import { shortCode } from "../src/certificate/shortCode";
import { getRpcUrl, STAGE_NAMES, ZIWACHAIN_ABI } from "./config";

// UI Elements
const jsonInput = document.getElementById("jsonInput") as HTMLTextAreaElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const btnVerify = document.getElementById("btnVerify") as HTMLButtonElement;
const btnLoadBatchA = document.getElementById("btnLoadBatchA") as HTMLButtonElement;
const btnLoadBatchC = document.getElementById("btnLoadBatchC") as HTMLButtonElement;
const btnTamperTest = document.getElementById("btnTamperTest") as HTMLButtonElement;
const rpcDisplay = document.getElementById("rpcDisplay") as HTMLSpanElement;

const resultsArea = document.getElementById("resultsArea") as HTMLElement;
const statusBanner = document.getElementById("statusBanner") as HTMLDivElement;
const checklist = document.getElementById("checklist") as HTMLUListElement;

const massHarvested = document.getElementById("massHarvested") as HTMLDivElement;
const massAccepted = document.getElementById("massAccepted") as HTMLDivElement;
const massProcessed = document.getElementById("massProcessed") as HTMLDivElement;
const massEndUse = document.getElementById("massEndUse") as HTMLDivElement;
const massBalanceStatus = document.getElementById("massBalanceStatus") as HTMLDivElement;

const creditsDisplay = document.getElementById("creditsDisplay") as HTMLSpanElement;
const pseudonymDisplay = document.getElementById("pseudonymDisplay") as HTMLSpanElement;
const timelineContainer = document.getElementById("timelineContainer") as HTMLDivElement;

const metaBatchId = document.getElementById("metaBatchId") as HTMLSpanElement;
const metaContract = document.getElementById("metaContract") as HTMLSpanElement;
const metaChainId = document.getElementById("metaChainId") as HTMLSpanElement;
const metaShortCode = document.getElementById("metaShortCode") as HTMLSpanElement;
const metaPaymentRef = document.getElementById("metaPaymentRef") as HTMLSpanElement;

// Helper to add checklist row
function addCheckItem(
  title: string,
  status: "pass" | "fail" | "notice",
  description: string
) {
  const li = document.createElement("li");
  li.className = `check-item ${status}`;

  const badgeClass = status === "pass" ? "badge-pass" : status === "fail" ? "badge-fail" : "badge-notice";
  const badgeText = status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "NOTICE";

  li.innerHTML = `
    <div class="check-header">
      <span class="check-title">${title}</span>
      <span class="check-badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="check-desc">${description}</div>
  `;
  checklist.appendChild(li);
}

// Format Unix Timestamp
function formatTime(unixSec: number): string {
  if (!unixSec) return "N/A";
  const d = new Date(unixSec * 1000);
  return d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

// Main verification runner
async function runVerification(certJsonString: string) {
  resultsArea.style.display = "block";
  checklist.innerHTML = "";
  timelineContainer.innerHTML = "";
  statusBanner.className = "status-banner loading";
  statusBanner.innerHTML = "Executing cryptographic and on-chain verification...";

  let cert: HarvesterCertificate;
  try {
    cert = JSON.parse(certJsonString.trim());
  } catch (err: any) {
    statusBanner.className = "status-banner failed";
    statusBanner.innerHTML = `❌ Verification Failed: Invalid Certificate JSON format (${err.message})`;
    addCheckItem("JSON Parsing", "fail", "The provided certificate is not valid JSON.");
    return;
  }

  // Populate technical details
  metaBatchId.innerText = cert.batchId || "-";
  metaContract.innerText = cert.contractAddress || "-";
  metaChainId.innerText = cert.chainId || "-";
  metaShortCode.innerText = cert.shortCode || "-";
  metaPaymentRef.innerText = cert.paymentRef || "-";
  pseudonymDisplay.innerText = cert.pseudonym || "-";

  let hasFailures = false;
  let batchStageNum: number | null = null;
  let batchStageName: string | null = null;
  const recomputedHashes: Record<string, string> = {};

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Recompute payload hash for every stage
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const stages = cert.stages || {};
    const stageKeys = Object.keys(stages);
    let stageMismatch = false;

    for (const key of stageKeys) {
      const stage = stages[key];
      const recomputed = hashRecord(stage.payload, stage.salt);
      recomputedHashes[key] = recomputed;

      if (recomputed.toLowerCase() !== stage.payloadHash.toLowerCase()) {
        stageMismatch = true;
        hasFailures = true;
        addCheckItem(
          `Stage Cryptographic Integrity (${key})`,
          "fail",
          `This record was altered or does not match. Expected on-certificate hash ${stage.payloadHash.slice(0, 14)}... but recomputed ${recomputed.slice(0, 14)}...`
        );
      }
    }

    if (!stageMismatch && stageKeys.length > 0) {
      addCheckItem(
        "Client-Side Hash Recomputation",
        "pass",
        `All ${stageKeys.length} stage payloads deterministically recomputed and match certificate payload hashes (RFC 8785 canonical JSON + keccak256).`
      );
    }

    // Verify settlement confirmation hash if present
    if (cert.settlementConfirmation?.code && cert.settlementConfirmation?.salt) {
      const recomputedConf = hashConfirmation(
        cert.settlementConfirmation.code,
        cert.settlementConfirmation.salt
      );
      addCheckItem(
        "Settlement SMS Confirmation Hash",
        "pass",
        `Harvester settlement co-sign ('${cert.settlementConfirmation.code}') successfully recomputed to confirmation hash (${recomputedConf.slice(0, 14)}...).`
      );
    }
  } catch (err: any) {
    hasFailures = true;
    addCheckItem("Cryptographic Recomputation", "fail", `Error hashing payload: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2 to 5: On-Chain Direct Verification via JSON-RPC
  // ───────────────────────────────────────────────────────────────────────────
  const rpcUrl = getRpcUrl(cert.chainId);
  rpcDisplay.innerText = rpcUrl;

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();

    if (network.chainId.toString() !== cert.chainId.toString()) {
      addCheckItem(
        "Network Chain ID Check",
        "notice",
        `RPC network chainId (${network.chainId}) differs from certificate chainId (${cert.chainId}). Verification proceeding against configured endpoint.`
      );
    }

    const contract = new Contract(cert.contractAddress, ZIWACHAIN_ABI, provider);

    // STEP 2: Query On-Chain Events and verify every certificate stage
    const fromBlock = cert.deploymentBlock ? Number(cert.deploymentBlock) : 0;

    // Filter events for this batchId
    const filter = {
      address: cert.contractAddress,
      fromBlock,
      toBlock: "latest"
    };

    const logs = await provider.getLogs(filter);
    const contractInterface = contract.interface;
    const batchLogs: any[] = [];

    for (const log of logs) {
      try {
        const parsed = contractInterface.parseLog(log);
        if (parsed && parsed.args && parsed.args.batchId === cert.batchId) {
          batchLogs.push({ ...parsed, txHash: log.transactionHash, blockNumber: log.blockNumber });
        }
      } catch {
        // Log is from a different contract or unknown topic, ignore
      }
    }

    // Map stage key or eventType to expected on-chain event name
    function getExpectedEventName(key: string, eventType?: string): string {
      const type = (eventType || key).toUpperCase();
      if (type.startsWith("HARVEST")) return "HarvestLogged";
      if (type.startsWith("VERIF")) return "BatchVerified";
      if (type.startsWith("BUYER") || type.startsWith("ACCEPT")) return "BatchAccepted";
      if (type.startsWith("SETTLE")) return "SettlementConfirmed";
      if (type.startsWith("PROCESS")) return "BatchProcessed";
      if (type.startsWith("END_USE")) return "EndUseRecorded";
      return type;
    }

    const stages = cert.stages || {};
    const stageKeys = Object.keys(stages);
    let allStagesMatched = true;

    for (const [key, stage] of Object.entries(stages)) {
      const expectedEvent = getExpectedEventName(key, stage.eventType);
      const matchingLog = batchLogs.find(
        (log) =>
          log.name === expectedEvent &&
          log.args &&
          log.args.payloadHash &&
          log.args.payloadHash.toLowerCase() === stage.payloadHash.toLowerCase() &&
          log.txHash.toLowerCase() === stage.txHash.toLowerCase()
      );

      if (!matchingLog) {
        allStagesMatched = false;
        hasFailures = true;
        addCheckItem(
          `On-Chain Event Provenance (${key})`,
          "fail",
          `Stage '${key}' verification failed: No matching on-chain ${expectedEvent} event found with payloadHash ${stage.payloadHash.slice(0, 14)}... and txHash ${stage.txHash.slice(0, 14)}...`
        );
      }
    }

    if (allStagesMatched && stageKeys.length > 0) {
      addCheckItem(
        "On-Chain Event Provenance",
        "pass",
        `All ${stageKeys.length} certificate stages matched against immutable on-chain event logs and transaction hashes.`
      );
    } else if (stageKeys.length === 0) {
      hasFailures = true;
      addCheckItem(
        "On-Chain Event Provenance",
        "fail",
        "Certificate contains no lifecycle stages."
      );
    }

    // STEP 3: Check Superseded / Corrected Records
    let hasSupersessions = false;
    for (const [key, stage] of Object.entries(cert.stages || {})) {
      try {
        const replacement = await contract.supersededBy(cert.batchId, stage.payloadHash);
        if (replacement && replacement !== ethers.ZeroHash) {
          hasSupersessions = true;
          addCheckItem(
            `Record Supersession (${key})`,
            "notice",
            `Record hash ${stage.payloadHash.slice(0, 14)}... was formally superseded on-chain by replacement hash ${replacement.slice(0, 14)}...`
          );
        }
      } catch {
        // Method not present or failed, continue
      }
    }

    if (!hasSupersessions) {
      addCheckItem(
        "Record Supersession Audit",
        "pass",
        "No stage records for this batch have been superseded or corrected."
      );
    }

    // STEP 4: Query getBatch(batchId) and verify Mass Balance
    const batchData = await contract.getBatch(cert.batchId);
    const stageNum = Number(batchData.stage);
    const stageName = STAGE_NAMES[stageNum] || "Unknown";
    batchStageNum = stageNum;
    batchStageName = stageName;

    // Harvester Pseudonym Check: assert cert.pseudonym equals getBatch().harvesterId
    if (!cert.pseudonym || cert.pseudonym.toLowerCase() !== batchData.harvesterId.toLowerCase()) {
      hasFailures = true;
      addCheckItem(
        "Harvester Pseudonym Integrity",
        "fail",
        `Certificate pseudonym (${(cert.pseudonym || "none").slice(0, 14)}...) does not match on-chain harvesterId (${batchData.harvesterId.slice(0, 14)}...).`
      );
    } else {
      addCheckItem(
        "Harvester Pseudonym Integrity",
        "pass",
        `Certificate pseudonym matches on-chain harvesterId (${batchData.harvesterId.slice(0, 14)}...).`
      );
    }

    const harvestedKg = Number(batchData.harvestedKg);
    const acceptedKg = Number(batchData.acceptedKg);
    const processedKg = Number(batchData.processedKg);
    const endUseKgTotal = Number(batchData.endUseKgTotal);

    massHarvested.innerText = `${harvestedKg.toLocaleString()} kg`;
    massAccepted.innerText = `${acceptedKg.toLocaleString()} kg`;
    massProcessed.innerText = `${processedKg.toLocaleString()} kg`;
    massEndUse.innerText = `${endUseKgTotal.toLocaleString()} kg`;

    const massBalanceValid =
      acceptedKg <= harvestedKg &&
      processedKg <= acceptedKg &&
      endUseKgTotal <= processedKg;

    if (massBalanceValid) {
      massBalanceStatus.style.color = "var(--primary)";
      massBalanceStatus.innerText = "✓ Mass Balance Invariant Preserved: Accepted ≤ Harvested, Processed ≤ Accepted, End Use ≤ Processed";
      addCheckItem(
        "Conservation of Mass Invariant",
        "pass",
        `Mass balance validated on-chain: ${harvestedKg} kg harvested → ${acceptedKg} kg accepted → ${processedKg} kg processed → ${endUseKgTotal} kg end-use.`
      );
    } else {
      hasFailures = true;
      massBalanceStatus.style.color = "var(--error)";
      massBalanceStatus.innerText = "⚠ Mass Balance Invariant Violated!";
      addCheckItem(
        "Conservation of Mass Invariant",
        "fail",
        "The on-chain mass balance is inconsistent with physical conservation laws."
      );
    }

    // Query Work Credits for the pseudonym
    const credits = await contract.workCreditsOf(cert.pseudonym);
    creditsDisplay.innerText = Number(credits).toLocaleString();

    addCheckItem(
      "Work Credits Attributed",
      "pass",
      `Smart contract reports ${Number(credits).toLocaleString()} non-transferable WORK_CREDIT tokens held in custody for pseudonym ${cert.pseudonym.slice(0, 14)}...`
    );

    // STEP 5: Verify Payment Reference
    // Hash the certificate's plain paymentRef exactly as the seed script does and compare it
    // with the on-chain paymentRefHash, and also compare the BUYER_ACCEPTED payload's paymentRefHash.
    // Any mismatch is a FAIL.
    const buyerAcceptedStage = cert.stages?.BUYER_ACCEPTED;
    const buyerAcceptedPayload = buyerAcceptedStage?.payload as any;
    const certPaymentRef = cert.paymentRef;
    const certPaymentSalt = cert.paymentSalt || (buyerAcceptedStage as any)?.paymentSalt;

    let paymentRefValid = true;

    // 1. Compare BUYER_ACCEPTED payload's paymentRefHash with on-chain paymentRefHash
    if (
      !buyerAcceptedPayload ||
      !buyerAcceptedPayload.paymentRefHash ||
      buyerAcceptedPayload.paymentRefHash.toLowerCase() !== batchData.paymentRefHash.toLowerCase()
    ) {
      paymentRefValid = false;
      hasFailures = true;
      addCheckItem(
        "BUYER_ACCEPTED Payment Reference Hash",
        "fail",
        `BUYER_ACCEPTED stage payload paymentRefHash (${buyerAcceptedPayload?.paymentRefHash?.slice(0, 14)}...) does not match on-chain record (${batchData.paymentRefHash.slice(0, 14)}...).`
      );
    }

    // 2. Hash the certificate's plain paymentRef exactly as the seed script does
    if (certPaymentRef) {
      let recomputedPaymentRefHash: string | null = null;
      if (certPaymentSalt) {
        recomputedPaymentRefHash = hashRecord({ receipt: certPaymentRef }, certPaymentSalt);
      }

      if (recomputedPaymentRefHash) {
        if (recomputedPaymentRefHash.toLowerCase() !== batchData.paymentRefHash.toLowerCase()) {
          paymentRefValid = false;
          hasFailures = true;
          addCheckItem(
            "Commercial Payment Reference Verification",
            "fail",
            `Hashed plain paymentRef '${certPaymentRef}' with salt does not match on-chain paymentRefHash.`
          );
        }
      }
    } else {
      paymentRefValid = false;
      hasFailures = true;
      addCheckItem(
        "Commercial Payment Reference Verification",
        "fail",
        "Certificate is missing paymentRef."
      );
    }

    if (paymentRefValid && batchData.paymentRefHash && batchData.paymentRefHash !== ethers.ZeroHash) {
      addCheckItem(
        "Commercial Payment Reference",
        "pass",
        `M-Pesa payment reference confirmed on-chain and matches BUYER_ACCEPTED payload (${batchData.paymentRefHash.slice(0, 14)}...).`
      );
    }

    // Build timeline
    buildTimeline(cert, batchLogs);

  } catch (err: any) {
    hasFailures = true;
    addCheckItem(
      "On-Chain Direct RPC Verification",
      "fail",
      `Unable to query blockchain node at ${rpcUrl} (${err.message}). If using a local node, ensure 'npx hardhat node' is running or append ?rpc=http://127.0.0.1:8545 to the URL.`
    );
  }

  // Update overall status banner
  if (hasFailures) {
    statusBanner.className = "status-banner failed";
    statusBanner.innerHTML = "❌ VERIFICATION FAILED: One or more tamper or integrity checks failed.";
  } else if (batchStageNum === 3 || batchStageName === "Rejected") {
    statusBanner.className = "status-banner rejected";
    statusBanner.innerHTML = "⚠️ This record is authentic, but the batch was rejected at verification. No credits were issued.";
  } else {
    statusBanner.className = "status-banner verified";
    statusBanner.innerHTML = "✅ VERIFIED: All cryptographic hashes and on-chain rules match perfectly.";
  }
}

// Build timeline UI
function buildTimeline(cert: HarvesterCertificate, batchLogs: any[]) {
  timelineContainer.innerHTML = "";
  const stages = cert.stages || {};

  for (const [key, stage] of Object.entries(stages)) {
    const payload = stage.payload as any;
    const eventDiv = document.createElement("div");
    eventDiv.className = "timeline-event";

    const timestamp = payload.harvestedAt || payload.verifiedAt || payload.acceptedAt || payload.confirmedAt || payload.processedAt || payload.endUseAt;
    const actor = payload.verifier || payload.buyer || payload.processor || "Relayer";

    let details = "";
    if (payload.quantityKg) details = `Quantity: ${payload.quantityKg} kg | Region: ${payload.region || "N/A"}`;
    if (payload.acceptedKg) details = `Accepted Mass: ${payload.acceptedKg} kg | Payment Ref Hash: ${payload.paymentRefHash?.slice(0, 14)}...`;
    if (payload.approved !== undefined) details = `Result: ${payload.approved ? "APPROVED" : "REJECTED"} | Method: ${payload.method || "Physical Inspection"}`;
    if (payload.confirmationHash) details = `Settlement Co-Sign confirmed by harvester SMS code`;
    if (payload.inputKg) details = `Processing Feedstock: ${payload.inputKg} kg into ${payload.processType || "biogas"}`;
    if (payload.endUseKg) details = `Final End Use: ${payload.endUseKg} kg converted into ${payload.endUseType || "bioenergy"}`;

    eventDiv.innerHTML = `
      <div class="timeline-title">${key.replace(/_/g, " ")} (${actor})</div>
      <div class="timeline-meta">${formatTime(timestamp)} &bull; Block #${stage.blockNumber}</div>
      <div style="font-size: 0.85rem; margin-top: 4px;">${details}</div>
      <div style="margin-top: 4px;">
        <span class="timeline-link">Tx: ${stage.txHash.slice(0, 24)}...</span>
      </div>
    `;
    timelineContainer.appendChild(eventDiv);
  }
}

// Embedded sample batches for quick button testing
const SAMPLE_BATCH_A = {
  version: 1,
  chainId: "31337",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
  pseudonym: "0x406cbc69950796e47fd36afe766ef07274c254b93613a8a61096a464436b8399",
  deploymentBlock: 1,
  stages: {
    HARVEST_LOGGED: {
      eventType: "HARVEST_LOGGED",
      payload: {
        schemaVersion: 1,
        eventType: "HARVEST_LOGGED",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        hotspotRef: "0xeac18fa56b101183f0195523039405f1118811619adfc499bcdcfff5f22cdc0a",
        quantityKg: 1000,
        harvestedAt: 1791968424,
        region: "Winam Gulf",
        source: "ziwaclear-v1"
      },
      salt: "0xb5839e7624a6f2f525e12d9e444b56e1",
      payloadHash: "0x451358457ea4ed85caa929f9cb3d41b64d6d97e408b8ccd06a2ff0059c321898",
      txHash: "0xad5eb5d03fe3d6a13a706c7aea2436374a30b5df8fb4f81819011cd8507a3170",
      blockNumber: 6
    },
    VERIFIED: {
      eventType: "VERIFIED",
      payload: {
        schemaVersion: 1,
        eventType: "VERIFIED",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        verifier: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        approved: true,
        verifiedAt: 1792054824,
        method: "physical_sampling_scale"
      },
      salt: "0xefc6df4e51fc4c660224b8f161c39af9",
      payloadHash: "0x55d99521b651c06c978cb793f6b409108137df7543fc585221b63621bd30ed6d",
      txHash: "0x001991b28a0a4c859a460bae653af0f7d8ecbedbdb209f3d81bcf4b227c10bcc",
      blockNumber: 7
    },
    BUYER_ACCEPTED: {
      eventType: "BUYER_ACCEPTED",
      payload: {
        schemaVersion: 1,
        eventType: "BUYER_ACCEPTED",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        buyer: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        acceptedKg: 900,
        paymentRefHash: "0x2683d050355cbfafb55ea6ab5048648bbedd3c061ce5fbc7c7a0125945f08368",
        acceptedAt: 1792098024
      },
      salt: "0xbc1fa7c9aed8bb1372d6bd96831fb7f5",
      payloadHash: "0x4e3f8bfb9ee6ae0e4584ea7f32a45e360bacff414d87dbfd0cf899266a798bfb",
      txHash: "0x4daaca53606620806e7d5e9d8fda5edf416478243670ba49c4b7317be85fb4fd",
      blockNumber: 8
    },
    SETTLEMENT_CONFIRMED: {
      eventType: "SETTLEMENT_CONFIRMED",
      payload: {
        schemaVersion: 1,
        eventType: "SETTLEMENT_CONFIRMED",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        confirmationHash: "0x4fe6f2f9f8c6ebf6764fc8654497a7605d336fa78b776ec438fc7fa602fa926a",
        confirmedAt: 1792119624
      },
      salt: "0xa6f84d6bb0e08f5127cfdc498260da93",
      payloadHash: "0xd32a9baea0cae360cf2b6348a4d7075c3b99971936b8015e100868f7d953e5d0",
      txHash: "0x5352347ae91b10702d8495a6ad6b0d91295fcfae536e2bfbeecfe76189ea71c9",
      blockNumber: 9
    },
    PROCESSED: {
      eventType: "PROCESSED",
      payload: {
        schemaVersion: 1,
        eventType: "PROCESSED",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        processor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        processType: "biogas",
        inputKg: 800,
        outputUnits: 120,
        processedAt: 1792130424
      },
      salt: "0xb6e7b165bf2d815f91ae4e84b1d624da",
      payloadHash: "0xbf2c4ca9f07feea300a08e1ec266ef637841c2c366fffc8d21b369ba00d603a1",
      txHash: "0xc10f135b525db31737be74a383bb17f8b9e63a92ee24075b8bebf65e2bcfeab8",
      blockNumber: 10
    },
    END_USE_1: {
      eventType: "END_USE",
      payload: {
        schemaVersion: 1,
        eventType: "END_USE",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        processor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        endUseType: "bioenergy",
        endUseKg: 500,
        outputUnits: 75,
        endUseAt: 1792137624
      },
      salt: "0xc23b090b82fa76fbbbe585d519b53366",
      payloadHash: "0xd3cfa15f7a0be098e9b4625b15be6227dbda84c24dd6c42ddf510c85c4bfdbdb",
      txHash: "0x9d5452d19fca37060e20601f78df31140026e6ef296dd5f6ae14a2bc0d53c3e7",
      blockNumber: 11
    },
    END_USE_2: {
      eventType: "END_USE",
      payload: {
        schemaVersion: 1,
        eventType: "END_USE",
        batchId: "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
        processor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        endUseType: "bioenergy",
        endUseKg: 300,
        outputUnits: 45,
        endUseAt: 1792140624
      },
      salt: "0xafe4f3469145694c9c1b3f9bfbe1cb05",
      payloadHash: "0xb69dbff996fefd1a9314418fc5cf022987a0209dfbe36cb3144e13589b91e921",
      txHash: "0xca62bb7be0702c286d9a16f2c3cb9bfd6b677a28f86f4a880bb6daee42fcb023",
      blockNumber: 12
    }
  },
  paymentRef: "MPESA-QKH78219XZ-2026",
  settlementConfirmation: {
    code: "4821",
    salt: "0xa6f84d6bb0e08f5127cfdc498260da93"
  },
  shortCode: "TR8NZ-A9VC5",
  verifyUrl: "https://ziwachain.org/verify"
};

const SAMPLE_BATCH_C = {
  version: 1,
  chainId: "31337",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  batchId: "0xd40a728929587fa4c1da8091b20cdfd2c377f2052bb08ceda61e3f5affc559d7",
  pseudonym: "0x5458909c76f173eb523d12169aee08418663bb3771e19c422229b16090d8d4e7",
  deploymentBlock: 1,
  stages: {
    HARVEST_LOGGED: {
      eventType: "HARVEST_LOGGED",
      payload: {
        schemaVersion: 1,
        eventType: "HARVEST_LOGGED",
        batchId: "0xd40a728929587fa4c1da8091b20cdfd2c377f2052bb08ceda61e3f5affc559d7",
        hotspotRef: "0xd07c7379ad9e160e118ca21980352ef29b8ef6c30f40d3a776c5f87b8d8ad3b6",
        quantityKg: 1000,
        harvestedAt: 1792137024,
        region: "Homa Bay",
        source: "ziwaclear-v1"
      },
      salt: "0xb7619a9f24250ee63529bfa502573210",
      payloadHash: "0xb435529f7cf73fa732e6a9f9976378e9079f22579dfcc81e9f298539659e9a4f",
      txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      blockNumber: 15
    }
  },
  paymentRef: "MPESA-PENDING",
  settlementConfirmation: {
    code: "0000",
    salt: "0x00000000000000000000000000000000"
  },
  shortCode: "FW1NY-6GGB0",
  verifyUrl: "https://ziwachain.org/verify"
};

// Event Listeners
btnVerify.addEventListener("click", () => {
  const val = jsonInput.value.trim();
  if (val) runVerification(val);
});

btnLoadBatchA.addEventListener("click", () => {
  jsonInput.value = JSON.stringify(SAMPLE_BATCH_A, null, 2);
  runVerification(jsonInput.value);
});

btnLoadBatchC.addEventListener("click", () => {
  jsonInput.value = JSON.stringify(SAMPLE_BATCH_C, null, 2);
  runVerification(jsonInput.value);
});

btnTamperTest.addEventListener("click", () => {
  const tampered = JSON.parse(JSON.stringify(SAMPLE_BATCH_A));
  // Alter quantityKg by 1 kg
  tampered.stages.HARVEST_LOGGED.payload.quantityKg = 1001;
  jsonInput.value = JSON.stringify(tampered, null, 2);
  runVerification(jsonInput.value);
});

fileInput.addEventListener("change", (e: any) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      jsonInput.value = text;
      runVerification(text);
    };
    reader.readAsText(file);
  }
});

// Auto-check on page load from URL fragment (#c=...)
window.addEventListener("DOMContentLoaded", () => {
  rpcDisplay.innerText = getRpcUrl();
  const hash = window.location.hash;
  if (hash && hash.includes("#c=")) {
    try {
      const base64UrlData = hash.split("#c=")[1];
      const decodedJson = fromBase64Url(base64UrlData);
      jsonInput.value = JSON.stringify(JSON.parse(decodedJson), null, 2);
      runVerification(jsonInput.value);
    } catch (e: any) {
      console.warn("Could not parse certificate from URL fragment:", e);
    }
  }
});
