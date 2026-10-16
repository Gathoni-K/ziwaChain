# ZiwaChain – Internal Progress Log

Append-only. Newest entry at the top.

---

## Oct 16, 2026 — Task 2: Build Off-Chain Hashing & Pseudonym Module

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

## Oct 16, 2026 — Task 1: Complete Judge-Facing Documentation Update & Repo Entry Point

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

## Oct 15, 2026 — Task 1: Complete contract, tests, Ignition module, and repo setup

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
- **Deployment wallet:** Base Sepolia deployment needs a fresh testnet-only wallet and faucet funds. Not yet done.
- **Feature freeze Oct 21:** Tasks 2–7 must all complete by Oct 21. That is 6 days for hashing module, certificate, deploy + seed script, verify page, PROOF simulation, and all written deliverables. Priority: hashing module first (the verify page depends on it).
- **Canonical serialisation:** most "verification failed" bugs will come from serialisation mismatches between the ZiwaClear backend and the in-browser verify page. Test this aggressively in Task 2.

### Next step
**Task 2:** TypeScript hashing module (`src/hashing/index.ts`, `src/sms/index.ts`): HMAC pseudonyms, canonical JSON serialisation (RFC 8785), salted payload hash. Must be browser-safe. Node-only HMAC pseudonym generation in a separate file. Tests required.
