# ZiwaChain, Internal Progress Log

Append-only. Newest entry at the top.

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
