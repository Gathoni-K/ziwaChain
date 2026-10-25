# ZiwaChain: Problem & Solution Overview

**Track:** Sustainable Supply Chains & Circular Economy  
**Focus:** Invasive Aquatic Biomass Traceability & Harvester Provenance on Lake Victoria  
**Target Deployment:** Base Sepolia (Solidity 0.8.28, EVM Cancun)  

---

## 1. Executive Summary

**ZiwaChain** lets harvesters, buyers, verifiers and lenders rely on the same delivery record without having to trust a single operator. It establishes a verified chain of custody for invasive water hyacinth (*Pontederia crassipes*) biomass from Lake Victoria, operating as a provenance and verification layer in the spirit of digital measurement, reporting and verification (dMRV) practice for biomass removal. By enforcing strict mass-balance validation, independent role-based verification, and two-sided settlement co-signing, ZiwaChain produces portable, tamper-evident digital certificates for informal workers and issues non-transferable work credits for verified circular diversion. ZiwaChain does not claim compliance with any specific dMRV standard.

Provisional informal fieldwork conducted around Lake Victoria (Dunga, Homa Bay, and Kendu Bay, Oct 18 to 19, 2026, across a small number of conversations) revealed that the central barrier to managing water hyacinth is **trust in paid removal**. Fishers reported that they would harvest weed if paid, but they expect immediate payment and deeply distrust paid harvesting schemes after a reported scam where people paid registration fees to an organizer who disappeared. A second reported scam concerned the funder side: parties reportedly claimed to be managing the weed, then waited for it to recede naturally instead of carrying out the funded removal. These provisional reports suggest that paid-removal schemes can fail on trust from both sides. Furthermore, weed presence is seasonal and localized (reported as arriving around July and leaving around August, causing about a week of lost fishing when a landing is blocked; weed has been absent at Dunga for roughly three years and was minimal at Homa Bay during field visits), and no dependable commercial buyer was found (a local biogas demonstration site sources its own feedstock). Where weed arrives, fishers clear narrow paths around their boats and leave weed on the shore, or wait for wind to blow it out. Information flows strictly through county fisheries officers and Beach Management Unit (BMU) officials down to fishers.

**What ZiwaChain addresses:**
- **Verifiable proof of delivery, verification, and payment:** Equip informal harvesters with portable, tamper-evident digital proof of their work and two-sided settlement confirmation that they hold independently on their phone or on paper.
- **Operator-independent shared trust:** A shared record on Base Sepolia that harvesters, accepting payers, verifiers, and community lenders can verify directly without trusting any single platform or middleman database.

**What ZiwaChain does NOT address:**
- It does not generate biomass supply or eliminate ecological seasonality.
- It does not create commercial demand or validate buyers where none exist.
- It cannot prevent an organizer from demanding illicit cash registration fees off-chain, though pre-funded commitment and escrow models on our roadmap directly target this vulnerability.

---

## 2. The Problem: Trust, Ecological Seasonality, and Invisibility

### A. Trust in Paid Removal & The Scam Shadow
Informal fishers and shoreline residents state clearly that they are willing to harvest weed if paid, but they demand immediate payment and carry acute distrust of paid collection initiatives. In one widely cited incident reported by fishers, participants were persuaded to pay up-front registration fees for a harvesting scheme, only for the organizer to disappear with the funds. Any mechanism relying on delayed or uncertain payment fails immediately in this environment. Furthermore, because harvesters operate without verifiable delivery receipts, they are exposed to arbitrary deductions or non-payment disputes by middlemen.

### B. Ecological Seasonality & Localized Occurrence
Water hyacinth is not a constant, uniform blanket across Lake Victoria. Field observations and fisher reports indicate that weed presence is seasonal and localized: mats arrive around July and disperse or depart around August, often trapping boats and causing roughly a week of lost fishing at afflicted landings before shifting. Other landings (such as Dunga) have been free of hyacinth mats for approximately three years, and Homa Bay exhibited minimal shoreline weed during October 2026 visits. Reports indicating that weed originates from the northern shore (Uyoma) remain second-hand and unverified. When weed is removed locally, fishers clear narrow paths around their vessels and leave weed on the shore to dry aerobically, or wait for wind currents to move it.

### C. The Traceability & Underwriting Deficit
Community lenders (such as agricultural SACCOs) require documented cash flow or supply consistency to underwrite microloans. Harvesters cannot prove their historical production, trapping them in liquidity distress. Concurrently, potential public-works programmes, donor funds, and circular processors require verifiable proof that collected biomass was harvested from genuine infestation sites and that funds reached frontline harvesters without leakages.

