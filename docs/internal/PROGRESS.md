# ZiwaChain, Internal Progress Log

Append-only. Newest entry at the top.

---

## Oct 24, 2026, Task 13b: Add Provisional Two-Sided Trust Observation

### Files added or changed
| File | Change |
|---|---|
| `README.md` | Added the provisional reported funder-side scam observation and stated that paid-removal schemes appear to fail on trust from both sides. |
| `docs/overview.md` | Added the same provisional motivation; distinguished activity evidence from outcome evidence in the limits; and marked independent outcome evidence as an unvalidated roadmap item. |
| `docs/adoptionAndScalability.md` | Added the funder-side observation to Field Findings and identified funders and county programmes as prospective users of verified removal evidence, explicitly as an unvalidated hypothesis. |
| `docs/security/securityAndDataIntegrity.md` | Distinguished activity evidence from outcome evidence, stated the payment implication of missing verified harvest records, and documented unvalidated outcome-evidence roadmap ideas and limits. |
| `docs/security/whyBlockchain.md` | Added the activity-versus-outcome evidence boundary and the same unvalidated outcome-evidence roadmap limits. |
| `docs/demoScript.md` | Added the payment-against-records sentence. |

### What changed and why
- Recorded the reported, provisional funder-side scam alongside the reported harvester-side registration-fee scam without naming parties or adding unvalidated factual claims.
- Clarified that the current protocol supports activity evidence, not proof that ecological outcomes were caused by the activity.
- Kept independent outcome evidence, including satellite observation only after ZiwaVision validation, comparison sites, and seasonal baselines, clearly on the unvalidated roadmap.

### Tests
- Documentation-only change; no code or tests changed.

### Deviations from spec
None.

---

## Oct 22, 2026, Task 12: Integrate Field Findings into Judge-Facing Documents

### Files added or changed
| File | Change |
|---|---|
| `README.md` | Problem statement updated to lead with trust in paid removal and provisional Lake Victoria field observations; defined what ZiwaChain addresses (verifiable proof of delivery, verification, and payment) and what it does not (biomass supply, commercial demand, upfront cash scams); updated test suite count to 99; added "Commitment Before Work (Payer Pre-Funding / Escrow)" as first roadmap item; clarified "buyer" role as the accepting and paying party with no commercial buyer validated in the field; added Honest Limitations 11 (provisional field findings) and 12 (pilot design of downstream chain of custody). |
| `docs/overview.md` | Executive summary and problem statement updated to lead with trust in paid removal, cite provisional field findings with sample limits, and state what ZiwaChain addresses and does not; added clarification note on the "buyer" role (`BUYER_ROLE`) as the accepting and paying party; added "Commitment Before Work" as first roadmap item; added provisional field findings and downstream pilot status to Honest Limitations. |
| `docs/adoptionAndScalability.md` | Replaced placeholder in Section 5 with provisional field findings from Dunga, Homa Bay, and Kendu Bay; added "Who would accept the certificate" (natural verifiers: BMU officials and fisheries officers; possible payers: county programmes, NGOs/donors, processors); added "What costly problem it solves for them"; added "What could make them reject it" as pilot hypotheses (distrust from scam, immediate pay expectations, no clear payer, digital friction); updated Section 3 roadmap to place "Commitment Before Work (Escrow)" first in Phase 2; clarified buyer role and downstream pilot status; corrected duplicate Section 5 heading to Section 6. |
| `docs/demoScript.md` | Reworked opening 30 seconds (0:00 - 0:30) to lead with grounded field findings on trust in paid removal, seasonal weed arrival, and scam distrust; explicitly highlighted in storyboard and narration that payment (`acceptBatch`) and harvester confirmation (`confirmSettlement`) occur before certificate issuance; clarified buyer role as accepting and paying party and emphasized commitment before work in closing roadmap. |
| `docs/impact/climateImpactAssessment.md` | In Section 1, integrated provisional field observations documenting seasonal weed arrival (July-August) and localized distribution (multi-year absence at Dunga, minimal weed at Homa Bay); explicitly stated that continuous supply is not projected; in Section 2, clarified buyer role as accepting and paying party and downstream stages as pilot design; in Section 5, relabeled 10,000 t projection as an illustrative seasonal peak campaign scenario; in Section 8, explicitly labeled all core assumptions. |
| `docs/architecture/architecture.md` | Updated component breakdown to clarify that natural verifiers are BMU officials and county fisheries officers; clarified that "buyer" (`BUYER_ROLE`) is the accepting and paying party with no commercial buyer validated in the field; updated demo data note to include Batch D and explain provisional field findings and downstream pilot status. |
| `docs/architecture/eventSchema.md` | In Section 9, added "Commitment before work" as the first roadmap item; in Section 10, clarified buyer role as accepting and paying party, noted BMU/fisheries officers as natural verifiers, and documented provisional field findings and downstream pilot status. |
| `docs/architecture/gasCostEstimate.md` | Replaced em dash in header alert with colon; updated test suite measurement count from 94 to 99 passing tests. |
| `docs/security/whyBlockchain.md` | In Section 0, clarified buyer role as accepting and paying party, noted BMU/fisheries officers as natural verifiers, and stated that downstream stages are a pilot design; in Section 4, added honest limitations on buyer validation, downstream pilot design, and provisional field findings. |
| `docs/internal/PROGRESS.md` | Added Task 12 progress entry recording all file updates, design rationale, and test verification. |

### What changed and why
1. **Trust in Paid Removal & Field Findings:**
   - Grounded all problem statements in provisional fieldwork conducted around Dunga, Homa Bay, and Kendu Bay on Lake Victoria (Oct 18 to 19, 2026, small sample of conversations).
   - Identified trust in paid removal as the primary operational bottleneck: fishers would harvest if paid, but expect immediate payment and distrust harvesting schemes due to a reported scam where registration fees were collected and the organizer disappeared.
   - Documented seasonal and localized weed occurrence (arriving ~July, leaving ~August, causing ~1 week lost fishing when blocked; multi-year absence at Dunga, minimal weed at Homa Bay).
   - Explicitly articulated what ZiwaChain addresses (verifiable proof of delivery, verification, and payment that harvesters can hold; operator-independent shared trust) and what it does not address (supply, demand, or cash fee scams by themselves).
