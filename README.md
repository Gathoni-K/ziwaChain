# ZiwaChain

**ZiwaChain** is a verified chain of custody and provenance protocol for invasive water hyacinth biomass harvested from Lake Victoria. Built as an extension to the ZiwaClear marketplace, it anchors harvest, verification, commercial acceptance, processing, and circular end use on Base Sepolia. The protocol equips informal harvesters with portable, tamper-evident digital proof of their work without requiring smartphone ownership or crypto wallet management.

---

## The Problem

Lake Victoria suffers from massive seasonal blooms of invasive water hyacinth (*Pontederia crassipes*), which clog waterways, destroy fish breeding grounds, and decompose anaerobically into potent greenhouse gases (methane). Informal lake harvesters extract thousands of metric tons of biomass but operate entirely in the informal economy:
- **No Portable Proof:** Harvesters lack verifiable documentation of delivered volumes, quality checks, or earnings, leaving them vulnerable to payment disputes and short-weighing.
- **Credit Invisibility:** Community lenders (such as agricultural SACCOs) cannot verify harvester cash flows or supply histories to underwrite microloans or equipment financing.
- **Supply Chain Greenwashing:** Downstream buyers and clean-energy processors (biogas, organic fertilizer, briquettes) cannot cryptographically prove sustainable sourcing or circular outcomes to corporate off-takers and carbon registries.

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
Run the full automated test suite (85 unit tests covering contract state machine rules, mass-balance invariant checks, non-transferability, hash corrections, RFC 8785 canonical serialization, HMAC pseudonyms, certificate generation, in-browser verification algorithm, and simulated SMS settlement flows):
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
Run the automated seed script to deploy the contract and execute 3 real demo batches (Batch A full journey, Batch B quality rejection, Batch C hash correction):
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

### Deploy & Seed on Base Sepolia
To deploy and seed on Base Sepolia testnet:
1. Copy `.env.example` to `.env`.
2. Configure `DEPLOYER_PRIVATE_KEY` and fund that address with Base Sepolia testnet ETH.
3. Set `PSEUDONYM_SECRET` to a private server secret.
4. Run the seed script targeting Base Sepolia:
```bash
npx hardhat run scripts/seed.ts --network baseSepolia
```
The script automatically generates and funds 4 ephemeral testnet wallets (relayer, verifier, buyer, processor), grants on-chain roles, executes all 3 demo batches, and writes output metadata to `demo/demo-data.json`.

---

## Project Documentation (Judge-Facing)

Judges can review the complete hackathon evaluation documentation via the links below:

| Document | Description |
|---|---|
| [System Architecture Specification](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/architecture/architecture.md) | Component architecture, Mermaid diagrams, on-chain vs off-chain boundary, and roles matrix |
| [Security & Data Integrity Assessment](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/security/security-and-data-integrity.md) | Threat modeling, RBAC, mass balance preservation, HMAC privacy, and 85-test suite |
| [Climate Impact Assessment](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/impact/climate-impact-assessment.md) | Methane avoidance projections, fuel displacement models, IPCC sources, and clear estimate labels |
| [Problem & Solution Overview](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/overview.md) | 2-page overview of the circular bioeconomy model and informal harvester precarity on Lake Victoria |
| [Adoption Strategy & Scalability Roadmap](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/adoption-and-scalability.md) | Three-tiered proof acceptance pathway, Kisumu pilot plan, scaling horizons, and field findings placeholder |
| [Demo Video Script](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/demo-script.md) | 3-minute video presentation script with timestamps, visual cues, and voiceover text |
| [Technical Specification & Test Proofs](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/architecture/spec.md) | Supplementary deep dive into smart contract rules and unit test mappings |
| [Event Schema & Data Model](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/architecture/eventSchema.md) | Supplementary canonical event envelope and data dictionary |

---

## Repository Layout

