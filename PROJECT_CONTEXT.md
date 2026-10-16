# ZiwaChain: Project Context and Technical Handoff

This file is written for an AI assistant that is continuing the build. Read it fully before doing anything. It covers who you are working with, the hackathon, what the product is, the architecture, every decision made so far, repo state, and what to do next.

Last updated: Oct 15, 2026.

---

## 1. How to work with the project owner

- The owner is the founder and lead developer of ZiwaClear. She is strong in TypeScript and new to Solidity, and works under a hard deadline.
- She wants to stay an **active participant** and understand the work, but cannot learn everything. Explain what each command or piece of code does. Offer teach-back checks on the parts that matter (the state machine, what is on-chain vs off-chain, trust assumptions).
- **Do not make assumptions on product decisions.** Lay out options, how each affects the product, and your advice. Ask all open decision questions together in one batch, never one at a time. She decides, then you advise.
- **Submission documents are for the judges.** Write them in the project's own voice. Never address her, never write them as if for her, no working notes inside them.
- Be honest about limits. Do not claim the chain proves "undeniable" truth: it proves a record existed and was not altered, not that the underlying facts were true. Do not call work credits carbon credits.
- Tone: warm, direct, informal. She pushes back when she disagrees, and honest pushback is welcome.

---

## 2. The hackathon

- **IEEE Global ClimateChain Hackathon 2026** (organised by IEEE Blockchain Türkiye Group with IEEE partners). Online hackathon on Devpost. Winners are announced around UN COP31.
- **Track entered:** Sustainable Supply Chains and Circular Economy (Track 3). It covers lifecycle tracking, waste and recycling traceability, sustainable sourcing verification, and circular-economy incentive structures.
- **Deadline:** official submission closes **Oct 25, 2026, 11:59 PM UTC** (2:59 AM Oct 26 in Kenya). **Internal deadline: Oct 24.** Do not move it.
- **Feature freeze: Oct 21.**
- **Scoring:** the page gave conflicting breakdowns. One says 70% technical innovation and blockchain implementation; another is a weighted list with climate impact and blockchain implementation at 30% each. Either way, blockchain implementation weighs most. This is why the project keeps a full contract and does not use thin hash-anchoring.
- **Required deliverables:**
  - Working prototype (testnet is fine)
  - Repo with documentation
  - Architecture diagram and technical spec
  - 3-minute demo video
  - Security and data integrity assessment
  - 2-page problem and solution overview
  - Climate impact assessment with carbon reduction projections (label estimates and cite sources)
  - Adoption strategy and scalability roadmap
  - User testing results, if any
- **Unverified (check the Devpost rules page):** whether a pre-existing project is allowed or work must be built during Oct 5–25 (frame ZiwaChain as new work started in the window); eligibility for Kenya; any chain or testnet requirements; what finalists must do at COP31.
- Related but separate deadlines for the same owner: **ZiwaVision submission Oct 22** and an **OctalFoundry add-on API submission Oct 25**. These are different projects. Reuse work between them where possible, but do not let them derail ZiwaChain.

---

## 3. Background: ZiwaClear and ZiwaVision

- **ZiwaClear:** a climate-smart biomass marketplace and early-warning platform for water hyacinth on Lake Victoria. SMS/USSD harvester intake, buyer dashboard, M-Pesa payouts.
- **ZiwaVision:** the satellite-based intelligence and forecasting component for hotspots. It is a separate deliverable, due Oct 22.
- **ZiwaChain** is an extension of ZiwaClear, not a new product. It must **not depend on ZiwaVision**. Hotspots are off-chain and referenced by hash with a plain `source` label (for example `ziwaclear-v1`), so ZiwaVision can plug in later without contract changes.

---

## 4. What ZiwaChain does

**Chain of custody:** Hotspot → Harvest → Verification → Buyer → Processing → End use.

**Product framing: harvester-first proof on top of the full chain.** Harvesters do the work and carry the risk but have no portable proof of what they delivered, what was verified, or what they were paid. ZiwaChain records each step on-chain, enforces the process rules in a contract, and gives each harvester a **certificate** they can hold and a **public verify page** anyone can use without logging in. Buyer-facing features are roadmap, but buyers stay in the chain because their on-chain acceptance and payment create the proof of settlement.

