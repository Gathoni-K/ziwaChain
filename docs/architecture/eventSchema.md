# ZiwaChain: Provenance Data Model and Contract Rules

**Track:** Sustainable Supply Chains and Circular Economy
**Scope:** a verified chain of custody for invasive water hyacinth biomass from Lake Victoria, with portable proof for the harvesters who do the work.

**Chain of custody:** Hotspot → Harvest → Verification → Buyer → Processing → End use

## 1. Purpose

Informal harvesters carry the work and the risk, yet have no portable proof of what they delivered, what was verified, or what they were paid. ZiwaChain records each step of the chain of custody on-chain, enforces the process rules in a smart contract, and issues each harvester a certificate they can hold and present on their own.

Detection, forecasting and field operations remain in ZiwaClear and ZiwaVision. The chain adds tamper-evident history, rule enforcement, and public verifiability.

**What the chain proves:** that a record existed at a point in time, that it was not altered afterwards, and that the process rules were followed. **What it does not prove:** that the underlying real-world facts were true. That link comes from verification, the buyer's on-chain acceptance, the M-Pesa payment reference, and the harvester's own SMS confirmation.

---

## 2. Design decisions

| Area | Decision | Rationale |
|---|---|---|
| Primary user | The harvester, who receives a portable certificate | Harvesters need proof first (disputes, track record). Buyer-facing tools are roadmap. |
| Transaction signing | Verifiers, buyers and processors sign with their own wallets. Harvesters, who report by SMS/USSD and hold no wallets, are submitted through a ZiwaClear relayer. | Accountability where signing is possible, usability for low-connectivity harvesters. |
| On-chain logic | Stage, hashes and quantities are on-chain. The contract enforces mass balance. | Integrity guarantees live in the contract, not the database. |
| Harvester identity | A new pseudonym per batch | Batches from one harvester cannot be linked on a public chain. The harvester chooses which certificates to reveal. |
| Verification | A single verifier role | Simple and testable. Multi-verifier approval is roadmap. |
| Settlement | Payments stay on M-Pesa. The chain stores a hash of the payment reference and the harvester's SMS confirmation. | Settles on rails harvesters already use. |
| Hotspots | Off-chain, referenced by hash in the harvest event | Keeps the chain independent of the detection model. |
| Corrections | Evidence and payload hashes only. Quantities are fixed. | Protects mass-balance guarantees. |
| Credits | Non-transferable work credits minted at end use | Rewards verified circular outcomes. Not carbon credits. |
| Network | Base Sepolia testnet | Low cost and fast confirmation for a prototype. |

---

## 3. Common event envelope

| Field | Type | Notes |
|---|---|---|
| `eventId` | string | Unique ID per event |
| `batchId` | string | The biomass lot, created at harvest |
| `eventType` | enum | `HARVEST_LOGGED`, `VERIFIED`, `BUYER_ACCEPTED`, `SETTLEMENT_CONFIRMED`, `PROCESSED`, `END_USE`, `RECORD_CORRECTED` |
| `actorId` | string | Pseudonymous ID (no names or phone numbers) |
| `timestamp` | integer | Unix time |
| `source` | string | Data origin, for example `ziwaclear-v1` or `ziwavision` |
| `payloadHash` | bytes32 | Salted hash of the full off-chain record |

**Canonical payload format.** The off-chain record is serialised deterministically (fixed field order, normalised timestamps, fixed number formats) and hashed with a per-record random salt. Any third party can recompute the same hash from the certificate.

---

## 4. Stage payloads

**Hotspot (off-chain):** `hotspotId`, `region` (coarse area), `riskLevel`, `detectedAt`, `source`. Referenced as `hotspotRef`.

**Harvest logged (creates the batch):** `batchId`, `harvesterId` (per-batch pseudonym), `hotspotRef`, `quantityKg`, `evidenceHash`

**Verified:** `batchId`, `verifierId`, `method`, `result` (`APPROVED` or `REJECTED`), `evidenceHash`

