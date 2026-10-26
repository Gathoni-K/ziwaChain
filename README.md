# ZiwaChain

**Verifiable chain of custody for environmental work on Lake Victoria.**

ZiwaChain is a blockchain-based traceability prototype for documenting the journey of harvested water hyacinth biomass—from collection and verification through acceptance, processing, and intended end use.

Developed by Gathoni Karume for the IEEE Global ClimateChain Hackathon 2026, Track 3: Sustainable Supply Chains, ZiwaChain explores a practical question: **How can environmental work be recorded and independently checked when multiple parties must trust the same delivery record?**

The prototype uses a Solidity smart contract deployed on Base Sepolia, cryptographic evidence hashes, batch-specific harvester pseudonyms, digital certificates, and non-transferable work credits to demonstrate how a shared record could support accountability across an informal biomass supply chain.

ZiwaChain is designed to complement [ZiwaClear](https://ziwa-clear.vercel.app/), a Lake Victoria water-hyacinth initiative. It is currently a standalone prototype; it is not yet integrated with ZiwaClear's operational workflows.

> **Current status:** Smart contract deployed on Base Sepolia; automated tests and a static web interface implemented; lifecycle demonstrated using synthetic batches. Live SMS/USSD integration, real payment reconciliation, commercial offtake, and field validation remain outstanding.

## Table of contents

- [The problem](#the-problem)
- [What ZiwaChain does](#what-ziwachain-does)
- [What the prototype demonstrates](#what-the-prototype-demonstrates)
- [How it works](#how-it-works)
- [Why blockchain](#why-blockchain)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Running the tests](#running-the-tests)
- [Running the simulated SMS demo](#running-the-simulated-sms-demo)
- [Demo batches](#demo-batches)
- [Deployment and verification](#deployment-and-verification)
- [Privacy and data integrity](#privacy-and-data-integrity)
- [Field observations and problem validation](#field-observations-and-problem-validation)
- [Limitations and assumptions](#limitations-and-assumptions)
- [Roadmap](#roadmap)
- [Project documentation](#project-documentation)
- [Repository structure](#repository-structure)
- [Acknowledgements](#acknowledgements)

## The problem

Water hyacinth (*Pontederia crassipes*) can obstruct fishing access and boat landings around Lake Victoria. Removing it is only one part of the challenge. Where removal is organised as paid environmental work, participants also need confidence that work will be recognised, accepted and paid for.

A potential chain of custody can involve several independent activities:

1. Biomass is collected.
2. The collection is inspected and verified.
3. An accepting party confirms the quantity it accepts.
4. Biomass is processed.
5. The intended end use is recorded.
6. Settlement and payment references are documented separately.

Without a consistent record, different participants may maintain separate accounts of what was collected, what was accepted, and what happened afterwards. This can make discrepancies difficult to investigate and delivery claims difficult for other parties to check.

ZiwaChain explores whether a shared, independently inspectable record can improve the traceability of those activities.

### Climate Impact Pathway

ZiwaChain addresses the traceability layer of water-hyacinth management. By documenting reported collection, verified acceptance, processing and intended end use, the prototype explores how environmental work could become easier to inspect and account for across a fragmented biomass supply chain.

This traceability could support future assessments of environmental outcomes, including the potential climate benefits of biomass utilisation. Depending on the baseline scenario and management pathway, these could include avoided methane emissions or displacement of conventional energy and products. Neither benefit can be assumed from harvesting alone.

The current prototype does not measure greenhouse-gas emissions, calculate verified methane avoidance, or establish net climate benefits. Its demonstration uses synthetic batches, and the corresponding physical activities have not been validated. Establishing climate impact would require reliable field measurements, a defensible baseline, evidence of actual downstream utilisation, and an appropriate methodology for estimating net emissions.

ZiwaChain's current contribution is therefore a prototype for traceability and environmental accountability, with climate-impact assessment identified as a future validation step.

### The field context

Informal fieldwork around Dunga, Homa Bay and Kendu Bay on Lake Victoria on 18–19 October 2026 helped refine the problem framing.

Conversations suggested that:

- Some fishers would consider harvesting water hyacinth for financial compensation, but trust in paid-removal schemes is a concern.
- Participants described alleged scams involving registration fees and funded removal activities. These are reported accounts, not independently verified findings.
- The presence of hyacinth varied considerably between locations. Some participants described episodic arrivals that can interfere with boat access before wind or water movement shifts the mats.
- At Dunga, a fisher reported that hyacinth had not been a significant problem there for approximately three years.
- No dependable commercial biomass buyer was validated during the fieldwork. Local biogas demonstration sites contacted or discussed during the investigation were reported to source their own feedstock.

These observations came from a small number of conversations and site observations. They are provisional, location-specific findings—not a representative survey of Lake Victoria or proof that every reported problem occurs across the region.

The findings also exposed a fundamental constraint: **better records cannot create biomass supply, guarantee payment, or establish a market for harvested material.**

### What ZiwaChain addresses

ZiwaChain focuses on the evidence and traceability layer:

- Recording lifecycle events against a batch.
- Enforcing quantity constraints between lifecycle stages.
- Separating submission, verification, acceptance and processing responsibilities.
- Recording evidence corrections without silently erasing the earlier record.
- Providing certificate data that can be checked against the blockchain.
- Demonstrating a workflow for recording a harvester's settlement confirmation.

### What ZiwaChain does not solve

ZiwaChain does not, by itself:

- Ensure that water hyacinth is present at a particular location.
- Organise or fund harvesting operations.
- Guarantee that a buyer or processor exists.
- Prove that a physical collection, inspection or processing event occurred.
- Guarantee that an M-Pesa payment reached a harvester.
- Prevent off-chain registration-fee scams.
- Establish accredited carbon credits or verified emissions reductions.

Those challenges require operational partners, reliable field evidence, funding arrangements and a viable downstream use for the biomass.

## What ZiwaChain does

The prototype combines on-chain lifecycle controls with off-chain evidence and a public verification interface.

| Capability | Purpose |
|---|---|
| Lifecycle recording | Records batch progression from collection to end use. |
| Role-based permissions | Restricts lifecycle actions to authorised roles. |
| Quantity invariants | Prevents recorded accepted, processed and end-use quantities from exceeding their permitted upstream quantities. |
| Evidence corrections | Records superseding evidence hashes and correction reasons while retaining the earlier history. |
| Duplicate-evidence flagging | Flags reuse of an identical evidence hash across different batches. |
| Harvester pseudonyms | Uses batch-specific pseudonyms instead of publishing a harvester's direct identity. |
| Digital certificates | Generates portable certificate data, a short code and a QR code. |
| Public verification interface | Checks certificate data against the deployed contract and its event history. |
| Non-transferable work credits | Demonstrates recording a work-credit token for each kilogram reaching the recorded end-use stage. |
| Simulated SMS workflow | Demonstrates settlement-confirmation and proof-delivery logic without a live SMS provider. |

The prototype is intended to make records easier to inspect. It does not make inaccurate information true merely by recording it on a blockchain.

## How it works

The intended batch lifecycle is:

**Collection → Verification or Rejection → Acceptance → Processing → End Use**

Settlement confirmation is recorded as a separate workflow rather than being treated as proof that the physical biomass lifecycle has been completed.

### 1. Collection

A collection record establishes a batch and its reported harvested quantity. The prototype uses a relayer model to submit transactions on behalf of a harvester-facing workflow.

The current demonstration uses synthetic records and development signers. Live SMS/USSD submission from field participants has not been integrated.

### 2. Verification or rejection

An authorised verifier approves or rejects the submitted batch.

The contract enforces role permissions and prevents an address holding the relayer role from also acting as the verifier. The current implementation still relies on a single authorised verifier; multi-verifier consensus is proposed future work.

### 3. Acceptance

An authorised buyer-role account records the quantity accepted.

In the intended operating model, the accepting party may be a commercial processor, a programme or another funder responsible for accepting and paying for the work. No dependable commercial biomass buyer was validated during the field investigation, so this role should not be interpreted as evidence of an established market.

### 4. Processing

An authorised processor records the quantity processed. The contract constrains the recorded quantity to the accepted amount.

### 5. End use

The final lifecycle stage records the quantity assigned to an intended beneficial end use. The cumulative recorded end-use quantity cannot exceed the recorded processed quantity.

The contract mints non-transferable `WORK_CREDIT` tokens at this stage, at a ratio of one token per recorded kilogram reaching end use.

These tokens represent recorded work within the prototype. They are **not money, proof of independently measured environmental impact, or accredited carbon credits**.

### 6. Settlement confirmation

The prototype includes a simulated SMS conversation in which a harvester confirms settlement using a short code. The workflow assembles a settlement-confirmation payload and submits the corresponding record through a relayer.

The payment reference is hashed, and the harvester's confirmation is recorded as an attestation. The workflow does not independently establish that money was transferred or received.

Live telecom integration and automated M-Pesa reconciliation remain future work.

## Why blockchain

A conventional database can also store lifecycle records, enforce quantity rules and maintain an audit log. Blockchain is not inherently necessary for every traceability application.

ZiwaChain explores blockchain because multiple parties may need to inspect a common record without relying solely on one organisation's private database.

The prototype demonstrates three specific design choices:

1. **A shared transaction history:** Lifecycle events are recorded on a public testnet and can be inspected independently.
2. **Enforced transition rules:** The contract rejects transactions that violate its lifecycle permissions or quantity invariants.
3. **Checkable evidence references:** Certificates can be checked against hashes and events recorded on-chain, including the history of superseded evidence.

This is an architectural rationale, not evidence that blockchain has already improved accountability in a live Lake Victoria supply chain.

The benefits depend on reliable evidence at the point of collection, appropriate verification, trusted operating arrangements and participation by the relevant parties. A blockchain can preserve an inaccurate claim just as persistently as an accurate one.

## Architecture

ZiwaChain separates transaction enforcement from certificate construction, user-interface logic and the simulated communications workflow.

### On-chain

The Solidity smart contract is responsible for:

- Lifecycle state transitions.
- Role-based access control.
- Quantity invariants.
- Recording lifecycle events and evidence hashes.
- Tracking first use of evidence hashes and emitting reuse alerts.
- Recording settlement-confirmation references.
- Minting non-transferable work-credit tokens.

### Off-chain

The TypeScript modules handle:

- Canonical JSON serialization and hashing.
- Per-batch pseudonym derivation.
- Certificate generation and QR-code creation.
- Simulated SMS settlement and proof delivery.
- User-interface presentation and certificate verification logic.

The browser-based verification interface queries Base Sepolia through a public JSON-RPC endpoint. It does not require a custom application backend for its static hosting, but blockchain verification requires network access to the RPC service.

### Roles

| Role | Responsibility |
|---|---|
| Admin | Manages contract roles and permissions. |
| Relayer | Submits permitted transactions on behalf of the harvester-facing workflow. |
| Verifier | Approves or rejects a submitted batch. |
| Buyer | Records acceptance of a verified batch. In the intended model, this is the accepting and paying party. |
| Processor | Records processing and the subsequent end-use stage. |
| Harvester | Participates through the intended low-bandwidth reporting and settlement-confirmation workflow; the current implementation uses a relayer rather than a harvester-controlled EVM wallet. |

The role separation is enforced by contract permissions where implemented. It does not independently establish that a real-world participant is honest or that a physical event occurred.

## Technology stack

| Component | Technology |
|---|---|
| Smart contracts | Solidity 0.8.28 |
| Contract framework | Hardhat |
| Contract libraries | OpenZeppelin Contracts v5 |
| Blockchain | Base Sepolia testnet |
| Off-chain tooling | TypeScript |
| Frontend | React 19, Vite 8 and Tailwind CSS 4 |
| Serialization | RFC 8785 JSON Canonicalization Scheme |
| Evidence hashing | Keccak-256 |
| Harvester pseudonyms | HMAC-SHA256 |
| Short codes | Crockford Base32 |
| Certificate format | Version 1 JSON certificate with QR-code output |
| Communications prototype | Simulated SMS gateway |

## Getting started

### Prerequisites

- Node.js 18 or later, preferably a supported current release.
- npm 9 or later.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/Gathoni-K/ziwaChain.git
cd ziwaChain
npm install
```

### 2. Compile the smart contracts

```bash
npx hardhat clean
npx hardhat compile
```

This cleans previous build output, compiles the contracts and regenerates the associated build artifacts and TypeChain bindings as configured by the project.

### 3. Run the test suite

```bash
npm test
```

The test suite covers contract lifecycle rules, quantity constraints, work-credit transfer restrictions, evidence corrections, duplicate-evidence flagging, hashing, pseudonyms, certificate generation, verification logic, simulated SMS flows and related implementation checks.

The development test suite was reported as passing 99 automated tests. Run it against the current checkout to confirm the result for your environment.

### 4. Build the web interface

```bash
npm run web:build
```

The Vite build produces static files under `web/dist/`, including:

- `web/dist/index.html` — home and code-lookup interface.
- `web/dist/verify/index.html` — certificate verification route.
- `web/dist/certificate.html` — printable certificate template.
- `web/dist/assets/` — generated frontend assets.

### 5. Run the development server

```bash
npm run web:dev
```

Use the local address printed by Vite to open the application. Live verification against Base Sepolia requires an internet connection and access to the configured RPC endpoint.

### 6. Run the simulated SMS demonstration

```bash
npm run demo:sms
```

This runs the settlement-confirmation and proof-delivery workflow using the simulated chat gateway. It does not send real SMS messages.

## Running the simulated SMS demo

The communications prototype demonstrates the intended sequence:

1. A batch has been accepted.
2. The simulated harvester receives a settlement-confirmation prompt.
3. The harvester replies with the expected confirmation format and short code.
4. The workflow validates the reply and assembles a settlement-confirmation payload.
5. A relayer records the confirmation through the contract workflow.
6. The simulated system provides a proof short code or link.

The prototype includes retry handling and phone-number masking in its simulated workflow.

**This is a simulation, not a live SMS service.** Africa's Talking or another telecom provider is not integrated into the current release, and the project does not yet use a live USSD gateway or automatically reconcile M-Pesa transactions through Safaricom Daraja.

## Demo batches

ZiwaChain uses four illustrative batches to exercise different parts of the lifecycle. They are synthetic examples, not records of actual water-hyacinth harvesting.

| Batch | Scenario | What it demonstrates |
|---|---|---|
| Batch A | Complete illustrative journey | 1,000 kg reported harvested, 900 kg accepted, and 800 kg processed and recorded at end use. |
| Batch B | Rejected batch | Rejection handling and prevention of progression through the successful lifecycle. |
| Batch C | Evidence correction | Superseding an earlier evidence hash while preserving the recorded correction history. |
| Batch D | Reused evidence | Flagging an identical evidence hash reused across different batches. |

For Batch A, the prototype records 800 `WORK_CREDIT` tokens at the final lifecycle stage.

These values exist to demonstrate the contract and interface. They are not measured Lake Victoria harvests, verified field weights, confirmed payments, actual processing records or evidence of environmental outcomes.

The duplicate-evidence mechanism identifies exact cryptographic hash reuse. It cannot establish whether two different files depict the same physical material.

## Deployment and verification

### Existing Base Sepolia deployment

The prototype has been deployed to Base Sepolia.

- **Contract address:** [`0xeFDac2CA0818ac06EdC4184384DAE8B39315ACde`](https://sepolia.basescan.org/address/0xeFDac2CA0818ac06EdC4184384DAE8B39315ACde)
- **Network:** Base Sepolia testnet
- **Explorer:** [View the contract on BaseScan](https://sepolia.basescan.org/address/0xeFDac2CA0818ac06EdC4184384DAE8B39315ACde)

Testnet deployment demonstrates that the contract has been deployed to the specified network. It is not a production deployment or an independent security audit.

### Deploying a new instance

For a new deployment, first review the Hardhat configuration and `.env.example`.

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Configure the deployment settings required by the project, including the deployer private key, the pseudonym secret and the appropriate testnet funding.

3. Ensure the private key and secret remain local and are never committed to source control or included in a public frontend build.

4. Follow the project's Hardhat deployment configuration and Ignition module instructions for the intended network.

The deployer private key and pseudonym secret serve different purposes. A deployer key authorises blockchain transactions; the pseudonym secret is used by the off-chain pseudonym derivation workflow. Neither should be exposed publicly.

### Seeding illustrative batches

The seed script is intended to create demonstration records and associated metadata.

```bash
npx hardhat run scripts/seed.ts
```

The default local Hardhat network is suitable for isolated development. A Base Sepolia run requires the network configuration, environment variables and testnet funding described above:

```bash
npx hardhat run scripts/seed.ts --network baseSepolia
```

The script is designed to create illustrative batch data, including a complete journey, rejection, correction and duplicate-evidence scenario. Inspect the current script and its output before relying on the precise number of records or transactions produced by a particular run.

Generated metadata is written to `demo/demo-data.json`. Treat this file as development output: it can contain sensitive test artefacts, salts, payloads and transaction information. Do not publish private keys or operational secrets.

### Contract verification on the explorer

The repository includes a helper for submitting contract verification through Etherscan V2, configured for the relevant network.

```bash
npx hardhat run scripts/verify.ts --network baseSepolia
```

Review the script's prerequisites and confirm that the deployment metadata matches the contract being verified before running it. A successful deployment does not automatically mean that the source has been verified on the explorer.

### Certificate and QR verification

The certificate pipeline generates JSON certificate data, a short code and QR-code output. The browser verification implementation is designed to check certificate information against on-chain records.

The verification design includes:

- Recomputing cryptographic hashes.
- Checking transaction and event provenance.
- Reviewing superseded evidence.
- Checking quantity invariants.
- Checking the recorded payment-reference evidence.

Automated tests cover the verification logic. The complete deployed journey—from scanning a generated QR code on a separate phone to successfully verifying the correct certificate against the live testnet—must be confirmed through an end-to-end test before it is presented as fully validated.

A successful hash check confirms consistency with the recorded hash; it does not independently prove the truth of the underlying physical claim.

## Privacy and data integrity

ZiwaChain uses cryptographic mechanisms to limit direct identity exposure and make evidence changes inspectable.

### Batch-specific pseudonyms

The off-chain hashing module derives a pseudonym using HMAC-SHA256. Pseudonyms are scoped to individual batches rather than being intended as a single public identity reused across every batch.

This reduces straightforward public linkability across batches, but it is not a guarantee of complete anonymity. Metadata, operational practices, exposed files or compromised secrets could still create privacy risks.

### Canonical serialization and hashes

The hashing module uses RFC 8785 JSON Canonicalization Scheme (JCS) to produce a deterministic representation of JSON data before hashing.

The project uses random salts and Keccak-256 payload hashes. The hash enables a verifier to check whether supplied data matches the recorded digest, subject to the implementation and the availability of the correct payload and salt.

A hash is not encryption. It does not make the underlying data confidential if that data is separately exposed.

### Evidence corrections

When evidence needs correction, the implementation records a superseding hash and a correction reason rather than silently replacing the previous reference. The original history remains inspectable.

This provides a record of changes, not an independent determination that the correction is justified.

### Duplicate-evidence detection

The contract tracks first use of evidence hashes and emits an event when the same hash is reused across batches.

This detects exact hash reuse. It does not identify visually similar evidence, modified copies, different photographs of the same biomass or fabricated evidence that has never been used before.

### Personal information and payment references

Direct personal identifiers should not be placed on-chain. The prototype uses pseudonyms and hashes for the relevant data flows, but off-chain storage and communications still require appropriate safeguards.

A hashed payment reference is a record of a reference, not a payment-provider confirmation. The settlement workflow's harvester reply is an attestation recorded through a relayer, not a native cryptographic signature generated by the harvester's own wallet.

## Field observations and problem validation

Fieldwork is informing the operating model as well as the technical design.

The initial assumption was that traceability could help coordinate a relatively straightforward removal-and-utilisation supply chain. The observations challenged that assumption.

### 1. The problem is episodic and location-dependent

Hyacinth conditions differed between the sites visited and discussed. A site that has little visible hyacinth during a visit may still experience short periods of disruption. Wind and water movement can shift mats between locations.

This suggests that a future operating model should be responsive to actual local conditions rather than assume that a single site continuously supplies biomass.

### 2. Participation depends on trust and incentives

Some fishers expressed willingness to harvest for compensation, while reported experiences with scams contributed to distrust.

A traceability record may help document commitments and work, but it cannot ensure that funding exists or that a payer honours an obligation. A credible pilot would need clear payment terms, identifiable responsible parties and a way for harvesters to check those terms before work begins.

### 3. Downstream demand remains unresolved

The investigation did not establish a dependable commercial buyer ready to purchase harvested hyacinth biomass. Potential uses of the biomass are not the same as confirmed demand, and a demonstration facility is not automatically a buyer.

Any operational pilot must validate the intended end use, acceptance criteria, logistics, unit economics and who pays for collection before assuming the chain can sustain itself.

### 4. Traceability is one component of a wider system

ZiwaChain addresses how evidence and lifecycle records are organised. It does not replace local coordination through Beach Management Units (BMUs), county fisheries officers, field verification, protective equipment, harvesting logistics or downstream processing capacity.

The next stage is to validate whether the record is useful to the people who would actually collect, verify, accept, process and pay for the biomass.

## Limitations and assumptions

The following limitations are material to interpreting the current prototype.

1. **Standalone prototype:** ZiwaChain is not currently integrated with ZiwaClear's operational workflows.
2. **Synthetic data:** Demonstration batches are illustrative and do not represent actual harvesting, weighing, acceptance, processing or end-use events.
3. **Testnet only:** The deployed contract is on Base Sepolia, not a production network.
4. **No live SMS or USSD:** The communications workflow uses a simulated gateway. Field submissions through a live provider are not implemented.
5. **Relayer trust:** Transactions submitted on behalf of a harvester depend on the relayer's key custody and server integrity. The current workflow does not give the harvester native EVM-wallet signing.
6. **Settlement is not payment proof:** The prototype records a hashed payment reference and a simulated harvester confirmation. It does not independently confirm that funds reached the intended recipient.
7. **Single-verifier trust:** An authorised verifier can approve or reject a batch. Multi-verifier consensus is not implemented.
8. **No established commercial offtake:** A dependable commercial buyer was not validated during the fieldwork. The buyer role can represent an accepting payer, such as a programme or funder, but this is an operating-model possibility, not an established partnership.
9. **Physical claims require real-world checks:** The contract cannot establish whether reported weights, inspections, processing or end use are physically accurate.
10. **No independent security audit:** Automated tests are not a substitute for an independent review of the contract, cryptographic implementation, deployment configuration and operating model.
11. **Certificate journey requires end-to-end validation:** Component tests do not by themselves establish that every generated QR code opens the correct deployed certificate and completes live verification.
12. **Correction constraints:** Evidence correction preserves history, but the current contract does not provide a general post-acceptance quantity-adjustment or dispute-resolution mechanism.
13. **Exact-hash reuse only:** Duplicate-evidence detection does not detect altered copies or semantically similar evidence.
14. **No accredited carbon credits:** `WORK_CREDIT` tokens are non-transferable work-accounting units within the prototype. They do not represent certified carbon offsets, measured methane avoidance or independently verified climate benefits.
15. **Provisional field evidence:** Findings from 18–19 October 2026 are based on a small number of informal conversations and observations at specific locations. They should not be generalised to the whole lake.
16. **No demonstrated economic sustainability:** The prototype does not establish who will fund removal, whether the cost per kilogram is viable, whether processing has sufficient demand, or whether any participant will pay for traceability.

These limitations are not incidental to the project. They define what must be validated before the prototype can support real operations.

## Roadmap

The next phase prioritises validating the operating model rather than adding technical complexity for its own sake.

### Phase 1 — Validate the workflow

- Engage potential harvesters, BMU representatives, verifiers and accepting payers.
- Establish who is responsible for each lifecycle stage.
- Define evidence requirements, quantity measurement and acceptance criteria.
- Determine how participants can verify payment commitments and resolve disputes.
- Confirm whether a traceable batch record is useful to the people expected to use it.

### Phase 2 — Validate the downstream chain

- Identify and assess potential processors and end-use partners.
- Establish whether there is dependable demand for the material.
- Determine who funds harvesting and protective equipment.
- Estimate collection, handling, transport and processing costs.
- Test whether the proposed incentive model can work without assuming a buyer or grant that has not been secured.

### Phase 3 — Integrate real-world workflows

Subject to the results of validation:

- Connect a live SMS provider and investigate a practical USSD workflow.
- Integrate with ZiwaClear where the operating model requires it.
- Develop appropriate payment reconciliation and pre-commitment mechanisms.
- Validate certificate and QR journeys end to end.
- Improve verifier independence and dispute handling.

### Phase 4 — Pilot and assess readiness

- Run a limited, consent-based pilot with real participants and documented evidence.
- Assess usability, data quality, payment reliability and operating costs.
- Evaluate the usefulness of the traceability record to each participant.
- Obtain an independent security review before production deployment.
- Assess environmental outcomes separately using an appropriate, defensible measurement methodology.

**Next milestone:** Validate the workflow, responsibilities, evidence and payment arrangements with real participants before treating the prototype as an operational supply-chain system.

No dates, funding, partnerships or field deployment commitments are implied by this roadmap.

## Project documentation

The repository includes supporting technical and project documents:

| Document | Description |
|---|---|
| [System Architecture Specification](docs/architecture/architecture.md) | Component architecture, on-chain/off-chain boundaries and role definitions. |
| [Security & Data Integrity Assessment](docs/security/securityAndDataIntegrity.md) | Threat model, permissions, quantity invariants and privacy considerations. |
| [Why Blockchain?](docs/security/whyBlockchain.md) | Architectural rationale and comparison with alternative recordkeeping approaches. |
| [Climate Impact Assessment](docs/impact/climateImpactAssessment.md) | Assumptions and models for exploring potential climate effects. Projections are not verified outcomes. |
| [Problem & Solution Overview](docs/overview.md) | Project context, field problem and proposed approach. |
| [Adoption Strategy & Scalability Roadmap](docs/adoptionAndScalability.md) | Proposed adoption pathway, pilot considerations and scaling assumptions. |
| [Demo Video Script](docs/demoScript.md) | Timed demonstration script and visual cues. |
| [Technical Specification & Test Proofs](docs/architecture/spec.md) | Contract rules and associated test coverage. |
| [Gas Cost Estimate](docs/architecture/gasCostEstimate.md) | Gas estimates and assumptions for the documented functions. |
| [Event Schema & Data Model](docs/architecture/eventSchema.md) | Event structure and data definitions. |

These documents describe the current design, test coverage, assumptions and proposed future work. Their inclusion does not imply that every proposed capability has been deployed or validated in the field.

## Repository structure

```text
ziwaChain/
├── contracts/
│   ├── ZiwaChain.sol
│   └── test/
│       └── PlainRelayer.sol
├── scripts/
│   ├── seed.ts
│   ├── makeCertificates.ts
│   ├── demoSms.ts
│   └── verify.ts
├── test/
│   ├── ZiwaChain.ts
│   ├── hashing.test.ts
│   ├── certificate.test.ts
│   ├── verify.test.ts
│   ├── sms.test.ts
│   └── links.test.ts
├── demo/
│   ├── demo-data.json
│   └── certificates/
├── ignition/
│   └── modules/
│       └── ZiwaChain.ts
├── web/
│   ├── index.html
│   ├── verify/
│   │   └── index.html
│   ├── react-main.tsx
│   ├── main.ts
│   ├── config.ts
│   ├── context.tsx
│   ├── i18n.ts
│   ├── demo-fixtures.ts
│   ├── style.css
│   ├── tailwind.css
│   ├── certificate.html
│   └── dist/
├── src/
│   ├── hashing/
│   ├── certificate/
│   └── sms/
├── docs/
│   ├── architecture/
│   ├── security/
│   ├── impact/
│   ├── overview.md
│   ├── adoptionAndScalability.md
│   ├── demoScript.md
│   ├── Learn/
│   └── internal/
├── vite.config.mts
├── hardhat.config.ts
└── package.json
```

Generated build output, local environment files and demonstration artefacts should be handled according to the repository's `.gitignore` and security practices. Inspect generated demo metadata before sharing it publicly.

## Acknowledgements

ZiwaChain was developed by **Gathoni Karume** for the IEEE Global ClimateChain Hackathon 2026, Track 3: Sustainable Supply Chains.

The project builds on the broader problem explored through ZiwaClear: how to support the removal and downstream utilisation of water hyacinth around Lake Victoria. Field observations informed the problem framing, while the current ZiwaChain implementation focuses on the traceability and evidence layer.

## Final note

ZiwaChain is an exploration of how blockchain-based records could make environmental work easier to trace and inspect. Its current contribution is a deployed testnet prototype with lifecycle controls, evidence-handling logic, certificates and a simulated settlement workflow.

The next challenge is not simply to add more code. It is to establish whether the people who would use the system need it, whether the underlying supply chain can operate reliably, and whether the evidence recorded corresponds to real work and real outcomes.