2. **Buyer Role Clarification:**
   - Clarified across all judge-facing documentation that the "buyer" role (`BUYER_ROLE`) designates the accepting and paying party (whether a commercial processor, a municipal/county public works programme, or an environmental donor fund).
   - Transparently stated that no commercial buyer was validated in the field (local biogas demonstration sites source their own feedstock).
   - Kept all smart contract, TypeScript interfaces, and test identifiers strictly unchanged.
3. **Commitment Before Work as Priority Roadmap Item:**
   - Positioned "Commitment Before Work (Payer Pre-Funding / Escrow)" as the very first roadmap item across README, overview, adoption, and event schema documents.
   - Explained that locking or committing funds into escrow before harvest begins directly addresses harvester distrust and protects against registration fee scams.
   - Documented that today payment occurs off-chain via M-Pesa with on-chain payment hashes and two-way SMS co-signing.
4. **Adoption Pathway & Pilot Hypotheses:**
   - Completed Section 5 of `docs/adoptionAndScalability.md` with provisional field facts, sample limits, and natural verifier roles (BMU officials and county fisheries officers who already manage landing beach communication).
   - Formulated concrete hypotheses to test in pilot deployments regarding scam distrust, immediate payment expectations, lack of commercial buyers, and digital format accessibility.
5. **Demo Script Refinements:**
   - Refocused the 3-minute video script opening (0:00 - 0:30) on field realities and trust in paid removal.
   - Emphasized that the harvester certificate is generated only after payment and SMS settlement confirmation are permanently recorded on Base Sepolia.
6. **Climate Impact Seasonality & Assumptions:**
   - Reframed `docs/impact/climateImpactAssessment.md` to avoid projecting continuous supply.
   - Relabeled the 10,000 t model as an illustrative seasonal peak campaign scenario, and explicitly labeled all modeling assumptions in Section 8.
7. **Standards Compliance:**
   - Zero code, contract, or test edits made.
   - Zero em dashes present in any judge-facing documentation.
   - All 99 automated tests passing.

### Tests
- 99 / 99 passing (`npm test`).

### Deviations from spec
None.

---

## Oct 22, 2026, Task 11: Flag Reuse of Evidence Hash Across Batches

### Files added or changed
| File | Change |
|---|---|
| `contracts/ZiwaChain.sol` | Added `mapping(bytes32 => bytes32) public evidenceFirstBatch` and `event EvidenceReused(bytes32 indexed batchId, bytes32 indexed firstBatchId, bytes32 evidenceHash)`. In `logHarvest`, if `evidenceHash != 0`: registers `evidenceFirstBatch` on first use, or emits `EvidenceReused` on reuse and continues normally without reverting or declaring fraud. |
| `scripts/seed.ts` | Added Batch D which logs a harvest reusing Batch A's field photo evidence hash (`harvestEvidenceA`), demonstrating on-chain reuse flagging without modifying Batches A through C. |
| `web/config.ts` | Added `evidenceFirstBatch` view function and `EvidenceReused` event declaration to `ZIWACHAIN_ABI`. |
| `web/index.html` | Added "Load Batch D (Duplicate Evidence)" quick demo button. |
| `web/main.ts` | Added duplicate evidence audit check querying `EvidenceReused` events where the batch is `batchId` or `firstBatchId`. If found, displays amber notice: "This evidence also appears in batch `<id>`. It is flagged for human review. This is not a finding of fraud." Configured to never turn a valid certificate red. Added `SAMPLE_BATCH_D` and click listener. |
| `web/style.css` | Styled `.check-item.notice` with amber background (`var(--warning-light)`) to complement amber border. |
| `test/ZiwaChain.ts` | Added 4 automated unit tests for duplicate evidence flagging: first use sets `evidenceFirstBatch` with no event; reuse emits `EvidenceReused` and both batches continue normally; zero evidence hash is never flagged; mass balance and credits are unaffected. |
| `test/verify.test.ts` | Added automated verification algorithm test validating that duplicate evidence triggers the amber notice without failing verification or turning red. |
| `docs/security/securityAndDataIntegrity.md` | Added Threat 2.10 explaining what duplicate evidence flagging does and what it does not detect (strictly detects identical byte-for-byte evidence hashes, not similar or re-compressed photos; flag only without reverting); added Limitation 11; updated test count to 99 tests. |
| `docs/architecture/eventSchema.md` | Documented `EvidenceReused` event in stage events and added Rule 8 in State Machine and Enforced Rules. |
| `README.md` | Added duplicate-evidence flagging to built features; updated test count to 99; removed duplicate-evidence flagging from Roadmap; added Honest Limitation 10. |
| `docs/adoptionAndScalability.md` | Updated test count from 94 to 99; added duplicate evidence flagging to Horizon 1 built features; removed it from Horizon 3 roadmap items. |
| `docs/overview.md` | Updated contract test count from 44 to 48 and total test suite count from 94 to 99. |
| `docs/demoScript.md` | Added a dedicated 20-second duplicate evidence demonstration moment (2:25 - 2:45) submitting Batch D with reused evidence and showing the amber notice; updated test count to 99 tests; replaced em dashes. |

### What changed and why
1. **Contract minimal change:** `evidenceFirstBatch` mapping and `EvidenceReused` event added to `ZiwaChain.sol`. In `logHarvest`, non-zero evidence hashes record the initial batch or emit the event. Strictly non-reverting and does not declare fraud, adhering to the "flag only" principle.
2. **Demo seeding:** Batch D added to `seed.ts` reusing Batch A's evidence hash. Demonstrates that both batches exist and can proceed normally.
3. **Verify page audit check:** Browser client collects `EvidenceReused` events. If a batch is involved either as original creator (`firstBatchId`) or subsequent submitter (`batchId`), an amber notice is rendered pointing to the other batch. Valid certificates retain green verified status.
4. **Comprehensive testing:** 5 new tests added (4 smart contract, 1 client verification algorithm), bringing test suite from 94 to 99 passing tests.
5. **Roadmap and docs cleanup:** Removed duplicate-evidence flagging from roadmap sections across README and adoption docs since it is now built; documented boundary limits (catches bit-for-bit identical hashes only, not similar photos).