**What the proof is used for (be honest about adoption):**
1. Settling disputes (underpayment, short weight, "we never received it"). Works now because the buyer is already in ZiwaClear.
2. Building a verifiable track record for lenders such as SACCOs. Depends on lenders accepting it, so it is a pilot or roadmap claim.
3. Qualifying for results-based payments from NGOs or donors. Same dependency.

**Two-sided agreement:** the certificate carries the buyer's on-chain acceptance (their own wallet) and the harvester's SMS confirmation.

---

## 5. Architecture

```
Harvester (SMS/USSD)         ZiwaClear backend                Chain (Base Sepolia)
        │                          │                                  │
        │  report harvest ───────► │  logHarvest (via relayer) ─────► │ ZiwaChain.sol
        │                          │                                  │
Verifier wallet ─────────────────────────────  verifyBatch ─────────► │
Buyer wallet ────────────────────────────────  acceptBatch ─────────► │
        │  ◄─ confirmation code ── │  (M-Pesa payout happens off-chain)
        │  YES 4821 ─────────────► │  confirmSettlement (relayer) ──► │
Processor wallet ────────────────────────────  recordProcessing ────► │
Processor wallet ────────────────────────────  recordEndUse ────────► │ mints work credits
                                   │
                                   └─► certificate generator ─► harvester (SMS/PDF/QR)
                                                        │
                      Verify page (static, in-browser) ◄┘  recomputes hash, reads chain directly
```

### Components

1. **Smart contract** (`contracts/ZiwaChain.sol`): ✅ complete and tested.
2. **Off-chain ZiwaClear service:** database, relayer wallet, SMS parsing, canonical hashing. **Not yet built** (Task 2).
3. **Certificate generator:** not yet built (Task 3).
4. **Verify page:** not yet built (Task 5). Static page, no login, recomputes the hash in the browser and reads the chain via a public RPC.

### Contract summary

- Solidity 0.8.28, evmVersion `cancun`, OpenZeppelin v5 (`ERC1155`, `AccessControl`).
- **Roles:** `RELAYER_ROLE`, `VERIFIER_ROLE`, `BUYER_ROLE`, `PROCESSOR_ROLE`; `DEFAULT_ADMIN_ROLE` grants roles. The admin can later be handed to a multisig with no code change.
- **Stages:** None → Harvested → Verified | Rejected (terminal) → Accepted → Processed → EndUse.
- **Functions:**
  - `logHarvest(batchId, harvesterId, hotspotRef, quantityKg, evidenceHash, payloadHash)`: relayer only
  - `verifyBatch(batchId, approved, evidenceHash, payloadHash)`: verifier only; a verifier cannot hold the relayer role
  - `acceptBatch(batchId, acceptedKg, paymentRefHash, payloadHash)`: buyer only
  - `confirmSettlement(batchId, confirmationHash, payloadHash)`: relayer only; after acceptance; once per batch; does not change stage and does not gate credits
  - `recordProcessing(batchId, processType, inputKg, outputUnits, payloadHash)`: processor only
  - `recordEndUse(batchId, endUseType, endUseKg, outputUnits, payloadHash)`: the batch's own processor; may be called several times; mints credits
  - `correctRecord(batchId, supersededHash, newHash, reasonHash)`: only the original author of a hash; evidence and payload hashes only
  - `getBatch(batchId)`, `workCreditsOf(harvesterId)`, `supersededBy(batchId, hash)`
- **Mass balance:** accepted ≤ harvested; processed input ≤ accepted; total end-use kg ≤ processed input.
- **Credits:** ERC-1155 token ID 1 (`WORK_CREDIT`), one per kg reaching end use, **non-transferable** (enforced via `_update` hook, only minting from address(0) is allowed), minted to the relayer as custodian and tracked per pseudonymous ID in `workCreditsOf`. They are not carbon credits.
- **Events:** `HarvestLogged`, `BatchVerified`, `BatchAccepted`, `SettlementConfirmed`, `BatchProcessed`, `EndUseRecorded`, `RecordCorrected`, `CreditsIssued`.
- `processType` and `endUseType` are `bytes32` labels, so the taxonomy lives off-chain.

### On-chain vs off-chain

- **On-chain:** `batchId`, stage, role/actor addresses, per-batch pseudonym, quantities, hashes, credit balances.
- **Off-chain:** photos, names, phone numbers, exact GPS, satellite data, M-Pesa details, salts.