**Buyer accepted:** `batchId`, `buyerId`, `acceptedQuantityKg`, `paymentRefHash`

**Settlement confirmed:** `batchId`, `confirmationHash` (hash of the harvester's SMS reply). An attestation that does not change the stage.

**Processed:** `batchId`, `processorId`, `processType`, `inputKg`, `outputUnits`

**End use:** `batchId`, `endUseType`, `endUseKg`, `outputUnits`

**Record corrected:** `batchId`, `supersededHash`, `newHash`, `reasonHash`

---

## 5. On-chain and off-chain data

| On-chain | Off-chain (ZiwaClear database) |
|---|---|
| `batchId`, current stage | Photos and field evidence |
| Actor role, per-batch pseudonym | Names, phone numbers, personal data |
| Quantities (kg, output units) | Exact harvest coordinates |
| Salted payload, evidence and confirmation hashes | Raw satellite imagery and model outputs |
| Work credit balances | M-Pesa transaction details, salts |

**Identity.** The per-batch pseudonym is derived with an HMAC under a server-side secret. Plain hashes of phone numbers are not used, because phone numbers have too little entropy to resist brute force.

---

## 6. State machine and enforced rules

```
(none) → HARVESTED → VERIFIED → ACCEPTED → PROCESSED → END_USE
              └──→ REJECTED (terminal)
```

1. Stages occur in order, with no skipping and no reversal.
2. Only the correct role triggers each transition. An admin role grants roles.
3. A verifier cannot hold the relayer role, so submissions are never verified by their own submitter.
4. **Mass balance:** accepted ≤ harvested; processed input ≤ accepted; total end-use mass ≤ processed input.
5. **Settlement confirmation:** recorded once per batch, only by the relayer, only after acceptance.
6. **Corrections:** only the original author of a hash can supersede it. Both hashes stay visible, a hash cannot be superseded twice, and a replacement cannot reuse an existing hash.
7. Every transition emits an event, so the history is publicly readable.

---

## 7. Harvester certificate and verification

At settlement, ZiwaChain issues a certificate containing the canonical payload, its salt, the M-Pesa reference, the on-chain transaction reference, and a QR code and short code. The harvester holds it independently (SMS, printout or file).

A no-login verification page recomputes the hash in the browser and reads the chain directly, so ZiwaClear's backend is not involved in the check.

**Two-sided agreement.** The certificate carries the buyer's on-chain acceptance (signed by the buyer's own wallet) and the harvester's SMS confirmation, so the record shows both parties agree.

---

## 8. Work credits

A work credit records **verified biomass that reached a real end use**. It is not a carbon credit: carbon credits need registry-approved methodologies, baselines and third-party auditing, which are outside the prototype's scope.

- **Earning rule:** one credit per verified kg that reaches end use.
- **No double counting:** credits are minted only at `END_USE`, only within the mass-balance limit, and each kilogram is credited once.
- **Non-transferable:** credits record outcomes and cannot be traded.
- **Custody:** harvesters hold no wallets, so credits are minted to the relayer and attributed to the batch's pseudonymous ID.

---

## 9. Roadmap

- Buyer-facing tools: impact certificates, dashboards and reports
- Multi-verifier approval (2-of-N)
- Adjustment events for quantity errors found after acceptance
- Simulated on-chain settlement reconciled against M-Pesa payments
- Redemption for work credits (bonuses, equipment access)
- Statement bundles for lenders (Merkle root over a harvester's chosen certificates)
- End-use-weighted credits
- Mapping to recognised carbon-market methodologies

---

## 10. Limitations

- Harvester submissions pass through a relayer, so harvester-level non-repudiation depends on ZiwaClear's custody of that key.
- The SMS confirmation is a code-based agreement logged by ZiwaClear and the SMS provider, not a cryptographic signature.
- A single verifier is a trust point until multi-verifier approval is added.
- A quantity error found after the buyer accepts cannot be corrected in this version.
- Buyers sign with wallets; the prototype uses test wallets.
- Work credits are recorded but not yet redeemable.
- The prototype runs on a testnet.