### Tests
- 99 / 99 passing (`npm test`).

### Deviations from spec
None.

---

## Oct 22, 2026, Task 10: Positioning Pass Over Judge-Facing Documents

### Files added or changed
| File | Change |
|---|---|
| `README.md` | Added shared-trust definition sentence after opening paragraph; added 4 roadmap items (external evidence connectors, verifier correction request state, export mappings, duplicate-evidence flagging); added Honest Limitations 8 (hash proves integrity not truth) and 9 (illustrative demo data). |
| `docs/overview.md` | Rewrote Executive Summary opening to include shared-trust sentence and dMRV framing with explicit no-standard-compliance caveat; renamed Pillar 2 to "Separation of Duties and Field Attestation" and rephrased to use "attestation"; added Limitations 6 (hash proves integrity not truth) and 7 (illustrative demo data). |
| `docs/security/whyBlockchain.md` | Added Section 0 "The Shared-Trust Test" answering when a signed log is sufficient and why ZiwaChain still needs a chain; integrated dMRV framing and "attestation" language into Sections 3 and 4; strengthened hash-vs-truth honesty note. Rewritten as a complete file. |
| `docs/security/securityAndDataIntegrity.md` | Fixed test count 85 -> 94 in executive summary; renamed "Verifier Identity Immutably Logged" to "Verifier Attestation Immutably Logged" and updated wording in §2.2; renamed limitation 5 to "Single Verifier Attestation"; normalised & -> and in limitation 8; added limitation 10 (hash proves integrity not truth). |
| `docs/adoptionAndScalability.md` | Fixed test count 85 -> 94 in Horizon 1 and in Mermaid timeline; replaced "Completed & Built" with "Completed and Built"; added 3 Horizon 3 roadmap items (external evidence connectors, export mappings, duplicate-evidence flagging) and 1 Horizon 2 item (verifier correction request state); added Section 4 "Existing Tools and Complementary Systems"; replaced Field Findings callout block with structured TO BE ADDED section with three named headings (who would accept, what costly problem, what would make them reject); renumbered Field Findings as Section 5. |
| `docs/demoScript.md` | Changed verifyBatch visual-column description from "Demo verifier account approves lot" to "issues an on-chain attestation approving the lot". |

### What changed and why
1. **Shared-trust sentence (Item 1):** Added verbatim to README and overview. Kept Lake Victoria, SMS, harvester-first framing intact. Not generalised.
2. **Shared-trust test (Item 2):** New Section 0 in whyBlockchain.md. States clearly that a signed log should be used when one operator is trusted; then answers why ZiwaChain still needs a chain.
3. **Attestation vocabulary (Item 3):** "A verifier's decision" -> "a verifier's attestation" in overview, security, adoption and demo docs. dMRV framing added to overview executive summary and whyBlockchain Section 3. No standard-compliance claim made anywhere.
4. **Existing tools section (Item 4):** Added to adoptionAndScalability.md Section 4. Describes hotspotRef and source as integration points. No named product cited. No competitor feature claims.
5. **Hash proves integrity not truth (Item 5):** Added as a dedicated limitation in README, overview, securityAndDataIntegrity, and whyBlockchain. Wording is plain and direct.
6. **Roadmap additions (Item 6):** Four items added consistently across README and adoptionAndScalability. All labelled "Roadmap, not built".
7. **Field findings (Item 7):** Replaced opaque NOTE block with three headed placeholder sections exactly as specified.

### Claim-vs-code check on whyBlockchain.md
- Section 2 table row "Each party's own signature is native" -- verified: buyers, verifiers, processors use own wallets; harvesters go through relayer (disclosed in Section 4).
- Section 3 "Verification runs in the reader's browser" -- verified by web/main.ts (JsonRpcProvider, no server call).
- Section 3 "forbids a submitter from verifying its own harvest" -- verified: VerifierCannotBeRelayer check in ZiwaChain.sol.
- Section 0 "Can two or more independent parties rely on the same record..." -- verified by public contract on Base Sepolia and in-browser verify page.
- No new factual claims introduced; all additions are either restatements of existing code properties or explicit roadmap labels.

### Tests
- 94 / 94 passing (no code changes in this task; test run confirms docs-only edits did not disturb any file read by tests).

### Decisions made or clarified
- dMRV framing: added as "in the spirit of dMRV practice" with explicit "does not claim compliance with any specific dMRV standard" in two places. Not a compliance claim.
- "Attestation" applied to verifier decisions only, not to harvester SMS confirmation (which remains "telecom-attested co-sign").
- Named products: none named in Existing Tools section; generic capability description only.
- Field Findings: HTML comments used for the placeholder instructions so they do not appear in rendered markdown.

### Deviations from spec
None.

### Open questions and risks
- Swahili text in web/certificate.html is still marked for owner review (from Task 9). Not touched in this task.
- Base Sepolia deployment and demo video are manual steps remaining before Oct 24 internal deadline.

### Next step
Manual steps by owner: Base Sepolia deployment, demo video, hosting, Devpost submission. No further code or doc tasks identified.

---

## Oct 17, 2026, Task 9: Prototype Improvements