### Identity and hashing (specified, not yet implemented)

- Harvester identity is a **new pseudonym per batch**: `HMAC(server_secret, groupId || batchId)`. Never use a plain hash of a phone number (low entropy, brute-forceable). Per-batch pseudonyms keep batches unlinkable on a public chain, so the harvester controls who sees their history.
- **Canonical payload format:** deterministic serialisation (fixed field order, normalised timestamps, fixed number formats) plus a per-record random salt, so the verify page can recompute the exact same hash. Test this early, because most "verification failed" bugs come from serialisation.
- **Settlement co-sign:** at settlement ZiwaClear texts the harvester a code; their reply ("YES 4821") goes through the existing SMS parsing; the hash of that confirmation is recorded with `confirmSettlement`.

### Certificate and verify page (to build)

- Certificate (JSON, QR code, short code; PDF only if time allows) contains the canonical payload, salt, M-Pesa reference, on-chain transaction reference, and a verification code. It must be usable without ZiwaClear's database.
- Verify page: static, no login, in-browser recomputation, reads the chain directly.
- The "PROOF" SMS request (harvester texts PROOF and receives the code and link) is **simulated in the demo**.
- Do not build a public "list everything for group X" endpoint.

---

## 6. Decisions log

| # | Decision | Notes |
|---|---|---|
| 1 | Verifiers, buyers and processors sign with own wallets; harvesters go through a relayer | Harvesters on SMS/USSD hold no wallets |
| 2 | Stage, hashes and quantities on-chain with mass balance | Heaviest scoring area |
| 3 | Single verifier role | 2-of-N is roadmap |
| 4 | Payments off-chain (M-Pesa), hash reference on-chain | Simulated on-chain settlement is roadmap |
| 5 | Credit token | Work credits only; buyer impact certificate moved to roadmap |
| 6 | Hotspots off-chain, referenced by hash | Keeps independence from ZiwaVision |
| 7 | Demo includes a public page reading the chain | Now the certificate verify page |
| 8 | Base Sepolia | Check Devpost rules for chain requirements |
| C1 | Credits non-transferable (enforced via `_update` hook) | Minting only; transfers always revert |
| C2 | One buyer and one processor per batch | Splitting is roadmap |
| C3 | Rejected batch is terminal | |
| C4 | Admin is a single wallet for now | Multisig handover needs no code change |
| A | Harvester-first product on top of the full chain | Keep the contract for the blockchain score |
| B | New pseudonym per batch | Privacy is the harvester-first selling point |
| C | Settlement confirmation by SMS, recorded on-chain, no effect on credits | |
| D | Corrections for evidence and payload hashes only; quantities fixed | Wrong quantity: reject and re-log |
| E | Certificate (JSON, QR, short code) plus in-browser verify page; PROOF flow simulated; PDF if time allows | |
| F | Buyer impact certificate removed from the contract, kept on the roadmap | One mint line to restore |
| G | Hash correction: msg.sender when hash is first written is the author; only author can supersede | Role-based restriction was rejected |
| H | `confirmSettlement` allowed at Accepted, Processed or EndUse; once per batch; no stage change | |
| I | `recordEndUse` accumulates (partial calls allowed); credits minted per call | |
| J | Non-transferability enforced via `_update` override, not by overriding safeTransferFrom | Cleaner; also blocks burn |

---

## 7. Repo state (as of Oct 16, 2026, after Tasks 1-5)

