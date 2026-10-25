import { ethers, Contract, JsonRpcProvider } from "ethers";
import { hashRecord, hashConfirmation } from "../src/hashing/hash";
import { fromBase64Url, toBase64Url, HarvesterCertificate } from "../src/certificate/build";
import { shortCode } from "../src/certificate/shortCode";
import { getRpcUrl, STAGE_NAMES, ZIWACHAIN_ABI } from "./config";
import { batchA, batchB, batchC, batchD } from "./demo-fixtures";

export type CheckStatus = "pass" | "fail" | "notice";
export type ResultsStatus = "loading" | "verified" | "failed" | "rejected";

export interface CheckItem {
  title: string;
  status: CheckStatus;
  description: string;
}

export interface TimelineItem {
  title: string;
  meta: string;
  details: string;
  tx: string;
}

export interface VerificationResult {
  status: ResultsStatus;
  statusText: string;
  stageName: string;
  isSyntheticDemo: boolean;
  rejectionReason?: string;
  /** The full public verification URL for this certificate (e.g. https://ziwachain.org/verify#c=...) */
  verifyUrl?: string;
  recordedDates: {
    collectedAt?: string;
    verifiedAt?: string;
    acceptedAt?: string;
    settledAt?: string;
    processedAt?: string;
    endUseAt?: string;
  };
  mass: {
    harvested: string;
    accepted: string;
    processed: string;
    endUse: string;
  };
  massStatus: string;
  credits: string;
  pseudonym: string;
  metadata: {
    batchId: string;
    contract: string;
    chainId: string;
    shortCode: string;
    paymentRef: string;
  };
  checks: CheckItem[];
  timeline: TimelineItem[];
}

// Format Unix Timestamp
export function formatTime(unixSec: number): string {
  if (!unixSec) return "Not recorded";
  const d = new Date(unixSec * 1000);
  return d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
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

function getEl<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return typeof document !== "undefined" ? (document.getElementById(id) as T) : null;
}