### Files added or updated
| File | Action |
|---|---|
| `web/index.html` | Updated: Set button labels to spec-exact "Load valid demo certificate", "Load tampered demo certificate", and "Load Batch C (Corrected)" working from bundled data. |
| `web/main.ts` | Confirmed demo buttons work directly from bundled sample data (`SAMPLE_BATCH_A` and 1 kg tampered variation) with only chain reads needing network. |
| `web/certificate.html` | Created: Printable bilingual (English / Swahili) A5 certificate page. Loads certificate JSON via paste or URL fragment, renders all required fields (batch ID, harvest date, verified weight, buyer acceptance, payment reference, SMS confirmation, work credits, short code), displays QR code if present, and includes an honest bilingual disclaimer. Swahili text marked for owner review. |
| `web/dist/` | Re-bundled: `bundle.js`, `index.html`, and `certificate.html` copied into dist by `npm run web:build` |
| `docs/architecture/gasCostEstimate.md` | Created: Gas cost estimate using real figures from `hardhat-gas-reporter` v2.3.0 (94 tests). Per-function gas units table, full journey total (708,238 gas), low/high ETH and USD estimate ranges with stated sources. Clearly labelled ESTIMATE throughout. |
| `docs/architecture/gasReport.txt` | Generated: Raw hardhat-gas-reporter output from `REPORT_GAS=true npx hardhat test` |
| `hardhat.config.ts` | Updated: Added `@nomicfoundation/hardhat-verify` import, Etherscan V2 `etherscan: { apiKey }` block (single key, no deprecated customChains), and `gasReporter` config with `outputFile` and `enabled: process.env.REPORT_GAS === "true"` |
| `.env.example` | Updated: Added `ETHERSCAN_API_KEY` entry with comment explaining Etherscan V2 covers Base Sepolia |
| `scripts/seed.ts` | Updated: Added `adminAddress: deployer.address` to `demoData` output so `scripts/verify.ts` can read it; added `paymentSalt?: string` to `StageRecord` interface |
| `scripts/verify.ts` | Created: Reads `demo/demo-data.json` for `contractAddress` and `adminAddress`, submits Etherscan V2 verification using `hardhat verify:verify`. Does NOT deploy; operator runs after seed. |
| `package.json` | Updated: Added `"verify:contract"` script; updated `web:build` and `web:dev` to also copy `web/certificate.html` to dist |
| `docs/security/whyBlockchain.md` | No code changes needed; verified all claims match code and contract. Linked from `README.md` and `docs/security/securityAndDataIntegrity.md`. See Item 5 notes below. |
| `docs/security/securityAndDataIntegrity.md` | Updated: Linked to `whyBlockchain.md`; added honest disclosures on SMS simulation, intended physical inspection/weighbridge processes, and illustrative demo data |
| `docs/architecture/architecture.md` | Updated: Disclosed SMS gateway simulation, intended field inspection/weighbridge processes, and illustrative demo data in component breakdown |
| `docs/architecture/spec.md` | Updated: Changed "real demo batches" to illustrative demo data, disclosed SMS simulation and intended physical processes |
| `README.md` | Updated: Test count 85 → 94; added `whyBlockchain.md` and `gasCostEstimate.md` to docs table; added printable certificate note; added Basescan verification step; added demo batch illustrative-data disclaimer and limitations 8 & 9 |
| `docs/overview.md` | Updated: Overclaim pass (Items 5 & 6): SMS gateway labelled simulated; field inspection labelled as intended real-world process not yet built into prototype; demo batches labelled as illustrative; telecom integration row updated; test count 85 → 94 |
| `docs/demoScript.md` | Updated: Overclaim pass (Item 6): demo data labelled illustrative; SMS gateway labelled simulated; field verifier labelled as demo account in prototype; tamper test updated to use demo button; test count 85 → 94 |
| `docs/internal/PROGRESS.md` | Updated: This entry |

### Item 5: whyBlockchain.md — Claims vs Code Audit
All 5 sections were read against the contract and tests. No claim contradicts the code. Changes made: **none** (no wording needed to change; all claims are either faithful to the contract or already qualified as roadmap). Specific checks performed:

- Section 2 table "Each party's own signature is native to the system" — verified buyers, verifiers, processors use their own wallets; harvesters go through relayer (already disclosed in Section 4).
- Section 3 "contract enforces who may act at each stage" — verified by RBAC and stage guards in `ZiwaChain.sol`.
- Section 3 "Verification runs in the reader's browser" — verified by `web/main.ts` which uses `JsonRpcProvider` with no server-side call.
- Section 4 "Harvesters do not sign for themselves" — accurate and present in the doc.
- Section 4 "One admin wallet" — accurate; multisig roadmap already noted.
- The doc does not use "undeniable" or "carbon credits" — confirmed.

`README.md` and `docs/security/securityAndDataIntegrity.md` now link to `whyBlockchain.md` so judges see it.

### Item 6: Overclaim pass — changes made
| Document | Change |
|---|---|
| `docs/overview.md` | Pillar 1: added "SMS gateway is simulated in the prototype". Pillar 2: added "field inspection represents the intended real-world process; prototype uses demo accounts". Pillar 4: added "buyer is a demo account and M-Pesa reference is illustrative demo data". Built/Roadmap table: demo data disclaimer and telecom row clarification. |
| `docs/demoScript.md` | Harvest to End Use row: labelled data as illustrative, verifier as demo account, SMS as simulated. Verify page row: referenced demo buttons and clarified network call is to Hardhat/Sepolia. Roadmap row: added "what is not built" and "demo data" bullets. Test count 85 → 94. |
| `README.md` | Run Test Suite description updated. Seed description added "illustrative data, not real harvests". Honest limitations 8 & 9 added for field inspection/weighbridge and demo data. |
| `docs/architecture/architecture.md` | Disclosed SMS gateway simulation, intended field inspection/weighbridge processes, and illustrative demo batches in Component Breakdown. |
| `docs/architecture/spec.md` | Removed "real demo batches" phrasing; added disclosures for simulated SMS and intended physical checks. |
| `docs/security/securityAndDataIntegrity.md` | Added Section 4 disclosures 8 & 9 and linked to `whyBlockchain.md`. |

### Test results
- `npx hardhat test` passes **94 / 94** tests (unchanged from Task 8).
- `npm run web:build` completes in ~61ms, 0 errors.
- `npx tsc --noEmit` passes with 0 errors (to be confirmed on each code change).

