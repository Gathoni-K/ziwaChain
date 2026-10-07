# ZiwaChain: Provenance Data Model and Contract Rules

**Track:** Sustainable Supply Chains and Circular Economy
**Scope:** the verified chain of custody for invasive water hyacinth biomass from Lake Victoria.

**Chain of custody:** Hotspot → Harvest → Verification → Buyer → Processing → End use

ZiwaChain records the provenance events that matter, enforces the process rules on-chain, and issues circular impact credits for verified outcomes. Detection, forecasting and field operations remain in ZiwaClear and ZiwaVision. The chain adds tamper-evident history, rule enforcement and public verifiability.

---

## 1. Design decisions

| Area | Decision | Rationale |
|---|---|---|
| Transaction signing | Verifiers, buyers and processors sign with their own wallets. Harvesters, who report by SMS/USSD and hold no wallets, are submitted through a ZiwaClear relayer. | Keeps accountability with each actor where signing is possible, and keeps the system usable for low-connectivity harvesters. |
| On-chain logic | Stage, hashes and quantities are on-chain. The contract enforces mass balance. | Moves the integrity guarantees from the database into the contract. |
| Verification | A single verifier role. | Simple and testable. Multi-verifier approval is on the roadmap. |
| Hotspots | Held off-chain and referenced by hash in the harvest event. | Keeps the chain independent of the detection model, so detection sources can change without contract changes. |
| Payments | Remain on M-Pesa. The chain stores only a hash of the payment reference. | Payments settle in the currency and rails harvesters already use. |
| Credits | Circular impact credits, minted at end use (section 6). | Aligns incentives with verified circular outcomes. |
| Network | Base Sepolia testnet. | Low cost and fast confirmation for a prototype. |

---

## 2. Common event envelope

| Field | Type | Notes |
|---|---|---|
| `eventId` | string | Unique ID per event |
| `batchId` | string | The biomass lot, created at harvest |
| `eventType` | enum | `HARVEST_LOGGED`, `VERIFIED`, `BUYER_ACCEPTED`, `PROCESSED`, `END_USE` |
| `actorId` | string | Pseudonymous ID (no names or phone numbers) |
| `timestamp` | integer | Unix time |
| `source` | string | Data origin, for example `ziwaclear-v1` or `ziwavision` |
| `payloadHash` | bytes32 | Hash of the full off-chain record |

---

## 3. Stage payloads

**Hotspot (off-chain):** `hotspotId`, `region` (coarse area), `riskLevel`, `detectedAt`, `source`. Its hash is referenced as `hotspotRef` in the harvest event.

**Harvest logged (creates the batch):** `batchId`, `hotspotRef`, `quantityKg`, `harvestedAt`, `evidenceHash`

**Verified:** `batchId`, `verifierId`, `method` (field check, photo review, satellite), `result` (`APPROVED` or `REJECTED`), `evidenceHash`

**Buyer accepted:** `batchId`, `buyerId`, `acceptedQuantityKg`, `paymentRefHash`

**Processed:** `batchId`, `processorId`, `processType` (biogas, compost, briquettes, biochar, paper), `inputKg`, `outputUnits`

**End use:** `batchId`, `endUseType`, `endUseKg` (input-equivalent mass routed to this use), `outputUnits`, `destinationType`

---

## 4. On-chain and off-chain data

| On-chain | Off-chain (ZiwaClear database) |
|---|---|
| `batchId`, current stage, timestamps | Photos and field evidence |
| Actor role and pseudonymous ID | Names, phone numbers, personal data |
| Quantities (kg, output units) | Exact harvest coordinates |
| `payloadHash`, `evidenceHash`, `hotspotRef` | Raw satellite imagery and model outputs |
| Credit balances | M-Pesa transaction details |

The chain proves that records existed and were not altered, and it enforces process rules. Personal and location data stay off-chain for privacy. Published hashes allow any party to check that an off-chain record has not changed.

---

## 5. State machine and enforced rules

```
(none) → HARVESTED → VERIFIED → ACCEPTED → PROCESSED → END_USE
              └──→ REJECTED (terminal)
```

1. Stages occur in order, with no skipping and no reversal.
2. Only the correct role can trigger each transition: relayer (harvest), verifier, buyer, processor. An admin role grants roles.
3. A verifier address cannot hold the relayer role, so submissions are never verified by their own submitter.
4. **Mass balance:** accepted quantity ≤ verified harvest quantity; processed input ≤ accepted quantity; total `endUseKg` ≤ processed input.
5. Every transition emits an event, so the full history is publicly readable.

---

## 6. Circular impact credits

A circular impact credit is a unit recording **verified biomass that reached a real end use**. It is not a carbon credit. Carbon credits require registry-approved methodologies, baselines and third-party auditing, which are outside the prototype's scope. The design is intended to be mappable to carbon-market methodologies in future work.

Two instruments are minted from the same batch, in a single multi-token contract (ERC-1155):

| Instrument | Recipient | Meaning |
|---|---|---|
| Impact certificate | Buyer | Records the verified circular outcome the buyer funded |
| Work credit | Harvester (balance held by the relayer under the harvester's pseudonymous ID) | Records the verified work performed |

- **Earning rule:** one credit per verified kg that reaches end use (`endUseKg`).
- **No double counting:** credits are minted only at `END_USE`, only up to the mass-balance limit, and each kilogram is credited once per instrument.
- **Distinct claims:** the certificate records what was funded and the work credit records what was done, so the two do not overlap.

---

## 7. Roadmap

- Multi-verifier approval (2-of-N)
- End-use-weighted credits, valuing higher-impact uses more
- Simulated on-chain settlement reconciled against M-Pesa payments
- Redemption mechanisms for work credits (for example bonuses or equipment access)
- Mapping credits to recognised carbon-market methodologies

---

## 8. Limitations

- Harvester submissions pass through a relayer, so harvester-level non-repudiation depends on ZiwaClear's custody of that key.
- A single verifier role is a trust point until multi-verifier approval is added.
- Work credits are recorded but not yet redeemable.
- The prototype runs on a testnet.