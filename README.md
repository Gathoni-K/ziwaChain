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
Run the full automated test suite (42 unit tests covering all state transitions, role authorizations, mass-balance invariant checks, non-transferability, and hash corrections):
```bash
npx hardhat test
```

### Typecheck TypeScript Code
Verify TypeScript types across contracts and tests:
```bash
npx tsc --noEmit
```

### Local Deployment (Hardhat Ignition)
Deploy the contract to an in-memory Hardhat node or local network:
```bash
npx hardhat ignition deploy ignition/modules/ZiwaChain.ts
```

---

## Project Documentation (Judge-Facing)

Judges can review the complete hackathon evaluation documentation via the links below:

| Document | Description |
|---|---|
| [Technical Specification & Architecture](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/architecture/spec.md) | System components, state machine, on-chain rules, and test proofs |
| [Event Schema & Data Model](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/architecture/eventSchema.md) | On-chain vs off-chain boundary, canonical serialization, and event envelope |
| [Security & Data Integrity Assessment](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/security/assessment.md) | Threat model, access control, mass balance, privacy via HMAC, and auditability |
| [Problem & Solution Overview](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/overview.md) | 2-page overview of the circular bioeconomy model on Lake Victoria |
| [Climate Impact Assessment](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/impact/impact-assessment.md) | Sourced methane-avoidance projections with low/high ranges and clear assumptions |
| [Adoption Strategy & Scalability Roadmap](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/adoption-and-scalability.md) | Field rollout, SACCO integration, and technical scaling path |
| [Demo Script](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/docs/demo-script.md) | Step-by-step 3-minute video demonstration script |

---

## Repository Layout

```
ziwachain/
├── contracts/
│   └── ZiwaChain.sol                 # Core smart contract (ERC-1155, AccessControl, Mass Balance)
├── test/
│   └── ZiwaChain.ts                  # Comprehensive automated test suite (42 unit tests)
├── ignition/
│   └── modules/
│       └── ZiwaChain.ts              # Hardhat Ignition deployment module
├── docs/
│   ├── architecture/
│   │   ├── spec.md                   # Full technical spec & architecture diagram
│   │   └── eventSchema.md            # Canonical event envelope & data dictionary
│   ├── security/
│   │   └── assessment.md             # Security, data integrity & threat analysis
│   ├── impact/
│   │   └── impact-assessment.md      # Carbon-reduction projections & climate rationale
│   ├── overview.md                   # 2-page problem & solution overview
│   ├── adoption-and-scalability.md   # Adoption strategy & scaling roadmap
│   ├── demo-script.md                # 3-minute video presentation script
│   ├── Learn/                        # Internal developer guides and debugging logs
│   └── internal/                     # Append-only internal build progress log
├── src/                              # Off-chain client modules (Task 2 & 3 in progress)
│   ├── hashing/                      # Canonical JSON (RFC 8785) & HMAC pseudonym derivation
│   ├── certificate/                  # Harvester proof certificate generator
│   └── sms/                          # SMS parser & confirmation hash utilities
├── hardhat.config.ts                 # Hardhat configuration (Solidity 0.8.28, Cancun, Base Sepolia)
├── package.json                      # Project dependencies & metadata
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## Status: Built vs Roadmap

To maintain total transparency with hackathon judges, our implementation status is categorized below:

### What Is Built and Proven by Tests
- **Core Smart Contract (`ZiwaChain.sol`):** Deployed and tested on Solidity 0.8.28 (`cancun` EVM) using OpenZeppelin v5 contracts.
- **Strict Linear Lifecycle:** Enforced stage transitions: `None` → `Harvested` → `Verified` \| `Rejected` → `Accepted` → `Processed` → `EndUse`.
- **Role-Based Access Control:** Distinct roles for `RELAYER_ROLE`, `VERIFIER_ROLE`, `BUYER_ROLE`, `PROCESSOR_ROLE`, and `DEFAULT_ADMIN_ROLE`.
- **Separation of Duties:** Relayers cannot act as verifiers (`VerifierCannotBeRelayer`).
- **Strict Mass-Balance Invariants:** Contract rejects transactions where `acceptedKg > harvestedKg`, `processedKg > acceptedKg`, or `endUseKgTotal > processedKg`.
- **Harvester Privacy:** Per-batch pseudonymous IDs (`HMAC-SHA256`) prevent public linkability of harvester identities across transactions.
- **Non-Transferable Work Credits:** ERC-1155 token ID 1 (`WORK_CREDIT`) minted 1:1 per kilogram reaching verified circular end use; token transfers are blocked via the `_update` hook.
- **Append-Only Tamper-Evident Corrections:** Hashes can only be superseded by their original author with a recorded reason; historical records remain immutable and visible.
- **Full Automated Test Suite:** 42/42 tests passing in `test/ZiwaChain.ts`.

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