### Decisions made or clarified
- Printable certificate Swahili text: marked with `<!--[SW for review]-->` and `<!--[SW: ...]-->` inline comments throughout `web/certificate.html`. Owner must review before presentation.
- `verify:contract` npm script is NOT listed as a required-test target in `links.test.ts` (it references `scripts/verify.ts`, which is checked by the script path test, but requires `--network baseSepolia` and a live deployment; running it locally would fail). The test checks the file exists on disk, which it does.
- Gas reporter is disabled by default (no `REPORT_GAS` flag set). Costs are estimates; the L1 data fee on Base L2 dominates over L2 execution cost.
- Etherscan V2 configuration: single `apiKey` string under `etherscan`. No `customChains` added. `@nomicfoundation/hardhat-verify` v2.1.3 (installed) resolves Base Sepolia automatically via the V2 API.



## Oct 17, 2026, Task 8: Skeptical Review Implementation & Protocol Hardening

### Files added or updated
| File | Action |
|---|---|
| `contracts/ZiwaChain.sol` | Updated: Defined `InvalidHash()` custom error. Reordered `recordEndUse` to update `workCreditsOf` before `_mint` (Checks-Effects-Interactions pattern). Restricted `correctRecord` to evidence and payload hashes only (removed `paymentRefHash` and `confirmationHash` from `_recordHash`), and enforced `if (newHash == bytes32(0)) revert InvalidHash()`. Added NatSpec documentation on custodian `IERC1155Receiver` requirement. |
| `contracts/test/PlainRelayer.sol` | Created: Minimal test contract without `IERC1155Receiver` to test and document revert behavior when `recordEndUse` targets an incompatible contract custodian. |
| `src/sms/flow.ts` | Updated: Assembled canonical `SettlementConfirmationPayload` (schemaVersion, eventType `SETTLEMENT_CONFIRMED`, batchId, confirmedAt), computed `payloadHash = hashRecord(payload, salt)`, passed both `confirmationHash` and `payloadHash` to on-chain `confirmSettlement`, and stored salt and payload in `BatchContext`. |
| `src/certificate/build.ts` | Updated: Extended `HarvesterCertificate` interface and builder to accept optional `paymentSalt` from `BUYER_ACCEPTED` stage, allowing client-side payment verification. |
| `scripts/seed.ts` | Updated: Captured `paymentSalt` during buyer acceptance and stored in batch records so downstream certificate builders retain it. |
| `scripts/makeCertificates.ts` | Updated: Injected `paymentSalt` into generated certificates. |
| `web/main.ts` | Updated: Hardened Step 2 verification to match every stage in the certificate against its corresponding emitted on-chain event's `payloadHash` and `txHash` (tampered/recomputed payloads fail). Verified certificate `pseudonym` strictly matches `getBatch().harvesterId`. Recomputed plain `paymentRef` hash with `paymentSalt` and verified match against on-chain `paymentRefHash` and `BUYER_ACCEPTED` payload. Rendered distinct amber banner for `Stage.Rejected` batches ("This record is authentic, but the batch was rejected at verification. No credits were issued.") while prohibiting green verified banner. |
| `web/style.css` | Updated: Added `.status-banner.rejected` styling with distinct amber color and icon. |
| `web/dist/` | Re-bundled: Updated production web bundle (`bundle.js`, `style.css`) via esbuild. |
| `test/ZiwaChain.ts` | Updated: Added test validating `correctRecord` reverts with `InvalidHash` when `newHash` is `bytes32(0)` (9e), and test validating `recordEndUse` reverts with `ERC1155InvalidReceiver` if custodian contract lacks `IERC1155Receiver` (9f). |
| `test/verify.test.ts` | Updated: Added tests asserting verification failure on re-hashed payload tampering (9a), harvester pseudonym mismatch (9b), payment reference mismatch (9c), and rejection amber banner assertion (9d). |
| `test/links.test.ts` | Created: Automated test verifying that all markdown relative links across `README.md` and `docs/` resolve to existing files on disk, and all `package.json` scripts target existing script files. |
| `README.md` & `PROJECT_CONTEXT.md` | Updated: Synchronized documentation links and npm scripts to match disk, added Checks-Effects-Interactions pattern note, custodian `IERC1155Receiver` note, and multi-relayer custodian roadmap note. |
| `docs/security/securityAndDataIntegrity.md` | Updated: Updated test count to 94 tests, documented stage-by-stage event log binding, CEI pattern in `recordEndUse`, custodian contract receiver limitation, and multi-relayer roadmap item. |
| `docs/internal/PROGRESS.md` | Restored as the single project progress log with complete history and Task 8 review fixes. |

### Test and execution results
- `npx hardhat test` passes 94/94 tests (44 contract tests, 18 hashing tests, 6 certificate tests, 10 verify tests, 13 SMS tests, 3 link/script integrity tests).
- `npx tsc --noEmit` passes with 0 errors.
- `npm run web:build` bundles cleanly with 0 errors.

### Decisions made or clarified
- Verify page event binding: Step 2 now actively iterates over every stage in the certificate, maps to the corresponding on-chain event by topic and `batchId`, and asserts `payloadHash` and `transactionHash` equality. Tampering with payload content and recomputing its hash now causes verification to fail because the recomputed hash does not match the on-chain event log.
- Pseudonym binding: Certificate `pseudonym` is checked against `getBatch(batchId).harvesterId`.
- Payment reference verification: The plain payment reference in the certificate is hashed as `hashRecord({ receipt: paymentRef }, paymentSalt)` and matched against on-chain `batch.paymentRefHash` and the `BUYER_ACCEPTED` payload hash.
- Rejected batch UX: Separated cryptographic record authenticity from batch business approval. Rejected batches display an amber banner and never the green verified banner.
- Custodian check on `confirmSettlement`: Explicitly not approved for prototype single-relayer deployment. Documented as a roadmap item and security limitation.
- Contract CEI & correctRecord: `_workCredits` state updated before `_mint`. `correctRecord` restricted to evidence and payload hashes only, and zero hash reverts with `InvalidHash`.