---

## 3. The Solution: Harvester-First Circular Chain of Custody

ZiwaChain does not impose complex crypto-native friction on informal workers. Instead, it leverages an asymmetric architecture where informal workers interact via familiar SMS rails while commercial actors and the protocol maintain on-chain cryptographic integrity:

```
[Harvester (SMS)] ──► [ZiwaClear Relayer] ──► [ZiwaChain.sol (Base Sepolia)]
                                                    ▲
[Field Verifier (Wallet)] ──────────────────────────┤
[Accepting Payer / Buyer (Wallet + M-Pesa)] ────────┤
[Bio-Processor (Wallet)] ───────────────────────────┘
```

> [!NOTE]
> **Clarification on the "Buyer" Role:**
> In ZiwaChain's contract and documentation, the term "buyer" (`BUYER_ROLE`) designates the accepting and paying party: whether a commercial processor, a municipal or county public works programme, or an environmental donor fund. No commercial buyer was validated during field visits (local biogas demonstration sites source their own feedstock). Chain-of-custody stages beyond verification (buyer acceptance, processing, and end use) represent a pilot design demonstrated with illustrative demo data.

### Key Pillars of the ZiwaChain Protocol

1. **Inclusive Onboarding via Relayed Telemetry:**
   Harvesters report harvest tallies through standard SMS/USSD messages. ZiwaClear's relayer logs the harvest on Base Sepolia, anchoring a salted payload hash and an un-linkable HMAC pseudonym without requiring harvesters to hold wallets or pay gas fees. In the current prototype the SMS gateway is simulated; production integration with a telecom operator (such as Africa's Talking) is a planned next step.
2. **Separation of Duties and Field Attestation:**
   Biomass cannot advance to acceptance without an attestation from an authorized field verifier. The contract explicitly enforces separation of duties: relayers who log harvests are cryptographically prohibited from verifying them (`VerifierCannotBeRelayer`). The field inspection, weighbridge check, and intake sampling described here represent the intended real-world process; in the prototype these steps are carried out by demo accounts running locally, not by physical inspectors.
3. **Strict On-Chain Mass Balance:**
   The smart contract natively enforces conservation of mass:
   $$\text{acceptedKg} \le \text{harvestedKg} \quad \text{and} \quad \text{processedKg} \le \text{acceptedKg} \quad \text{and} \quad \sum \text{endUseKg} \le \text{processedKg}$$
   This guarantees that volume cannot be synthetically inflated at any intermediate stage.
4. **Two-Sided Settlement Attestation:**
   The accepting and paying party signs acceptance using their EVM wallet, committing the hash of the off-chain M-Pesa transaction reference. The harvester confirms payment receipt via a two-way SMS code ("YES 4821"), permanently locking the settlement attestation on-chain. In the prototype, the buyer is a demo development account and the M-Pesa reference is illustrative demo data.
5. **Portable Harvester Proof (Certificates & Short Codes):**
   Upon settlement, the harvester receives a portable certificate containing canonical payload metadata, random salts, and on-chain event references (`src/certificate/build.ts`). Harvesters receive a 10-character Crockford Base32 short code (e.g. `TR8NZ-A9VC5`) via SMS or a printable QR code. This certificate can be verified by any third party (such as a SACCO loan officer) using a static, browser-based verification interface that directly queries the blockchain without intermediate database dependencies.
6. **Incentivizing Circular Outcomes (Work Credits):**
   Biomass diverted into verified circular processing mints non-transferable ERC-1155 `WORK_CREDIT` tokens (1 credit per kilogram reaching final end use). These tokens reward proven circularity without introducing secondary market speculation.

---

## 4. Current Prototype vs Roadmap

