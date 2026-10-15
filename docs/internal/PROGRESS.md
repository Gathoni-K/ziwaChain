# ZiwaChain – Internal Progress Log

Append-only. Newest entry at the top.

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