---

## Oct 16, 2026, Task 7: Draft Hackathon Submission Documents in docs/ for Judges

### Files added or updated
| File | Action |
|---|---|
| `README.md` | Updated: 3-sentence summary, problem overview, comprehensive Quick Start (install, test, seed, build and open verify page, run SMS demo), documentation directory table linking all judge documents, folder layout, built vs roadmap breakdown, and honest limitations |
| `docs/architecture/architecture.md` | Created: Primary architecture document with 3 Mermaid diagrams (system components, stage state machine, settlement confirmation sequence), on-chain vs off-chain boundary matrix, and roles access control matrix |
| `docs/security/security-and-data-integrity.md` | Created: Primary threat model and data integrity assessment analyzing 9 specific threats (relayer key compromise, colluding verifiers, identity brute-forcing, forged certificates, mass inflation, canonicalization drift, privacy/PII leaks, credit trading, admin keys), referencing contract rules and tests, with honest limitations |
| `docs/impact/climate-impact-assessment.md` | Created: Primary climate impact assessment with clearly labeled emissions avoidance estimates per wet ton (0.18 to 0.73 t CO2e/t wet hyacinth combining avoided anaerobic decomposition and displaced woodfuel/charcoal), IPCC/ICRAF citations, co-benefits, and explanation of why work credits are not carbon credits |
| `docs/adoption-and-scalability.md` | Updated: Detailed three-tiered proof acceptance pathway (dispute settlement now, SACCO lending next, results-based funding later), Winam Gulf pilot plan (Dunga, Usenge, Kendu Bay), 3-horizon scaling roadmap, and clearly marked "Field findings" section with `[TO BE ADDED AFTER KISUMU]` |
| `docs/overview.md` | Updated: 2-page problem and solution overview detailing Lake Victoria crisis, informal harvester precarity, asymmetric architecture, 6 core pillars, prototype vs roadmap, and updated test suite count (85 tests) |
| `docs/demo-script.md` | Updated: Precise 3-minute video presentation script with timestamps (0:00-0:30 problem, 0:30-1:30 harvest to end use run, 1:30-2:00 certificate and QR, 2:00-2:45 verify page and tamper detection, 2:45-3:00 roadmap and limits), visual layout, narration, and presenter pacing guidelines |

### Verification and Consistency
- All documents written in the project's own voice (we/ZiwaChain), never addressed to the owner.
- Every figure requiring empirical confirmation marked with `[TO BE CONFIRMED]`.
- All emissions projections clearly labeled as estimates with explicit formulas and assumptions.
- Punctuation audited: zero em dashes across all judge-facing documentation (commas used).

---

## Oct 16, 2026, Task 6: Build Simulated SMS Settlement and Proof Flow in src/sms/ with Tests

### Files added or updated
| File | Action |
|---|---|
| `src/sms/gateway.ts` | Created: `SmsGateway` interface, phone masking utility (`maskPhone`), and `SimulatedGateway` class formatting readable SMS chat exchanges to stdout |
| `src/sms/flow.ts` | Created: Full two-leg SMS conversation flow (`requestConfirmation`, `handleIncoming`, settlement confirmation OTP generation, relayer on-chain `confirmSettlement`, retry limit, and `PROOF` certificate delivery) |
| `src/sms/index.ts` | Created: Module re-exports for gateway, flow, and masking utilities |
| `test/sms.test.ts` | Created: 13 automated unit tests covering inbound message parsing, whitespace trimming, case-insensitivity, wrong codes, retry count exhaustion, unknown sender rejection, on-chain `confirmSettlement` recording, idempotency/re-entry graceful refusal, and phone masking privacy |
| `scripts/demo-sms.ts` | Created: Interactive end-to-end conversation demonstration script deploying contract, executing batch to Accepted, running OTP exchange, executing on-chain confirmation, and responding to PROOF request |
| `package.json` | Updated: Added `demo:sms` script (`npx hardhat run scripts/demo-sms.ts`) |

### Test and execution results
- `npx hardhat test` passes 85/85 tests (42 contract tests, 18 hashing tests, 6 certificate tests, 6 verify-page tests, 13 SMS flow tests).
- `npx tsc --noEmit` passes with 0 errors.
- `npm run demo:sms` runs the complete conversation against local Hardhat node, printing formatted chat exchanges, contract transactions, on-chain settled status, and certificate verification URL.

### Decisions made or clarified
- Phone number privacy: Phone numbers are masked in all logs and outputs (e.g., `+2547****678`) and are strictly never stored on-chain.
- Decoupled gateway architecture: `SmsGateway` defines an interface (`send`, `onReceive`, `simulateInbound`) so that ZiwaClear's production SMS pipeline (such as Africa's Talking, Twilio, or Safaricom USSD gateway) can replace `SimulatedGateway` without modifying any business logic in `flow.ts`.
- Two-leg conversation design:
  1. Post-acceptance settlement: 4-digit OTP generated and held in memory; harvester replies `YES <code>` (case-insensitive, whitespace tolerant); relayer computes salted `hashConfirmation(code, salt)` and calls `confirmSettlement` on-chain.
  2. Proof request: Harvester sends `PROOF` at any time; receives their Crockford Base32 short code and verify URL.
- Resiliency and security: Max 3 retry attempts before locking out and sending support contact info; unknown phone numbers and malformed messages are ignored silently to prevent enumeration attacks; duplicate confirmations are refused gracefully with informative notice.

---

## Oct 16, 2026, Task 5: Build Public Verify Page in web/ (Zero Framework, In-Browser Verification)

