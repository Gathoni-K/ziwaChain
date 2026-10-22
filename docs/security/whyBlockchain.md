# Why ZiwaChain Uses a Blockchain

This section answers a question any reviewer should ask: could an ordinary database, or a signed log, do this job? We compare the options honestly, apply a concrete shared-trust test, and state what the chain does and does not give us.

## 0. The Shared-Trust Test

**Test:** Can two or more independent parties rely on the same record without trusting one party to control the whole record and its history?

For ZiwaChain, the parties are the harvester (submitting via SMS through the relayer), the field verifier (issuing an attestation from their own wallet; natural verifiers are BMU officials and county fisheries officers), the accepting and paying party (holding `BUYER_ROLE` in the contract, whether a public programme, donor fund, or processor), and a third party such as a SACCO loan officer or results-based funder who reads the certificate independently. Note that no commercial buyer was validated in the field; downstream chain-of-custody stages beyond verification are a pilot design evaluated with illustrative demo data.

**Answer for ZiwaChain:** Yes. The smart contract is the shared record. No single party controls it. The relayer cannot alter a verifier's attestation. The buyer cannot alter the harvest weight. The platform operator cannot delete or backdate any step. Any party, including a lender or auditor who has never interacted with ZiwaClear, can verify the record directly against the public chain without asking anyone for access.

**When a signed, append-only database should be used instead:** If all parties are willing to trust one operator, and independent verifiability without the operator is not a requirement, a tamper-evident signed log is simpler and cheaper and should be preferred. We apply that test honestly to our own case below.

## 1. The problem the design must solve

In a harvest-to-end-use chain, the party with the least power is the harvester. In a dispute over weight, acceptance or payment, the parties with the most power are the buyer and the platform operator. A normal database is controlled by its operator, so the operator (or someone pressuring the operator) could change, delete or backdate a record after the fact.

A harvester also needs proof that does not depend on the operator's goodwill: a lender, a funder or a buyer should be able to check a certificate without asking the platform for permission.

## 2. What a blockchain adds

| Property | Plain database | Signed log with timestamping | ZiwaChain |
|---|---|---|---|
| Outsiders cannot alter records | No | Yes | Yes |
| The operator cannot quietly alter history | No | Partly (the operator holds the signing key) | Yes |
| A third party can verify without the operator | No | Yes | Yes |
| Each party's own signature is native to the system | No | Needs extra setup | Yes |
| Process rules are enforced by public code | No | No | Yes |
| Records remain verifiable if the operator disappears | No | Partly | Yes |
| Cost and complexity | Lowest | Low | Higher |

The decisive advantages are **operator independence** and **shared, enforceable rules between parties who do not fully trust each other**. A signed log can match several of the other properties, and we do not claim otherwise.

## 3. How the design uses those advantages

ZiwaChain operates as a provenance and verification layer in the spirit of digital measurement, reporting and verification (dMRV) practice for biomass removal. It does not claim compliance with any specific dMRV standard, but the design choices align with dMRV principles:

- Verifiers, buyers and processors sign their steps with their own wallets, so the platform cannot forge a buyer's acceptance or a verifier's attestation.
- The contract enforces who may act at each stage, forbids a submitter from verifying its own harvest, and enforces mass balance, so quantities cannot appear from nowhere downstream.
- A verifier's decision is an on-chain attestation: the verifier's wallet address is permanently recorded alongside the batch stage, the evidence hash, and the payload hash. Only a separate address holding `VERIFIER_ROLE` may issue this attestation, and the relayer is cryptographically excluded from holding that role.
- Verification runs in the reader's browser against the public chain. No ZiwaClear server is involved in the check.
- Only hashes, stages and quantities are on-chain. Names, phone numbers, exact locations and photos stay off-chain, and each batch uses its own pseudonym, so the public record does not expose or link individual harvesters.
- Corrections are new records that supersede earlier ones. Nothing is erased, so mistakes are visible and traceable.

## 4. What the blockchain does not do

- **It does not verify the real world.** It cannot know whether a harvest happened or whether the biomass was water hyacinth. A valid hash confirms that a file matches the recorded hash; it does not confirm that the claims in the file are true. Accuracy at entry depends on the field verifier's attestation, the buyer's independent acceptance, the payment reference, and the harvester's own SMS confirmation. Making later alteration or denial of recorded facts detectable is what the chain provides.
- **Harvesters do not sign for themselves.** They report by SMS, and a ZiwaClear relayer submits their harvest. Their SMS confirmation adds agreement but is not a cryptographic signature, so harvester-side non-repudiation depends on the platform's custody of the relayer key.
- **Trust points remain.** One admin wallet grants roles and a single verifier role issues attestations. A multisignature admin and multi-verifier approval are on the roadmap.
- **The prototype runs on a testnet,** so it carries no real economic security yet.
- **Buyer validation & pilot design:** In the field, no commercial buyer was validated (local biogas demonstration sites source their own feedstock). The "buyer" role represents any accepting and paying party (programme, donor, or processor), and downstream stages beyond verification are a pilot design with illustrative demo data.
- **Provisional field findings:** Field observations are provisional and based on informal fieldwork around Dunga, Homa Bay, and Kendu Bay on Lake Victoria (Oct 18 to 19, 2026, across a small number of conversations).

## 5. Summary

ZiwaChain does not make the platform honest at the moment of entry. It makes the platform, and any other single party, unable to quietly change or deny what was recorded, and it lets a lender, funder or buyer check a harvester's certificate independently. That independence, together with rules enforced in public code and attestations signed by independent wallets, is why a blockchain fits this problem better than a database alone.