```
ziwachain/
  PROJECT_CONTEXT.md              ← this file
  README.md                       ← judge entry point
  contracts/ZiwaChain.sol         ← complete, 42 tests
  test/ZiwaChain.ts               ← 42 contract tests
  test/hashing.test.ts            ← 18 hashing tests
  test/certificate.test.ts        ← 6 certificate tests
  test/verify.test.ts             ← 6 verify-page tests
  ignition/modules/ZiwaChain.ts   ← deploys with account 0 as admin
  hardhat.config.ts               ← Hardhat 2, TypeScript, 0.8.28, cancun, baseSepolia
  scripts/seed.ts                 ← deploys + runs 3 demo batches; writes demo-data.json
  scripts/make-certificates.ts    ← generates JSON certs, QR PNGs, audit notes
  scripts/demo-sms.ts             ← simulated SMS settlement and PROOF conversation runner
  src/hashing/                    ← RFC 8785 canonical JSON, salted keccak256, HMAC pseudonym
  src/certificate/                ← Version 1 certificate builder, QR generator, short code
  src/sms/                        ← gateway interface, simulated chat gateway, settlement/PROOF flow
  demo/demo-data.json             ← seeded batch records (3 batches, all stages)
  demo/certificates/              ← generated certificates and QR PNGs
  web/                            ← static verify page (esbuild bundle)
  web/dist/                       ← built bundle (no CDN)
  docs/architecture/spec.md       ← technical spec with 9 components
  docs/architecture/eventSchema.md ← event envelope and data model
  docs/security/assessment.md     ← threat model, RBAC, 85-test coverage
  docs/impact/impact-assessment.md ← methane avoidance projections
  docs/overview.md                ← 2-page problem and solution
  docs/adoption-and-scalability.md ← adoption strategy and scaling roadmap
  docs/demo-script.md             ← 3-minute video script
  docs/internal/PROGRESS.md       ← append-only build log
  .env                            ← DEPLOYER_PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, PSEUDONYM_SECRET
```

- **Test run:** `npx hardhat test` → 85 passing (42 contract + 18 hashing + 6 certificate + 6 verify + 13 sms).
- **Remaining tasks:** Task 7 (remaining judge-facing documents), Task 8 (skeptical review, no code changes).
- **Manual steps (done by owner, not tasks):** Base Sepolia deployment, demo video recording, hosting, Devpost submission.

---

## 8. Next steps (in order)

1. **Task 6 (complete):** Build simulated SMS settlement and PROOF flow in `src/sms/`, with tests and a `demo:sms` script (completed, 85/85 tests passing).
2. **Task 7 (current):** Remaining judge-facing documents: final review, synchronization, and completeness check across all judge-facing documentation.
3. **Task 8:** Skeptical review. Read every judge-facing document as a skeptical judge would. Flag any claim that outpaces the code, any missing limitation, any inconsistency. No new code. Fix prose only.
4. **Manual steps (owner does these, not tasks):** Base Sepolia deployment (`npx hardhat run scripts/seed.ts --network baseSepolia`), demo video recording following `docs/demo-script.md`, hosting public static verify page, Devpost submission. Internal deadline Oct 24; official close Oct 25 11:59 PM UTC.

---

## 9. Roadmap

Buyer-facing tools (impact certificates, dashboards, reports); 2-of-N verification; adjustment events for quantity errors after acceptance; simulated on-chain settlement reconciled with M-Pesa; redemption for work credits; lender statement bundles (Merkle root over chosen certificates); end-use-weighted credits; splitting a batch across buyers and processors; multisig admin; mapping to recognised carbon-market methodologies.

---

## 10. Known limitations (state these openly in the submission)

- Harvester submissions go through a relayer, so harvester-level non-repudiation depends on ZiwaClear's key custody.
- The SMS confirmation is a code-based agreement logged by ZiwaClear and the SMS provider, not a cryptographic signature.
- One verifier is a trust point.
- A quantity error found after acceptance cannot be fixed in this version.
- Buyers need wallets; the prototype uses test wallets.
- Credits are recorded but not yet redeemable.
- The prototype runs on a testnet.

---

## 11. Working with the IDE agent

- Build prompts live in `PROMPTS.md` (Prompt 0 is the standing context; Prompts 1–8 are the tasks in order). If you are continuing the build, use them or check which have been completed in `docs/internal/PROGRESS.md`.
- The agent keeps `docs/internal/PROGRESS.md` (append-only log), `docs/Learn/Errors.md` (errors and fixes), and this file up to date.
- Judge-facing documents: `docs/architecture/`, `docs/security/`, `docs/impact/`, `docs/overview.md`, `docs/adoption-and-scalability.md`, `docs/demo-script.md`. Written in the project's own voice; no working notes inside them.
- Working notes: `docs/internal/` and `docs/Learn/`. May address the owner directly.
- Function names in the contract are fixed: `logHarvest`, `verifyBatch`, `acceptBatch`, `confirmSettlement`, `recordProcessing`, `recordEndUse`, `correctRecord`.
- `learning/` directory: do not touch.
- `web/` directory: do not touch until Task 5.