```
ziwachain/
├── contracts/
│   └── ZiwaChain.sol                  # Core smart contract (ERC-1155, AccessControl, mass balance)
├── scripts/
│   ├── seed.ts                        # End-to-end deployment and demo batch seed runner
│   ├── make-certificates.ts           # Certificate generation pipeline (JSON, QR, audit notes)
│   └── demo-sms.ts                    # Simulated SMS settlement and PROOF conversation runner
├── test/
│   ├── ZiwaChain.ts                   # Contract test suite (42 unit tests)
│   ├── hashing.test.ts                # RFC 8785 canonical JSON, salt, and pseudonym suite (18 tests)
│   ├── certificate.test.ts            # Certificate builder, short code, and QR suite (6 tests)
│   ├── verify.test.ts                 # In-browser verification algorithm suite (6 tests)
│   └── sms.test.ts                    # SMS parsing, settlement flow, and phone masking suite (13 tests)
├── demo/
│   ├── demo-data.json                 # Seeded demo batch records, tx hashes, salts, and payloads
│   └── certificates/                  # Generated harvester certificates (JSON + QR PNGs)
├── ignition/
│   └── modules/
│       └── ZiwaChain.ts               # Hardhat Ignition deployment module
├── web/
│   ├── index.html                     # Public verify page: static entry point
│   ├── main.ts                        # In-browser verification engine (all 5 checks)
│   ├── style.css                      # High-contrast responsive stylesheet (light/dark mode)
│   ├── config.ts                      # RPC URL config and contract ABI
│   └── dist/                          # Bundled distribution (esbuild output, no CDN)
├── docs/
│   ├── architecture/
│   │   ├── architecture.md            # Primary architecture doc with Mermaid diagrams and tables
│   │   ├── spec.md                    # Detailed technical spec and test rule mapping
│   │   └── eventSchema.md             # Canonical event envelope and data dictionary
│   ├── security/
│   │   ├── security-and-data-integrity.md # Primary threat model, RBAC, and integrity analysis
│   │   └── assessment.md              # Detailed security assessment and test logs
│   ├── impact/
│   │   ├── climate-impact-assessment.md   # Primary climate model and carbon projections
│   │   └── impact-assessment.md       # Supplementary impact calculations
│   ├── overview.md                    # 2-page problem and solution overview
│   ├── adoption-and-scalability.md    # Adoption strategy and scaling roadmap
│   ├── demo-script.md                 # 3-minute video presentation script
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
- **Core Smart Contract (`ZiwaChain.sol`):** Deployed and tested on Solidity 0.8.28 (`cancun` EVM) using OpenZeppelin v5 contracts.
- **Strict Linear Lifecycle:** Enforced stage transitions: `None` → `Harvested` → `Verified` | `Rejected` → `Accepted` → `Processed` → `EndUse`.
- **Role-Based Access Control:** Distinct roles for `RELAYER_ROLE`, `VERIFIER_ROLE`, `BUYER_ROLE`, `PROCESSOR_ROLE`, and `DEFAULT_ADMIN_ROLE`.
- **Separation of Duties:** Relayers cannot act as verifiers (`VerifierCannotBeRelayer`).
- **Strict Mass-Balance Invariants:** Contract rejects transactions where `acceptedKg > harvestedKg`, `processedKg > acceptedKg`, or `endUseKgTotal > processedKg`.
- **Harvester Privacy:** Per-batch HMAC-SHA256 pseudonyms preventing public linkability of harvester identities across batches.
- **Non-Transferable Work Credits:** ERC-1155 token ID 1 (`WORK_CREDIT`) minted 1:1 per kilogram reaching verified circular end use; token transfers are blocked via the `_update` hook.
- **Append-Only Tamper-Evident Corrections:** Hashes can only be superseded by their original author with a recorded reason; historical records remain immutable and visible.
- **Off-Chain Hashing Module (`src/hashing/`):** RFC 8785 canonical JSON serialization, random 128-bit salts, `keccak256` payload hashing, and HMAC-SHA256 per-batch pseudonym derivation. Browser-safe; no Node-only imports in the main export.
- **Harvester Certificate Pipeline (`src/certificate/`, `scripts/make-certificates.ts`):** Builds a portable Version 1 JSON certificate, a 10-character Crockford Base32 short code (SMS-friendly), and a self-verifying QR code PNG.
- **Public In-Browser Verify Page (`web/`):** Zero-backend static page bundled with esbuild. Runs 5 independent verification checks against the live blockchain with no login and no ZiwaClear server contact. Accepts certificate input via URL fragment, file upload, or paste.
- **Simulated SMS Settlement & PROOF Flow (`src/sms/`, `scripts/demo-sms.ts`):** Complete two-leg SMS conversation engine with simulated chat gateway, post-acceptance OTP confirmation ("YES <code>"), relayer on-chain `confirmSettlement`, retry handling, "PROOF" short code/link delivery, and strict phone privacy masking.
- **Full Automated Test Suite:** 85/85 tests passing across contract rules, hashing, certificate generation, in-browser verification algorithm, and SMS flows.

### Roadmap Items (Not Yet Built in Current Release)
- **Multi-Verifier Consensus:** Upgrading single verifiers to a 2-of-N threshold signature model.
- **Post-Acceptance Quantity Adjustments:** On-chain dispute resolution for discrepancies discovered after buyer acceptance.
- **Automated M-Pesa Settlement Reconciliation:** Direct smart-contract reconciliation against Safaricom Daraja API callbacks.
- **Credit Redemption Mechanisms:** Work-credit redemption for subsidized agricultural inputs, protective equipment, or carbon-finance dividends.
- **Lender Statement Bundles:** Merkle-tree aggregation allowing harvesters to prove total multi-month delivery volumes to SACCOs via a single root proof.
- **Accredited Carbon Methodology Mapping:** Bridging work credits to Verra / Gold Standard aquatic biomass methodologies.

---

## Honest Limitations

1. **Relayer Trust Assumption:** Harvesters submit reports via low-bandwidth SMS/USSD without native EVM wallets. Harvest transactions are relayed by ZiwaClear's relayer key. Harvester-level non-repudiation relies on ZiwaClear's key custody and server integrity.
2. **SMS Settlement Attestation:** The harvester's settlement confirmation ("YES 4821") is verified via telecom SMS routing and hash-anchored on-chain; it is a tamper-evident attestation, not a native asymmetric cryptographic signature.
3. **Single Verifier Trust Point:** In the current prototype, a single verifier with `VERIFIER_ROLE` can approve or reject a batch. Multi-verifier approval is scheduled on the roadmap.
4. **Permanent Mass Balance:** If a scaling error occurs and is accepted by the buyer, the mass cannot be retroactively adjusted in the contract without rejecting and re-logging the batch.
5. **Simulated Commercial Wallets:** While verifiers, buyers, and processors sign with dedicated private keys, prototype testing uses development signers.
6. **Work Credits are Not Carbon Credits:** Work credits represent kilograms of verified biomass diverted to beneficial end use. They are not accredited carbon offset credits.
7. **Testnet Deployment:** The current protocol prototype targets the Base Sepolia testnet.