### Files added or updated
| File | Action |
|---|---|
| `web/config.ts` | Created: Public Base Sepolia default RPC, query override (`?rpc=`), stage labels, and contract event/view ABI |
| `web/style.css` | Created: High-contrast responsive styling with dark/light mode (`prefers-color-scheme`), timeline, checklist indicators, and mass balance visualizer |
| `web/index.html` | Created: Plain HTML static UI with browser privacy trust banner, honest disclosure notice, certificate input panel, and live verification report card |
| `web/main.ts` | Created: Browser-side TypeScript verification engine executing 5 independent verification steps, parsing Base64URL fragment (`#c=`), textarea paste, and file upload |
| `package.json` | Updated: Installed `esbuild` as devDependency, added `web:build` and `web:dev` scripts |
| `web/dist/` | Generated: Bundled static distribution files (`bundle.js`, `style.css`, `index.html`) produced by esbuild |
| `test/verify.test.ts` | Created: Automated test suite validating all 5 verification steps against a live deployed ZiwaChain contract |
| `docs/architecture/spec.md` | Updated: Added Component 7 documenting the public verify page architecture and verification pipeline |
| `docs/security/assessment.md` | Updated: Updated test suite count to 72 passing tests |

### Test and execution results
- `npx hardhat test` passes 72/72 tests (42 contract tests, 18 hashing tests, 6 certificate tests, 6 verification tests).
- `npx tsc --noEmit` passes with 0 errors.
- `npm run web:build` bundles `web/main.ts` into `web/dist/bundle.js` in ~80ms (zero external CDN dependencies, self-contained).

### Decisions made or clarified
- Client-side trust architecture: no backend server or API is ever contacted, verification reads directly from the blockchain via ethers v6 JsonRpcProvider and recomputes hashes in browser memory.
- Certificate transfer via URL fragment (`#c=`) prevents certificate payloads and harvester metadata from appearing in web server access logs.
- Honest verification disclosure: the page prominently explains that verification proves cryptographic immutability and rules adherence, but cannot verify whether physical measurements were true when recorded.
- Corrected records queried through `supersededBy` are clearly labeled as "superseded by a newer record", showing both hashes rather than triggering an erroneous verification failure.

---

## Oct 16, 2026, Task 4: Build Harvester Certificate Generator and Pipeline

### Files added or updated
| File | Action |
|---|---|
| `src/certificate/shortCode.ts` | Created: Deterministic 10-character Crockford Base32 SMS short code generator formatted with hyphen |
| `src/certificate/build.ts` | Created: Version 1 Harvester Certificate builder with Base64URL encoding/decoding utilities |
| `src/certificate/qr.ts` | Created: Browser-safe and Node-safe QR code generator emitting PNG Data URLs with URL payload fallback |
| `src/certificate/index.ts` | Created: Re-exports for certificate utilities |
| `scripts/make-certificates.ts` | Created: Pipeline reading demo-data.json, writing JSON certificates, QR PNGs, and rejection audit notes |
| `package.json` | Updated: Added `"certificate"` script (`npx hardhat run scripts/make-certificates.ts`) and installed `qrcode` |
| `test/certificate.test.ts` | Created: 6 unit tests covering shortCode determinism, round-trip Base64URL parsing, and QR PNG generation |
| `docs/architecture/spec.md` | Updated: Added Section 6 covering Harvester Certificate architecture and offline verification |
| `docs/security/assessment.md` | Updated: Added Section 3.4 on certificate privacy and updated test coverage to 66 tests |
| `docs/overview.md` | Updated: Added certificate details in portable proof section and replaced em dashes with commas |
| `docs/demo-script.md` | Updated: Incorporated certificate generation pipeline and updated test suite count |

### Test and execution results
- `npx hardhat test` passes 66/66 tests (42 contract tests, 18 hashing tests, 6 certificate tests).
- `npx tsc --noEmit` passes with 0 errors.
- `npm run certificate` successfully generated certificates and QR PNGs for approved batches and formal audit notes for rejected batches in `demo/certificates/`.

### Decisions made or clarified
- Certificate JSON schema version 1 includes plain paymentRef and settlementConfirmation code, enabling harvesters to reconcile with their M-Pesa statements without leaking PII on-chain.
- URL fragment (`#c=`) is utilized for client-side zero-server payload transfer.
- Crockford Base32 excludes confusing characters (I, L, O, U) for SMS/voice readability.

---

## Oct 16, 2026, Task 3: Add Deployment and Seed Script for Real Demo Batches

### Files added or updated
| File | Action |
|---|---|
| `scripts/seed.ts` | Created: End-to-end deployment and demo batch seeding script (supports local and Base Sepolia networks, ephemeral wallet generation, and role assignment) |
| `.env.example` | Created: Template listing DEPLOYER_PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, and PSEUDONYM_SECRET |
| `.env` | Updated: Added PSEUDONYM_SECRET entry for local execution |
| `.gitignore` | Updated: Added `demo/.demo-wallets.json` pattern to safeguard ephemeral private keys |
| `demo/demo-data.json` | Generated: Complete on-chain record for Batch A (full journey), Batch B (quality rejection), and Batch C (hash correction) |
| `README.md` | Updated: Added Quick Start run instructions for local and Base Sepolia seed execution |
| `docs/architecture/spec.md` | Updated: Added Demo Batch Seed Runner to system architecture component breakdown |

### Test and execution results
- `npx hardhat test` passes 60/60 tests (42 contract tests and 18 hashing tests).
- `npx tsc --noEmit` passes with 0 errors.
- `npx hardhat run scripts/seed.ts` successfully deployed contract, granted roles, executed all 3 demo batches, and produced `demo/demo-data.json`.

### Decisions made or clarified
- On local networks, in-memory signers are assigned as relayer, verifier, buyer, and processor.
- On live networks such as Base Sepolia, 4 ephemeral wallets are generated, funded from the deployer wallet with a constant 0.0005 ETH each, and stored strictly in the gitignored `demo/.demo-wallets.json`.
- `demo/demo-data.json` contains full canonical payloads, salts, hashes, transaction hashes, and block numbers, but strictly omits private keys and the pseudonym secret.

---

