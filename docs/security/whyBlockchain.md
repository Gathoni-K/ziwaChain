# Why ZiwaChain Uses a Blockchain

This section answers a question any reviewer should ask: could an ordinary database, or a signed log, do this job? We compare the options honestly and state what the chain does and does not give us.

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

- Verifiers, buyers and processors sign their steps with their own wallets, so the platform cannot forge a buyer's acceptance or a verifier's decision.
- The contract enforces who may act at each stage, forbids a submitter from verifying its own harvest, and enforces mass balance, so quantities cannot appear from nowhere downstream.
- Verification runs in the reader's browser against the public chain. No ZiwaClear server is involved in the check.
- Only hashes, stages and quantities are on-chain. Names, phone numbers, exact locations and photos stay off-chain, and each batch uses its own pseudonym, so the public record does not expose or link individual harvesters.
- Corrections are new records that supersede earlier ones. Nothing is erased, so mistakes are visible and traceable.

## 4. What the blockchain does not do

- **It does not verify the real world.** It cannot know whether a harvest happened or whether the biomass was water hyacinth. It makes later alteration or denial of recorded facts detectable. Accuracy at entry depends on the field verifier, the buyer's independent acceptance, the payment reference and the harvester's own confirmation.
- **Harvesters do not sign for themselves.** They report by SMS, and a ZiwaClear relayer submits their harvest. Their SMS confirmation adds agreement but is not a cryptographic signature, so harvester-side non-repudiation depends on the platform's custody of the relayer key.
- **Trust points remain.** One admin wallet grants roles and a single verifier role approves harvests. A multisignature admin and multi-verifier approval are on the roadmap.
- **The prototype runs on a testnet,** so it carries no real economic security yet.

## 5. Summary

ZiwaChain does not make the platform honest at the moment of entry. It makes the platform, and any other single party, unable to quietly change or deny what was recorded, and it lets a lender, funder or buyer check a harvester's certificate independently. That independence, together with rules enforced in public code, is why a blockchain fits this problem better than a database alone.