| Dimension | Built Prototype (Current Milestone, Oct 2026) | Planned Production Roadmap |
|---|---|---|
| **Commitment Before Work** | Today, payment occurs off-chain via M-Pesa, and the chain records a payment reference hash and the harvester's two-way SMS confirmation. The accepting party signs via `BUYER_ROLE` using demo data. | Payer pre-funding and smart contract escrow locking funds before harvest begins, guaranteeing payout upon verification and protecting harvesters from registration scams. |
| **Smart Contract** | Full lifecycle contract (`ZiwaChain.sol`) deployed and tested on Base Sepolia with 48 contract unit tests; off-chain hashing module (`src/hashing/`), harvester certificate pipeline (`src/certificate/`), public in-browser verify page (`web/`), simulated SMS engine (`src/sms/`), and 99 total passing tests. Demo batches are illustrative data generated by a local seed script, not real harvests. | Mainnet deployment on Base L2 |
| **Verification** | Single independent verifier role with relayer exclusion | 2-of-N multi-signature verifier consensus (e.g., BMU official + fisheries officer) |
| **Outcome evidence** | Not built: records activity evidence, not attributable ecological outcomes | **Roadmap, unvalidated:** independent outcome evidence such as before-and-after satellite observation (only once ZiwaVision is validated), nearby comparison sites, and seasonal baselines |
| **Harvester Privacy** | Per-batch HMAC-SHA256 pseudonyms preventing public linkability | Zero-knowledge proof bundles for aggregate income disclosure |
| **Settlement** | M-Pesa hash anchoring + SMS two-way co-signing | Automated webhook reconciliation via Safaricom Daraja API |
| **Credits** | Non-transferable ERC-1155 tokens tracking verified end-use mass | Redemption marketplace for subsidized tools and inputs |
| **Lender Tools** | Standalone certificate verification via public web tool | Batch Merkle statements for bulk SACCO underwriting |
| **Telecom Integration** | Simulated SMS gateway (`SimulatedGateway` in `src/sms/gateway.ts`) and end-to-end conversation runner (`npm run demo:sms`). The prototype prints chat to stdout; no real SMS messages are sent. | Production adapter for Africa's Talking and Safaricom USSD gateway |

---

## 5. Honest Limitations

1. **Relayer Key Custody:** Because harvesters do not manage private keys, initial batch logging and SMS confirmation bridging rely on ZiwaClear's relayer key. While cryptographic checks prevent the relayer from verifying its own batches, the relayer is an operational trust point for SMS intake.
2. **SMS Confirmation vs Cryptographic Signatures:** The harvester's settlement confirmation ("YES 4821") is routed through standard telecom operators. While permanently hash-anchored on Base Sepolia, it represents a telecom-attested co-sign rather than a direct asymmetric ECDSA digital signature.
3. **Single Verifier Trust Point:** In the current prototype, a single verifier with `VERIFIER_ROLE` can approve or reject a batch. Multi-verifier approval (2-of-N) is scheduled on the roadmap.
4. **Permanent Mass Balance:** If an erroneous weight is recorded and accepted by the buyer, it cannot be edited on-chain. The batch must be cancelled and re-logged.
5. **Simulated Role Wallets & Buyer Clarification:** While verifiers, buyers (the accepting and paying party), and processors sign with dedicated private keys, prototype testing uses development signers. In the field, no commercial buyer was validated (local biogas demonstration sites source their own feedstock); the "buyer" role in practice represents any accepting and paying party, such as a county public works programme, environmental donor fund, or commercial off-taker.
6. **Work Credits are Not Carbon Credits:** Work credits represent kilograms of verified biomass diverted to beneficial circular end use. They do not constitute certified carbon credits.
7. **Testnet Deployment:** The current protocol prototype targets the Base Sepolia testnet.
8. **Hash Proves Integrity, Not Truth:** A valid certificate hash confirms that a file matches the recorded hash. It does not confirm that the underlying claims in the certificate are accurate. Accuracy at entry depends on the field verifier, the buyer's independent acceptance, and the harvester's own SMS confirmation.
9. **Illustrative Demo Data:** The seeded batches in `demo/demo-data.json` are synthetic data generated by a local seed script. They are not records of real harvests.
10. **Duplicate Evidence Flagging Detects Exact Hashes Only:** The on-chain `evidenceFirstBatch` mapping and `EvidenceReused` event detect exact cryptographic hash reuse across batches. It cannot detect similar photos, re-compressed photos, or alternate camera angles of the same physical biomass.
11. **Provisional Field Findings:** Field observations are provisional and derived from informal fieldwork around Dunga, Homa Bay, and Kendu Bay on Lake Victoria (Oct 18 to 19, 2026, across a small number of conversations). They reflect local conditions at those specific sites and must not be generalized lake-wide.
12. **Pilot Status of Downstream Chain-of-Custody:** Chain-of-custody stages beyond verification (buyer acceptance, processing, and end use) are a pilot design with illustrative demo data, pending commercial offtake establishment.
13. **Activity vs Outcome Evidence:** Activity evidence records what was removed, when, weighed, and independently attested. Outcome evidence would show cleared water attributable to that activity. ZiwaChain addresses the former: a claim with no verified harvest records has nothing to pay against. It cannot show that the weed would not have receded naturally, and it cannot show that submitted photos or weights are true.