## Oct 16, 2026, Task 2: Build Off-Chain Hashing & Pseudonym Module

### Files added or updated
| File | Action |
|---|---|
| `src/hashing/canonical.ts` | Created: RFC 8785 JSON Canonicalization with validation for integers, undefined, NaN, Infinity, functions, and symbols |
| `src/hashing/salt.ts` | Created: Browser-safe 16-byte random hex salt generator (`crypto.getRandomValues`) |
| `src/hashing/hash.ts` | Created: `hashRecord` and `hashConfirmation` using ethers v6 `keccak256` and `toUtf8Bytes` |
| `src/hashing/types.ts` | Created: TypeScript interfaces for all stage payloads without PII |
| `src/hashing/pseudonym.ts` | Created: Node-only server-side HMAC-SHA256 pseudonym derivation (`derivePseudonym`) |
| `src/hashing/index.ts` | Created: Browser-safe re-exports (excluding `pseudonym.ts`) |
| `test/hashing.test.ts` | Created: 18 unit tests covering RFC 8785 sorting, tamper detection, salt sensitivity, type validations, and pseudonym derivation |
| `docs/architecture/spec.md` | Updated: Cryptographic design section with hashing module references |
| `docs/security/assessment.md` | Updated: Security test coverage updated to 60 tests (42 contract + 18 hashing) |

### Test results
**60 / 60 passing** (`npx hardhat test`), `npx tsc --noEmit` passes with 0 errors.

### Decisions made or clarified
- Pure browser-safe RFC 8785 canonical JSON serializer implemented with explicit validation, ensuring deterministic hash parity between backend and frontend verify page.
- `pseudonym.ts` kept isolated with `node:crypto` and intentionally excluded from `src/hashing/index.ts` to keep the client package bundle browser-safe.
- Quantities and timestamps are strictly required to be whole integers; floats are rejected to eliminate cross-architecture floating-point serialization discrepancies.

---

## Oct 16, 2026, Task 1: Complete Judge-Facing Documentation Update & Repo Entry Point

### Files added or updated
| File | Action |
|---|---|
| `README.md` | Created judge-facing entry point: 3-sentence summary, problem, quick start, document directory, folder layout, built vs roadmap, honest limitations |
| `docs/architecture/spec.md` | Created technical architecture specification: component diagram, state machine lifecycle, mapping of all on-chain rules to the 42 unit tests, data model, cryptographic design |
| `docs/security/assessment.md` | Created security and data-integrity assessment: threat model, RBAC, separation of duties, mass balance, non-transferability, HMAC privacy, and 42-test coverage |
| `docs/overview.md` | Created 2-page problem & solution overview: Lake Victoria crisis, informal harvester precarity, asymmetric architecture, built vs roadmap |
| `docs/impact/impact-assessment.md` | Created climate impact assessment: sourced methane avoidance projections (0.13 to 0.52 t CO2e/t wet hyacinth), low/high ranges, IPCC citations, explicit disclosure that this is a projection, not a carbon credit |
| `docs/adoption-and-scalability.md` | Created adoption strategy and scalability roadmap: harvester-first SMS entry, SACCO underwriting, commercial off-takers, 3-phase technical scaling roadmap |
| `docs/demo-script.md` | Created 3-minute hackathon demo video script: visual/audio storyboard, on-chain execution sequence, tamper-detection demonstration |

### Verification
- `npx hardhat test` passes 42/42 tests.
- `npx tsc --noEmit` passes with 0 errors.

---

## Oct 15, 2026, Task 1: Complete contract, tests, Ignition module, and repo setup

### Files added or changed
| File | Action |
|---|---|
| `contracts/ZiwaChain.sol` | Renamed from `Ziwachain.sol` (git mv) and fully rewritten |
| `test/ZiwaChain.ts` | Replaced 8-test stub with 42-test full suite |
| `ignition/modules/ZiwaChain.ts` | Created; deploys with account 0 as admin |
| `PROJECT_CONTEXT.md` | Created at repo root from owner-provided content, updated to reflect current state |
| `docs/architecture/eventSchema.md` | Moved from `docs/arhictecture/` (git mv; folder typo fixed) |
| `docs/internal/PROGRESS.md` | Created (this file) |
| `docs/internal/`, `src/hashing/`, `src/certificate/`, `src/sms/` | Directories created |
| `.gitignore` | Cleaned up duplicate entries; added demo wallet file patterns |

### Test results
**42 / 42 passing** (`npx hardhat test`)

### Decisions made or clarified
- Non-transferability is enforced via `_update` override (not by overriding `safeTransferFrom`). This is cleaner and also blocks burn.
- Hash correction author tracking uses `msg.sender` at time of first recording. Role-based restriction was rejected in favour of this per-spec approach.
- `confirmSettlement` is allowed at Accepted, Processed or EndUse; once per batch; does not change stage.
- `recordEndUse` accumulates across partial calls; credits minted on each call.
- `_recordHash` is a no-op for a (batchId, hash) pair that is already registered, so authorship always belongs to the first caller.
- `processType` and `endUseType` are `bytes32` labels emitted in events only; not stored in the Batch struct.
- `outputUnits` is emitted in events only; not stored in the Batch struct.
- `paymentRefHash` IS stored in the Batch struct (needed for `getBatch` on the verify page).

### Deviations from spec
None.

### Open questions and risks
- **Deployment wallet:** Base Sepolia deployment needs a fresh testnet-only wallet and faucet funds. Manual step by project owner.
- **Feature freeze Oct 21:** Tasks 1 through 7 are completed. Task 8 (skeptical review, no code changes) remains. Manual steps (demo video, Base Sepolia deployment, hosting, Devpost submission) will be completed by the owner.
- **Canonical serialisation:** RFC 8785 canonical JSON serialisation ensures deterministic hash parity between backend and frontend verify page.

### Next step
**Task 8:** Skeptical review. Read every judge-facing document as a skeptical judge would. Flag any claim that outpaces the code, any missing limitation, any inconsistency. No new code. Fix prose only.
