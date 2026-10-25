# ZiwaChain

**ZiwaChain** is a verified chain of custody and provenance protocol for invasive water hyacinth biomass harvested from Lake Victoria. Built as an extension to the [ZiwaClear](https://ziwa-clear.vercel.app/) marketplace, it anchors harvest, verification, commercial acceptance, processing, and circular end use on Base Sepolia. The protocol equips informal harvesters with portable, tamper-evident digital proof of their work without requiring smartphone ownership or crypto wallet management.

ZiwaChain lets harvesters, buyers (the accepting and paying party: processors, programmes, or funders), verifiers and lenders rely on the same delivery record without having to trust a single operator.

---

## The Problem: Trust in Paid Removal on Lake Victoria

Provisional informal fieldwork conducted around Lake Victoria (Dunga, Homa Bay, and Kendu Bay, Oct 18 to 19, 2026, across a small sample of conversations) revealed the central barrier to managing water hyacinth (*Pontederia crassipes*): **trust in paid removal**.

Fishers reported that they would harvest hyacinth if paid, but they expect immediate payment and deeply distrust paid harvesting schemes after a reported scam where people paid registration fees to an organizer who disappeared. A second reported scam concerned the funder side: parties reportedly claimed to be managing the weed, then waited for it to recede naturally instead of carrying out the funded removal. These provisional reports suggest that paid-removal schemes can fail on trust from both sides. Furthermore, weed presence is seasonal and localized (reported as arriving around July and leaving around August, blocking landings for about a week, but absent at Dunga for roughly three years and minimal at Homa Bay during field visits), and no dependable commercial buyer was found (local biogas demonstration sites source their own feedstock).

Where weed arrives, fishers clear narrow paths around their boats and leave weed on the shore, or wait for wind to blow it out. Information flows strictly through county fisheries officers and Beach Management Unit (BMU) officials down to fishers.

**What ZiwaChain addresses:**
- **Verifiable proof of delivery, verification, and payment:** Equip informal harvesters with portable, tamper-evident digital proof of their work and two-sided settlement confirmation that they hold independently on their phone or on paper.
- **Operator-independent shared trust:** A shared record on Base Sepolia that harvesters, accepting payers, verifiers, and community lenders can verify directly without trusting any single platform or middleman database.

**What ZiwaChain does NOT address:**
- It does not generate biomass supply or eliminate ecological seasonality.
- It does not create commercial demand or manufacture buyers where none exist.
- It cannot prevent an organizer from demanding illicit cash registration fees off-chain, though pre-funded commitment and escrow models on our roadmap directly target this vulnerability.

---

## Quick Start

### Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Gathoni-K/ziwaChain.git
cd ziwaChain
npm install
```

### Compile Smart Contracts
Compile the Solidity contracts and generate TypeChain TypeScript bindings:
```bash
npx hardhat clean && npx hardhat compile
```

### Run Test Suite
Run the full automated test suite (99 unit tests covering contract state machine rules, mass-balance invariant checks, non-transferability, hash corrections, duplicate-evidence flagging, RFC 8785 canonical serialization, HMAC pseudonyms, certificate generation, in-browser verification algorithm, simulated SMS settlement flows, and markdown link integrity):
```bash
npx hardhat test
```

### Run Simulated SMS Settlement & PROOF Demo
Run the interactive SMS settlement confirmation and certificate delivery flow against a local node:
```bash
npm run demo:sms
```

### Typecheck TypeScript Code
Verify TypeScript types across contracts, off-chain modules, and tests:
```bash
npx tsc --noEmit
```

### Seed Demo Batches (Local In-Memory Network)
Run the automated seed script to deploy the contract and execute 4 illustrative demo batches (Batch A full journey, Batch B quality rejection, Batch C hash correction, Batch D duplicate evidence flag; illustrative demo data, not real harvests):
```bash
npx hardhat run scripts/seed.ts
```
Outputs are written to `demo/demo-data.json`.

### Build & Open Public Verify Page
Compile the zero-framework verification engine with esbuild and open the static client:
```bash
npm run web:build
```
Open `web/dist/index.html` directly in any web browser (no local server or internet backend needed), or run the local development server:
```bash
npm run web:dev
```
A separate printable certificate page is available at `web/certificate.html`. Open it in a browser, paste a certificate JSON, and use Ctrl+P / ⌘P to save as PDF (A5).

### Deploy & Seed on Base Sepolia
To deploy and seed on Base Sepolia testnet:
1. Copy `.env.example` to `.env`.
2. Configure `DEPLOYER_PRIVATE_KEY` and fund that address with Base Sepolia testnet ETH.
3. Set `PSEUDONYM_SECRET` to a private server secret.
4. Run the seed script targeting Base Sepolia:
```bash
npx hardhat run scripts/seed.ts --network baseSepolia
```
The script automatically generates and funds 4 ephemeral testnet wallets (relayer, verifier, buyer, processor), grants on-chain roles, executes all 3 demo batches (illustrative data, not real harvests), and writes output metadata to `demo/demo-data.json`.

### Verify Contract on Basescan (prepare-only, requires Base Sepolia deployment)
1. Set `ETHERSCAN_API_KEY` in your `.env` file (one Etherscan V2 key covers Base Sepolia; do not use a separate Basescan key).
2. Ensure `demo/demo-data.json` exists from a Base Sepolia seed run.
3. Run the verification script:
```bash
npx hardhat run scripts/verify.ts --network baseSepolia
```
The script reads `contractAddress` and `adminAddress` from `demo/demo-data.json` and submits the verification to Etherscan V2.

---

## Project Documentation (Judge-Facing)

Judges can review the complete hackathon evaluation documentation via the links below:

| Document | Description |
|---|---|
| [System Architecture Specification](docs/architecture/architecture.md) | Component architecture, Mermaid diagrams, on-chain vs off-chain boundary, and roles matrix |
| [Security & Data Integrity Assessment](docs/security/securityAndDataIntegrity.md) | Threat modeling, RBAC, mass balance preservation, HMAC privacy, and test suite |
| [Why Blockchain? Architectural Justification](docs/security/whyBlockchain.md) | Honest comparison of blockchain vs signed log vs database for informal-labor provenance |
| [Climate Impact Assessment](docs/impact/climateImpactAssessment.md) | Methane avoidance projections, fuel displacement models, IPCC sources, and clear estimate labels |
| [Problem & Solution Overview](docs/overview.md) | 2-page overview of the circular bioeconomy model and informal harvester precarity on Lake Victoria |
| [Adoption Strategy & Scalability Roadmap](docs/adoptionAndScalability.md) | Three-tiered proof acceptance pathway, Kisumu pilot plan, scaling horizons, and field findings placeholder |
| [Demo Video Script](docs/demoScript.md) | 3-minute video presentation script with timestamps, visual cues, and voiceover text |
| [Technical Specification & Test Proofs](docs/architecture/spec.md) | Supplementary deep dive into smart contract rules and unit test mappings |
| [Gas Cost Estimate](docs/architecture/gasCostEstimate.md) | Measured gas-per-function table and low/high ETH cost estimate with stated assumptions |
| [Event Schema & Data Model](docs/architecture/eventSchema.md) | Supplementary canonical event envelope and data dictionary |

---

## Repository Layout

```
ziwachain/
├── contracts/
│   ├── ZiwaChain.sol                  # Core smart contract (ERC-1155, AccessControl, mass balance)
│   └── test/
│       └── PlainRelayer.sol           # Mock relayer contract without receiver for unit tests
├── scripts/
│   ├── seed.ts                        # End-to-end deployment and demo batch seed runner
│   ├── makeCertificates.ts            # Certificate generation pipeline (JSON, QR, audit notes)
│   └── demoSms.ts                     # Simulated SMS settlement and PROOF conversation runner
├── test/
│   ├── ZiwaChain.ts                   # Contract test suite (44 unit tests)
│   ├── hashing.test.ts                # RFC 8785 canonical JSON, salt, and pseudonym suite (18 tests)
│   ├── certificate.test.ts            # Certificate builder, short code, and QR suite (6 tests)
│   ├── verify.test.ts                 # In-browser verification algorithm suite (10 tests)
│   ├── sms.test.ts                    # SMS parsing, settlement flow, and phone masking suite (13 tests)
│   └── links.test.ts                  # Link and script path integrity validator (1 test)
├── demo/
│   ├── demo-data.json                 # Seeded demo batch records, tx hashes, salts, and payloads
│   └── certificates/                  # Generated harvester certificates (JSON + QR PNGs)
├── ignition/
│   └── modules/
│       └── ZiwaChain.ts               # Hardhat Ignition deployment module
├── web/
│   ├── index.html                     # Public verify page: static entry point
│   ├── main.ts                        # In-browser verification engine (all 5 checks + event binding)
│   ├── style.css                      # High-contrast responsive stylesheet (light/dark mode)
│   ├── config.ts                      # RPC URL config and contract ABI
│   └── dist/                          # Bundled distribution (esbuild output, no CDN)
├── docs/
│   ├── architecture/
│   │   ├── architecture.md            # Primary architecture doc with Mermaid diagrams and tables
│   │   ├── spec.md                    # Detailed technical spec and test rule mapping
│   │   └── eventSchema.md             # Canonical event envelope and data dictionary
│   ├── security/
│   │   ├── securityAndDataIntegrity.md # Primary threat model, RBAC, and integrity analysis
│   │   └── whyBlockchain.md           # Architectural justification for blockchain in informal labor
│   ├── impact/
│   │   └── climateImpactAssessment.md # Primary climate model and carbon projections
│   ├── overview.md                    # 2-page problem and solution overview
│   ├── adoptionAndScalability.md      # Adoption strategy and scaling roadmap
│   ├── demoScript.md                  # 3-minute video presentation script
│   ├── Learn/                         # Internal developer guides and debugging logs
│   └── internal/                      # Append-only internal build progress log
├── src/
│   ├── hashing/                       # RFC 8785 canonical JSON, salted hash, HMAC pseudonym
│   ├── certificate/                   # Harvester certificate builder, QR generator, short code
│   └── sms/                           # SMS gateway interface, simulated chat gateway, settlement/PROOF flow
├── hardhat.config.ts                  # Hardhat configuration (Solidity 0.8.28, Cancun, Base Sepolia)
├── package.json                       # Project dependencies and npm scripts
```

---

## Status: Built vs Roadmap

To maintain total transparency with hackathon judges, our implementation status is categorized below:

### What Is Built and Proven by Tests
- **Core Smart Contract (`ZiwaChain.sol`):** Deployed and tested on Solidity 0.8.28 (`cancun` EVM) using OpenZeppelin v5 contracts. Follows strict Checks-Effects-Interactions (CEI) order prior to token minting.
- **Strict Linear Lifecycle:** Enforced stage transitions: `None` → `Harvested` → `Verified` | `Rejected` → `Accepted` → `Processed` → `EndUse`.
- **Role-Based Access Control:** Distinct roles for `RELAYER_ROLE`, `VERIFIER_ROLE`, `BUYER_ROLE`, `PROCESSOR_ROLE`, and `DEFAULT_ADMIN_ROLE`.
- **Separation of Duties:** Relayers cannot act as verifiers (`VerifierCannotBeRelayer`).
- **Strict Mass-Balance Invariants:** Contract rejects transactions where `acceptedKg > harvestedKg`, `processedKg > acceptedKg`, or `endUseKgTotal > processedKg`.
- **Harvester Privacy:** Per-batch HMAC-SHA256 pseudonyms preventing public linkability of harvester identities across batches.
- **Non-Transferable Work Credits:** ERC-1155 token ID 1 (`WORK_CREDIT`) minted 1:1 per kilogram reaching verified circular end use; token transfers are blocked via the `_update` hook.
  > [!NOTE]
  > **Custodian Receiver Requirement:** In the prototype, the custodian (`relayer`) address that holds minted credits must be a standard wallet (EOA) or implement `IERC1155Receiver`; otherwise `recordEndUse` reverts with `ERC1155InvalidReceiver`.
- **Append-Only Tamper-Evident Corrections:** Hashes can only be superseded by their original author with a recorded reason; historical records remain immutable and visible. Only evidence and payload hashes may be superseded (Decision D); `newHash == bytes32(0)` reverts with `InvalidHash`.
- **Off-Chain Hashing Module (`src/hashing/`):** RFC 8785 canonical JSON serialization, random 128-bit salts, `keccak256` payload hashing, and HMAC-SHA256 per-batch pseudonym derivation. Browser-safe; no Node-only imports in the main export.
- **Harvester Certificate Pipeline (`src/certificate/`, `scripts/makeCertificates.ts`):** Builds a portable Version 1 JSON certificate, a 10-character Crockford Base32 short code (SMS-friendly), and a self-verifying QR code PNG.
- **Public In-Browser Verify Page (`web/`):** Zero-backend static page bundled with esbuild. Runs 5 independent verification checks against the live blockchain with no login and no ZiwaClear server contact. Binds every stage in the certificate directly to its emitted on-chain event log (`payloadHash` and `txHash`), validates `cert.pseudonym` against `batchData.harvesterId`, verifies plain `paymentRef`, and presents an amber banner for authentic rejected batches without granting verified status.
- **Simulated SMS Settlement & PROOF Flow (`src/sms/`, `scripts/demoSms.ts`):** Complete two-leg SMS conversation engine with simulated chat gateway, post-acceptance OTP confirmation ("YES <code>"), canonical `SettlementConfirmationPayload` assembly, relayer on-chain `confirmSettlement`, retry handling, "PROOF" short code/link delivery, and strict phone privacy masking.
- **Duplicate-Evidence Flagging:** On-chain first-use tracking (`evidenceFirstBatch`) and event notification (`EvidenceReused`) that flags reuse of identical field evidence hashes across different batches with an amber notice on the public verify page, without reverting transactions or declaring fraud.
- **Full Automated Test Suite:** 99 automated tests passing across contract rules, hashing, certificate generation, in-browser verification algorithm, link integrity, and SMS flows.

### Roadmap Items (Not Yet Built in Current Release)
- **Commitment Before Work (Payer Pre-Funding / Escrow):** A mechanism allowing the accepting and paying party (programme, funder, or buyer) to lock or commit funds into escrow before harvesting begins, giving harvesters verifiable certainty of payout before doing labor. This directly addresses harvester distrust stemming from past registration fee scams. Today, payment occurs off-chain via M-Pesa, and the chain records a payment reference hash and the harvester's two-way SMS confirmation.
- **Multi-Verifier Consensus:** Upgrading single verifiers to a 2-of-N threshold signature model.
- **Custodian Multi-Relayer Isolation:** Adding `msg.sender == b.custodian` check on `confirmSettlement` for multi-relayer operational topologies.
- **Post-Acceptance Quantity Adjustments:** On-chain dispute resolution for discrepancies discovered after buyer acceptance.
- **Automated M-Pesa Settlement Reconciliation:** Direct smart-contract reconciliation against Safaricom Daraja API callbacks.
- **Credit Redemption Mechanisms:** Work-credit redemption for subsidized agricultural inputs, protective equipment, or carbon-finance dividends.
- **Lender Statement Bundles:** Merkle-tree aggregation allowing harvesters to prove total multi-month delivery volumes to SACCOs via a single root proof.
- **Accredited Carbon Methodology Mapping:** Bridging work credits to Verra / Gold Standard aquatic biomass methodologies.
- **External Evidence Connectors (Roadmap):** Importers that accept evidence hashes and attestations from satellite platforms, field-sensor systems, or third-party ESG tools via the existing `source` label and `hotspotRef` hash. Not built.
- **Verifier Correction Request State (Roadmap):** A state allowing a verifier to flag a batch for correction before issuing a final attestation, without the current binary approve/reject outcome. Not built.
- **Export Mappings (Roadmap):** Adapter libraries that translate ZiwaChain event logs into formats used by other traceability or reporting systems. Not built.

---

## Honest Limitations

1. **Relayer Trust Assumption:** Harvesters submit reports via low-bandwidth SMS/USSD without native EVM wallets. Harvest transactions are relayed by ZiwaClear's relayer key. Harvester-level non-repudiation relies on ZiwaClear's key custody and server integrity.
2. **SMS Settlement Attestation:** The harvester's settlement confirmation ("YES 4821") is verified via telecom SMS routing and hash-anchored on-chain; it is a tamper-evident attestation, not a native asymmetric cryptographic signature.
3. **Single Verifier Trust Point:** In the current prototype, a single verifier with `VERIFIER_ROLE` can approve or reject a batch. Multi-verifier approval is scheduled on the roadmap.
4. **Permanent Mass Balance:** If a scaling error occurs and is accepted by the buyer, the mass cannot be retroactively adjusted in the contract without rejecting and re-logging the batch.
5. **Simulated Role Wallets & Buyer Clarification:** While verifiers, buyers (the accepting and paying party), and processors sign with dedicated private keys, prototype testing uses development signers. In the field, no commercial buyer was validated (local biogas demonstration sites source their own feedstock); the "buyer" role in practice represents any accepting and paying party, such as a county public works programme, environmental donor fund, or commercial off-taker.
6. **Work Credits are Not Carbon Credits:** Work credits represent kilograms of verified biomass diverted to beneficial end use. They are not accredited carbon offset credits.
7. **Testnet Deployment:** The current protocol prototype targets the Base Sepolia testnet.
8. **Hash Proves Integrity, Not Truth:** A valid certificate hash confirms that a file matches the recorded hash. It does not confirm that the underlying claims in the certificate are accurate. Accuracy at entry depends on the field verifier, the buyer's independent acceptance, and the harvester's own SMS confirmation.
9. **Illustrative Demo Data:** The seeded batches in `demo/demo-data.json` are synthetic data generated by a local seed script. They are not records of real harvests.
10. **Duplicate Evidence Flagging Detects Exact Hashes Only:** The on-chain `evidenceFirstBatch` mapping and `EvidenceReused` event detect exact cryptographic hash reuse across batches. It cannot detect similar photos, re-compressed photos, or alternate camera angles of the same physical biomass.
11. **Provisional Field Findings:** Field observations are provisional and derived from informal fieldwork around Dunga, Homa Bay, and Kendu Bay on Lake Victoria (Oct 18 to 19, 2026, across a small number of conversations). They reflect local conditions at those specific sites and must not be generalized lake-wide.
12. **Pilot Status of Downstream Chain-of-Custody:** Chain-of-custody stages beyond verification (buyer acceptance, processing, and end use) are a pilot design with illustrative demo data, pending commercial offtake establishment.