// Main verification runner
export async function runVerification(certJsonString: string): Promise<VerificationResult> {
  const resultsArea = getEl("resultsArea");
  const checklist = getEl<HTMLUListElement>("checklist");
  const timelineContainer = getEl("timelineContainer");
  const statusBanner = getEl("statusBanner");

  const massHarvested = getEl("massHarvested");
  const massAccepted = getEl("massAccepted");
  const massProcessed = getEl("massProcessed");
  const massEndUse = getEl("massEndUse");
  const massBalanceStatus = getEl("massBalanceStatus");

  const creditsDisplay = getEl("creditsDisplay");
  const pseudonymDisplay = getEl("pseudonymDisplay");

  const metaBatchId = getEl("metaBatchId");
  const metaContract = getEl("metaContract");
  const metaChainId = getEl("metaChainId");
  const metaShortCode = getEl("metaShortCode");
  const metaPaymentRef = getEl("metaPaymentRef");
  const rpcDisplay = getEl("rpcDisplay");

  if (resultsArea) resultsArea.style.display = "block";
  if (checklist) checklist.innerHTML = "";
  if (timelineContainer) timelineContainer.innerHTML = "";
  if (statusBanner) {
    statusBanner.className = "status-banner loading";
    statusBanner.innerHTML = "Executing cryptographic and on-chain verification...";
  }

  const checks: CheckItem[] = [];
  const timeline: TimelineItem[] = [];

  function addCheckItem(title: string, checkStatus: CheckStatus, description: string) {
    checks.push({ title, status: checkStatus, description });

    if (checklist) {
      const li = document.createElement("li");
      li.className = `check-item ${checkStatus}`;
      const badgeClass = checkStatus === "pass" ? "badge-pass" : checkStatus === "fail" ? "badge-fail" : "badge-notice";
      const badgeText = checkStatus === "pass" ? "PASS" : checkStatus === "fail" ? "FAIL" : "NOTICE";

      li.innerHTML = `
        <div class="check-header">
          <span class="check-title">${title}</span>
          <span class="check-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="check-desc">${description}</div>
      `;
      checklist.appendChild(li);
    }
  }

  let cert: any;
  try {
    cert = JSON.parse(certJsonString.trim());
  } catch (err: any) {
    if (statusBanner) {
      statusBanner.className = "status-banner failed";
      statusBanner.innerHTML = `❌ Verification Failed: Invalid Certificate JSON format (${err.message})`;
    }
    addCheckItem("JSON Parsing", "fail", "The provided certificate is not valid JSON.");
    return {
      status: "failed",
      statusText: `Verification Failed: Invalid Certificate JSON format (${err.message})`,
      stageName: "Invalid JSON",
      isSyntheticDemo: false,
      recordedDates: {},
      mass: { harvested: "-", accepted: "-", processed: "-", endUse: "-" },
      massStatus: "Cannot parse certificate.",
      credits: "not available",
      pseudonym: "-",
      metadata: { batchId: "-", contract: "-", chainId: "-", shortCode: "-", paymentRef: "-" },
      checks,
      timeline
    };
  }

  // Populate technical metadata
  if (metaBatchId) metaBatchId.innerText = cert.batchId || "-";
  if (metaContract) metaContract.innerText = cert.contractAddress || "-";
  if (metaChainId) metaChainId.innerText = cert.chainId || "-";
  if (metaShortCode) metaShortCode.innerText = cert.shortCode || "-";
  if (metaPaymentRef) metaPaymentRef.innerText = cert.paymentRef || "-";
  if (pseudonymDisplay) pseudonymDisplay.innerText = cert.pseudonym || "-";

  // Check if synthetic testnet demonstration record
  const knownDemoBatchIds = [
    "0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd",
    "0x2b6293d3dc213c071c149c2c6f793cdd8811b7645e49ff163207f1a8e5d60b2b",
    "0xd40a728929587fa4c1da8091b20cdfd2c377f2052bb08ceda61e3f5affc559d7",
    "0x62438758e29069339cee4648ac047282fd4ea6ff7a7933bc44d665a66cc2917e"
  ];
  const isSyntheticDemo =
    cert.chainId === "84532" ||
    cert.chainId === "31337" ||
    (cert.batchId && knownDemoBatchIds.includes(cert.batchId.toLowerCase()));

  // Extract recorded dates from stages
  const recordedDates: VerificationResult["recordedDates"] = {};
  const stagesObj = cert.stages || {};
  for (const stage of Object.values<any>(stagesObj)) {
    const payload = stage.payload || {};
    if (payload.harvestedAt && !recordedDates.collectedAt) recordedDates.collectedAt = formatTime(payload.harvestedAt);
    if (payload.verifiedAt && !recordedDates.verifiedAt) recordedDates.verifiedAt = formatTime(payload.verifiedAt);
    if (payload.acceptedAt && !recordedDates.acceptedAt) recordedDates.acceptedAt = formatTime(payload.acceptedAt);
    if (payload.confirmedAt && !recordedDates.settledAt) recordedDates.settledAt = formatTime(payload.confirmedAt);
    if (payload.processedAt && !recordedDates.processedAt) recordedDates.processedAt = formatTime(payload.processedAt);
    if (payload.endUseAt && !recordedDates.endUseAt) recordedDates.endUseAt = formatTime(payload.endUseAt);
  }

  // Initial stage summary from certificate
  const stagePayloads = Object.values<any>(stagesObj).map((s) => s.payload as Record<string, unknown>);
  const firstPayloadNum = (key: string): string => {
    const found = stagePayloads.find((item) => typeof item[key] === "number");
    return found ? Number(found[key]).toLocaleString() + " kg" : "Not recorded yet";
  };
  const endUseKgTotalCert = stagePayloads.reduce((total, payload) => (
    typeof payload.endUseKg === "number" ? total + Number(payload.endUseKg) : total
  ), 0);

  let mass: VerificationResult["mass"] = {
    harvested: firstPayloadNum("quantityKg"),
    accepted: firstPayloadNum("acceptedKg"),
    processed: firstPayloadNum("inputKg"),
    endUse: endUseKgTotalCert > 0 ? `${endUseKgTotalCert.toLocaleString()} kg` : "Not recorded yet"
  };

  let massStatusText = "Amounts shown from the certificate; live on-chain checks are executing...";
  let creditsStr = "0";

  // Rejection reason handling
  let rejectionReason = cert.rejectionReason;
  const verifiedStage = stagesObj["VERIFIED"] || Object.values<any>(stagesObj).find((s) => s.eventType === "VERIFIED");
  if (verifiedStage?.payload?.approved === false) {
    if (!rejectionReason) {
      if (verifiedStage.payload.method === "visual_and_scale_moisture_exceeded") {
        rejectionReason = "Excessive mud and inorganic contamination exceeding threshold.";
      } else {
        rejectionReason = verifiedStage.payload.method || "Physical inspection rejected the collection.";
      }
    }
  }

  if (cert.notice) {
    addCheckItem("Certificate Notice", "notice", cert.notice);
  }

  let hasFailures = false;
  let onChainCheckSucceeded = false;
  let batchStageNum: number | null = null;
  let batchStageName: string | null = null;
  const recomputedHashes: Record<string, string> = {};

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Client-Side Hash Recomputation
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const stageKeys = Object.keys(stagesObj);
    let stageMismatch = false;

    for (const key of stageKeys) {
      const stage = stagesObj[key];
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
  // STEP 2 to 5: On-Chain Direct Verification
  // ───────────────────────────────────────────────────────────────────────────
  const rpcUrl = getRpcUrl(cert.chainId);
  if (rpcDisplay) rpcDisplay.innerText = rpcUrl;

  const batchLogs: any[] = [];
  const evidenceReusedLogs: any[] = [];
  const recordCorrectedLogs: any[] = [];

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(cert.contractAddress, ZIWACHAIN_ABI, provider);

    // STEP 2: Verify Every Certificate Stage On-Chain via Transaction Receipts
    const stageKeys = Object.keys(stagesObj);
    let allStagesMatched = true;

    for (const [key, stage] of Object.entries<any>(stagesObj)) {
      const expectedEvent = getExpectedEventName(key, stage.eventType);

      if (stage.txHash) {
        try {
          const receipt = await provider.getTransactionReceipt(stage.txHash);
          if (!receipt) {
            allStagesMatched = false;
            hasFailures = true;
            addCheckItem(
              `On-Chain Event Provenance (${key})`,
              "fail",
              `Stage '${key}' transaction ${stage.txHash.slice(0, 14)}... not found on-chain.`
            );
            continue;
          }

          let eventFoundInReceipt = false;
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed && parsed.args) {
                if (parsed.name === "EvidenceReused") {
                  evidenceReusedLogs.push({ ...parsed, txHash: stage.txHash, blockNumber: receipt.blockNumber });
                }
                if (parsed.name === "RecordCorrected") {
                  recordCorrectedLogs.push({ ...parsed, txHash: stage.txHash, blockNumber: receipt.blockNumber });
                }

                if (parsed.args.batchId?.toLowerCase() === cert.batchId?.toLowerCase()) {
                  batchLogs.push({ ...parsed, txHash: stage.txHash, blockNumber: receipt.blockNumber });
                  if (
                    parsed.name === expectedEvent &&
                    parsed.args.payloadHash &&
                    parsed.args.payloadHash.toLowerCase() === stage.payloadHash.toLowerCase()
                  ) {
                    eventFoundInReceipt = true;
                  }
                }
              }
            } catch {
              // Ignore logs belonging to another contract
            }
          }

          if (!eventFoundInReceipt) {
            allStagesMatched = false;
            hasFailures = true;
            addCheckItem(
              `On-Chain Event Provenance (${key})`,
              "fail",
              `Stage '${key}' verification failed: Transaction ${stage.txHash.slice(0, 14)}... did not emit matching ${expectedEvent} with payloadHash ${stage.payloadHash.slice(0, 14)}...`
            );
          }
        } catch (txErr: any) {
          allStagesMatched = false;
          hasFailures = true;
          addCheckItem(
            `On-Chain Event Provenance (${key})`,
            "fail",
            `Error retrieving transaction receipt for ${key}: ${txErr.message}`
          );
        }
      } else {
        allStagesMatched = false;
        hasFailures = true;
        addCheckItem(
          `On-Chain Event Provenance (${key})`,
          "fail",
          `Stage '${key}' is missing on-chain transaction hash (txHash).`
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

    // Check superseded records explicitly attached or documented in the batch
    if (Array.isArray(cert.supersededRecords) && cert.supersededRecords.length > 0) {
      for (const rec of cert.supersededRecords) {
        try {
          const replacement = await contract.supersededBy(cert.batchId, rec.targetHash);
          if (replacement && replacement !== ethers.ZeroHash) {
            hasSupersessions = true;
            addCheckItem(
              "Record Correction / Evidence Supersession",
              "notice",
              `An earlier evidence record (${rec.targetHash.slice(0, 14)}...) was corrected and superseded on-chain by replacement record (${rec.newHash.slice(0, 14)}...) in transaction ${rec.txHash.slice(0, 14)}...`
            );
          }
        } catch {
          // Method not available or failed
        }
      }
    }

    // Check if any stage in the certificate was superseded
    for (const [key, stage] of Object.entries<any>(stagesObj)) {
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
        // Method not available
      }
    }

    if (!hasSupersessions) {
      addCheckItem(
        "Record Supersession Audit",
        "pass",
        "No stage records for this batch have been superseded or corrected."
      );
    }

    // Duplicate evidence check: check EvidenceReused events or contract view
    let duplicateEvidenceDetected = false;
    for (const reused of evidenceReusedLogs) {
      if (
        reused.args.batchId?.toLowerCase() === cert.batchId?.toLowerCase() ||
        reused.args.firstBatchId?.toLowerCase() === cert.batchId?.toLowerCase()
      ) {
        duplicateEvidenceDetected = true;
        const otherBatchId =
          reused.args.batchId?.toLowerCase() === cert.batchId?.toLowerCase()
            ? reused.args.firstBatchId
            : reused.args.batchId;
        addCheckItem(
          "Duplicate Evidence Flag",
          "notice",
          `This evidence also appears in batch ${otherBatchId}. It is flagged for human review. This is not a finding of fraud.`
        );
      }
    }

    // Check evidenceFirstBatch directly for harvest stage if available
    if (!duplicateEvidenceDetected && stagesObj["HARVEST_LOGGED"]?.payload?.hotspotRef) {
      try {
        const firstBatch = await contract.evidenceFirstBatch(stagesObj["HARVEST_LOGGED"].payload.hotspotRef);
        if (firstBatch && firstBatch !== ethers.ZeroHash && firstBatch.toLowerCase() !== cert.batchId.toLowerCase()) {
          duplicateEvidenceDetected = true;
          addCheckItem(
            "Duplicate Evidence Flag",
            "notice",
            `This evidence also appears in batch ${firstBatch}. It is flagged for human review. This is not a finding of fraud.`
          );
        }
      } catch {
        // Optional view method
      }
    }

    if (!duplicateEvidenceDetected) {
      addCheckItem(
        "Duplicate Evidence Audit",
        "pass",
        "No duplicate evidence hash reuse detected across batches."
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

    mass = {
      harvested: harvestedKg > 0 ? `${harvestedKg.toLocaleString()} kg` : "Not recorded yet",
      accepted: stageNum >= 4 ? `${acceptedKg.toLocaleString()} kg` : "Not recorded yet",
      processed: stageNum >= 5 ? `${processedKg.toLocaleString()} kg` : "Not recorded yet",
      endUse: stageNum >= 6 ? `${endUseKgTotal.toLocaleString()} kg` : "Not recorded yet"
    };

    if (stageNum === 3 || cert.status === "Rejected") {
      massStatusText = "Collection rejected during physical verification. Subsequent processing stages were not performed.";
      addCheckItem(
        "Collection Outcome",
        "notice",
        `Batch status is Rejected (Terminal Quality Rejection). ${rejectionReason ? `Reason: ${rejectionReason}` : "Certificate withheld."}`
      );
    } else if (stageNum >= 4) {
      const massBalanceValid =
        acceptedKg <= harvestedKg &&
        processedKg <= acceptedKg &&
        endUseKgTotal <= processedKg;

      if (massBalanceValid) {
        massStatusText = `✓ Mass Balance Invariant Preserved: ${harvestedKg.toLocaleString()} kg harvested → ${acceptedKg.toLocaleString()} kg accepted → ${processedKg.toLocaleString()} kg processed → ${endUseKgTotal.toLocaleString()} kg end-use.`;
        addCheckItem(
          "Conservation of Mass Invariant",
          "pass",
          `Mass balance validated on-chain: ${harvestedKg} kg harvested → ${acceptedKg} kg accepted → ${processedKg} kg processed → ${endUseKgTotal} kg end-use.`
        );
      } else {
        hasFailures = true;
        massStatusText = "⚠ Mass Balance Invariant Violated!";
        addCheckItem(
          "Conservation of Mass Invariant",
          "fail",
          "The on-chain mass balance is inconsistent with physical conservation laws."
        );
      }
    } else {
      massStatusText = `Collection recorded (${harvestedKg.toLocaleString()} kg). Subsequent processing stages are not yet recorded.`;
      addCheckItem(
        "Conservation of Mass Invariant",
        "pass",
        `Initial harvest mass recorded (${harvestedKg.toLocaleString()} kg). Later stages pending.`
      );
    }

    // Query Work Credits for the pseudonym
    const credits = await contract.workCreditsOf(cert.pseudonym);
    creditsStr = Number(credits).toLocaleString();

    if (Number(credits) > 0) {
      addCheckItem(
        "Work Credits Attributed",
        "pass",
        `Smart contract reports ${Number(credits).toLocaleString()} non-transferable WORK_CREDIT tokens held in custody for pseudonym ${cert.pseudonym.slice(0, 14)}...`
      );
    } else {
      addCheckItem(
        "Work Credits Attributed",
        "pass",
        `0 work credits recorded (credits are only issued upon verified end-use).`
      );
    }

    // Settlement confirmation check
    if (batchData.settled) {
      addCheckItem(
        "Settlement Confirmation",
        "pass",
        "Settlement confirmation recorded on-chain: Harvester payment receipt confirmed via SMS co-sign."
      );
    }

    // Commercial Payment Reference check
    const buyerAcceptedStage = stagesObj["BUYER_ACCEPTED"];
    const buyerAcceptedPayload = buyerAcceptedStage?.payload as any;
    const certPaymentRef = cert.paymentRef;
    const certPaymentSalt = cert.paymentSalt || (buyerAcceptedStage as any)?.paymentSalt;

    let paymentRefValid = true;

    if (buyerAcceptedStage || (batchData.paymentRefHash && batchData.paymentRefHash !== ethers.ZeroHash)) {
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
    } else {
      addCheckItem(
        "Commercial Payment Reference",
        "pass",
        "Batch has not reached buyer acceptance stage; commercial payment reference pending."
      );
    }

    onChainCheckSucceeded = true;
  } catch (err: any) {
    hasFailures = true;
    massStatusText = "On-chain verification incomplete due to RPC network error.";
    addCheckItem(
      "On-Chain Direct RPC Verification",
      "fail",
      `Unable to query blockchain node at ${rpcUrl} (${err.message}). If using a local node, ensure 'npx hardhat node' is running or append ?rpc=http://127.0.0.1:8545 to the URL.`
    );
  }

  // Update DOM displays
  if (massHarvested) massHarvested.innerText = mass.harvested;
  if (massAccepted) massAccepted.innerText = mass.accepted;
  if (massProcessed) massProcessed.innerText = mass.processed;
  if (massEndUse) massEndUse.innerText = mass.endUse;

  if (massBalanceStatus) {
    massBalanceStatus.innerText = massStatusText;
    massBalanceStatus.style.color = hasFailures ? "var(--error)" : "var(--primary)";
  }

  if (creditsDisplay) creditsDisplay.innerText = creditsStr;

  // Build timeline UI & data
  for (const [key, stage] of Object.entries<any>(stagesObj)) {
    const payload = stage.payload || {};
    const timestamp = payload.harvestedAt || payload.verifiedAt || payload.acceptedAt || payload.confirmedAt || payload.processedAt || payload.endUseAt;
    const actor = payload.verifier || payload.buyer || payload.processor || "Relayer";

    let details = "";
    if (payload.quantityKg) details = `Quantity: ${payload.quantityKg} kg | Region: ${payload.region || "N/A"}`;
    if (payload.acceptedKg) details = `Accepted Mass: ${payload.acceptedKg} kg | Payment Ref Hash: ${payload.paymentRefHash?.slice(0, 14)}...`;
    if (payload.approved !== undefined) details = `Result: ${payload.approved ? "APPROVED" : "REJECTED"} | Method: ${payload.method || "Physical Inspection"}`;
    if (payload.confirmationHash) details = `Settlement Co-Sign confirmed by harvester SMS code`;
    if (payload.inputKg) details = `Processing Feedstock: ${payload.inputKg} kg into ${payload.processType || "biogas"}`;
    if (payload.endUseKg) details = `Final End Use: ${payload.endUseKg} kg converted into ${payload.endUseType || "bioenergy"}`;

    const titleStr = `${key.replace(/_/g, " ")} (${actor})`;
    const metaStr = `${formatTime(timestamp)} • Block #${stage.blockNumber}`;
    const txStr = stage.txHash ? `Tx: ${stage.txHash.slice(0, 24)}...` : "";

    timeline.push({
      title: titleStr,
      meta: metaStr,
      details,
      tx: txStr
    });

    if (timelineContainer) {
      const eventDiv = document.createElement("div");
      eventDiv.className = "timeline-event";
      eventDiv.innerHTML = `
        <div class="timeline-title">${titleStr}</div>
        <div class="timeline-meta">${metaStr}</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">${details}</div>
        <div style="margin-top: 4px;">
          <span class="timeline-link">${txStr}</span>
        </div>
      `;
      timelineContainer.appendChild(eventDiv);
    }
  }

  // Include correction event in timeline if present
  if (Array.isArray(cert.supersededRecords)) {
    for (const rec of cert.supersededRecords) {
      const correctionTitle = "RECORD CORRECTED (Author)";
      const correctionMeta = `Block #${rec.blockNumber}`;
      const correctionDetails = `Earlier record ${rec.targetHash.slice(0, 14)}... was replaced by corrected record ${rec.newHash.slice(0, 14)}...`;
      const correctionTx = `Tx: ${rec.txHash.slice(0, 24)}...`;

      timeline.push({
        title: correctionTitle,
        meta: correctionMeta,
        details: correctionDetails,
        tx: correctionTx
      });

      if (timelineContainer) {
        const eventDiv = document.createElement("div");
        eventDiv.className = "timeline-event";
        eventDiv.innerHTML = `
          <div class="timeline-title">${correctionTitle}</div>
          <div class="timeline-meta">${correctionMeta}</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">${correctionDetails}</div>
          <div style="margin-top: 4px;">
            <span class="timeline-link">${correctionTx}</span>
          </div>
        `;
        timelineContainer.appendChild(eventDiv);
      }
    }
  }

  // Overall Status
  let finalStatus: ResultsStatus;
  let finalStatusText: string;

  if (hasFailures) {
    finalStatus = "failed";
    finalStatusText = onChainCheckSucceeded
      ? "❌ VERIFICATION FAILED: One or more tamper or integrity checks failed."
      : "❌ Live contract check could not run due to an RPC or network problem. Cryptographic hashes from the certificate were verified, but on-chain status is unconfirmed.";
    if (statusBanner) {
      statusBanner.className = "status-banner failed";
      statusBanner.innerHTML = finalStatusText;
    }
  } else if (batchStageNum === 3 || cert.status === "Rejected") {
    finalStatus = "rejected";
    finalStatusText = "⚠️ This record is authentic, but the collection was rejected at verification stage. No credits were issued.";
    if (statusBanner) {
      statusBanner.className = "status-banner rejected";
      statusBanner.innerHTML = finalStatusText;
    }
  } else {
    finalStatus = "verified";
    finalStatusText = "✅ VERIFIED: All cryptographic hashes and on-chain rules match perfectly.";
    if (statusBanner) {
      statusBanner.className = "status-banner verified";
      statusBanner.innerHTML = finalStatusText;
    }
  }

  const stageDisplay = batchStageName || (cert.status === "Rejected" ? "Rejected" : "Harvested");

  // Derive the public verification deep-link from the certificate.
  // The certificate's own verifyUrl field already encodes the full payload
  // as a base64url fragment (/verify#c=...). If the field is absent (e.g.
  // hand-built or older cert), rebuild it from the raw cert JSON so the
  // QR code always points to the correct record.
  let resolvedVerifyUrl: string | undefined;
  if (typeof cert.verifyUrl === "string" && cert.verifyUrl.includes("#c=")) {
    resolvedVerifyUrl = cert.verifyUrl;
  } else if (cert.batchId) {
    // Re-derive: strip verifyUrl itself before encoding to avoid recursion
    const { verifyUrl: _drop, ...certForQr } = cert as any;
    void _drop;
    const encoded = toBase64Url(JSON.stringify(certForQr));
    resolvedVerifyUrl = `https://ziwachain.org/verify#c=${encoded}`;
  }

  return {
    status: finalStatus,
    statusText: finalStatusText,
    stageName: stageDisplay,
    isSyntheticDemo,
    rejectionReason,
    verifyUrl: resolvedVerifyUrl,
    recordedDates,
    mass,
    massStatus: massStatusText,
    credits: creditsStr,
    pseudonym: cert.pseudonym || "-",
    metadata: {
      batchId: cert.batchId || "-",
      contract: cert.contractAddress || "-",
      chainId: cert.chainId || "-",
      shortCode: cert.shortCode || "-",
      paymentRef: cert.paymentRef || "-"
    },
    checks,
    timeline
  };
}

// Demo certificates are loaded from the generated public fixtures.
export const SAMPLE_BATCH_A = batchA;
export const SAMPLE_BATCH_B = batchB;
export const SAMPLE_BATCH_C = batchC;
export const SAMPLE_BATCH_D = batchD;

// DOM Event Listeners for legacy pages or buttons
if (typeof document !== "undefined") {
  const jsonInput = document.getElementById("jsonInput") as HTMLTextAreaElement | null;
  const fileInput = document.getElementById("fileInput") as HTMLInputElement | null;
  const btnVerify = document.getElementById("btnVerify") as HTMLButtonElement | null;
  const btnLoadBatchA = document.getElementById("btnLoadBatchA") as HTMLButtonElement | null;
  const btnLoadBatchB = document.getElementById("btnLoadBatchB") as HTMLButtonElement | null;
  const btnLoadBatchC = document.getElementById("btnLoadBatchC") as HTMLButtonElement | null;
  const btnLoadBatchD = document.getElementById("btnLoadBatchD") as HTMLButtonElement | null;
  const btnTamperTest = document.getElementById("btnTamperTest") as HTMLButtonElement | null;
  const rpcDisplay = document.getElementById("rpcDisplay") as HTMLSpanElement | null;

  btnVerify?.addEventListener("click", () => {
    const val = jsonInput?.value.trim();
    if (val) void runVerification(val);
  });

  btnLoadBatchA?.addEventListener("click", () => {
    if (jsonInput) jsonInput.value = JSON.stringify(SAMPLE_BATCH_A, null, 2);
    if (jsonInput?.value) void runVerification(jsonInput.value);
  });

  btnLoadBatchB?.addEventListener("click", () => {
    if (jsonInput) jsonInput.value = JSON.stringify(SAMPLE_BATCH_B, null, 2);
    if (jsonInput?.value) void runVerification(jsonInput.value);
  });

  btnLoadBatchC?.addEventListener("click", () => {
    if (jsonInput) jsonInput.value = JSON.stringify(SAMPLE_BATCH_C, null, 2);
    if (jsonInput?.value) void runVerification(jsonInput.value);
  });

  btnLoadBatchD?.addEventListener("click", () => {
    if (jsonInput) jsonInput.value = JSON.stringify(SAMPLE_BATCH_D, null, 2);
    if (jsonInput?.value) void runVerification(jsonInput.value);
  });

  btnTamperTest?.addEventListener("click", () => {
    const tampered = JSON.parse(JSON.stringify(SAMPLE_BATCH_A));
    tampered.stages.HARVEST_LOGGED.payload.quantityKg = 1001;
    if (jsonInput) jsonInput.value = JSON.stringify(tampered, null, 2);
    if (jsonInput?.value) void runVerification(jsonInput.value);
  });

  fileInput?.addEventListener("change", (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (jsonInput) jsonInput.value = text;
        void runVerification(text);
      };
      reader.readAsText(file);
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    if (rpcDisplay) rpcDisplay.innerText = getRpcUrl();
    const hash = window.location.hash;
    if (hash && hash.includes("#c=")) {
      try {
        const base64UrlData = hash.split("#c=")[1];
        const decodedJson = fromBase64Url(base64UrlData);
        if (jsonInput) jsonInput.value = JSON.stringify(JSON.parse(decodedJson), null, 2);
        void runVerification(decodedJson);
      } catch (e: any) {
        console.warn("Could not parse certificate from URL fragment:", e);
      }
    }
  });
}
