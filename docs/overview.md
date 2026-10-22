# ZiwaChain: Problem & Solution Overview

**Track:** Sustainable Supply Chains & Circular Economy  
**Focus:** Invasive Aquatic Biomass Traceability & Harvester Provenance on Lake Victoria  
**Target Deployment:** Base Sepolia (Solidity 0.8.28, EVM Cancun)  

---

## 1. Executive Summary

Lake Victoria, Africa's largest freshwater lake, is choked by massive recurring mats of invasive water hyacinth (*Pontederia crassipes*). The weed blankets fishing bays, suffocates aquatic biodiversity, impedes municipal water intakes, halts maritime transport, and undergoes rapid anaerobic decay that generates substantial methane ($CH_4$) emissions.

Informal harvesting communities manually clear thousands of metric tons of weed each season. However, because they operate entirely within an informal cash economy, these harvesters remain economically invisible. They lack verifiable records of delivered weights or earnings, leaving them exposed to frequent payment disputes, predatory pricing, and systemic exclusion from formal credit facilities such as agricultural savings and credit cooperatives (SACCOs). Meanwhile, downstream clean-energy processors converting biomass into biogas, biochar, and organic fertilizer cannot reliably prove sustainable provenance or circular outcomes to corporate buyers and carbon registries.

**ZiwaChain** lets harvesters, buyers, verifiers and lenders rely on the same delivery record without having to trust a single operator. It establishes a verified chain of custody for invasive water hyacinth biomass from Lake Victoria, operating as a provenance and verification layer in the spirit of digital measurement, reporting and verification (dMRV) practice for biomass removal. By enforcing strict mass-balance validation, independent role-based verification, and two-sided settlement co-signing, ZiwaChain produces portable, tamper-evident digital certificates for informal workers and issues non-transferable work credits for verified circular diversion. ZiwaChain does not claim compliance with any specific dMRV standard.

---

## 2. The Problem: The Triple Breakdown on Lake Victoria

### A. Ecological & Climate Hazard
Water hyacinth is one of the world's most aggressive freshwater weeds, with standing biomass doubling every 6 to 18 days under warm, nutrient-rich tropical conditions. When unmanaged, millions of tons of biomass die, sink to the lakebed, and decay anaerobically. This produces severe localized deoxygenation (destroying fish breeding nurseries) and releases substantial quantities of biogenic methane, a short-lived greenhouse gas with over 28 times the 100-year global warming potential of carbon dioxide ($CO_2$).

### B. Harvester Precarity & Credit Invisibility
The manual removal of hyacinth is physically hazardous, exposing workers to bilharzia parasites, snakebites, and deep-water hazards. Despite performing critical ecological restoration, harvesters face severe structural handicaps:
- **No Portable Record:** Harvesters operate with basic 2G/3G mobile phones. Deliveries are tracked on paper logs or informal notebooks held exclusively by middlemen.
- **Payment Disputes:** Arbitrary weight deductions for moisture or impurities are frequently imposed by buyers with zero verifiable baseline for dispute resolution.
- **Underwriting Deficit:** Community lenders (SACCOs) require documented cash flow or supply consistency to underwrite microloans. Harvesters cannot prove their historical production, trapping them in cycle-to-cycle liquidity distress.

### C. Downstream Traceability Deficit
Clean-tech ventures and circular bioeconomy processors (e.g., biogas digesters, organic soil conditioner manufacturers, clean cooking fuel briquette producers) are scaling rapidly in East Africa. However, off-takers and ESG funders demand verifiable chain-of-custody data:
- How much biomass was actually collected?
- Was it harvested from genuine invasive infestation sites?
- Did the economic value flow transparently to the frontline harvesters?

---

## 3. The Solution: Harvester-First Circular Chain of Custody

ZiwaChain does not impose complex crypto-native friction on informal workers. Instead, it leverages an asymmetric architecture where informal workers interact via familiar SMS rails while commercial actors and the protocol maintain on-chain cryptographic integrity:

```
[Harvester (SMS)] ──► [ZiwaClear Relayer] ──► [ZiwaChain.sol (Base Sepolia)]
                                                    ▲
[Field Verifier (Wallet)] ──────────────────────────┤
[Commercial Buyer (Wallet + M-Pesa)] ───────────────┤
[Bio-Processor (Wallet)] ───────────────────────────┘
```

### Key Pillars of the ZiwaChain Protocol

1. **Inclusive Onboarding via Relayed Telemetry:**
   Harvesters report harvest tallies through standard SMS/USSD messages. ZiwaClear's relayer logs the harvest on Base Sepolia, anchoring a salted payload hash and an un-linkable HMAC pseudonym without requiring harvesters to hold wallets or pay gas fees. In the current prototype the SMS gateway is simulated; production integration with a telecom operator (such as Africa's Talking) is a planned next step.
2. **Separation of Duties and Field Attestation:**
   Biomass cannot advance to commercial sale without an attestation from an authorized field verifier. The contract explicitly enforces separation of duties: relayers who log harvests are cryptographically prohibited from verifying them (`VerifierCannotBeRelayer`). The field inspection, weighbridge check, and intake sampling described here represent the intended real-world process; in the prototype these steps are carried out by demo accounts running locally, not by physical inspectors.
3. **Strict On-Chain Mass Balance:**
   The smart contract natively enforces conservation of mass:
   $$\text{acceptedKg} \le \text{harvestedKg} \quad \text{and} \quad \text{processedKg} \le \text{acceptedKg} \quad \text{and} \quad \sum \text{endUseKg} \le \text{processedKg}$$
   This guarantees that volume cannot be synthetically inflated at any intermediate stage.
4. **Two-Sided Settlement Attestation:**
   Commercial buyers sign acceptance using their EVM wallet, committing the hash of the off-chain M-Pesa transaction reference. The harvester confirms payment receipt via a two-way SMS code ("YES 4821"), permanently locking the settlement attestation on-chain. In the prototype, the buyer is a demo development account and the M-Pesa reference is illustrative demo data.
5. **Portable Harvester Proof (Certificates & Short Codes):**
   Upon settlement, the harvester receives a portable certificate containing canonical payload metadata, random salts, and on-chain event references (`src/certificate/build.ts`). Harvesters receive a 10-character Crockford Base32 short code (e.g. `TR8NZ-A9VC5`) via SMS or a printable QR code. This certificate can be verified by any third party (such as a SACCO loan officer) using a static, browser-based verification interface that directly queries the blockchain without intermediate database dependencies.
6. **Incentivizing Circular Outcomes (Work Credits):**
   Biomass diverted into verified circular processing mints non-transferable ERC-1155 `WORK_CREDIT` tokens (1 credit per kilogram reaching final end use). These tokens reward proven circularity without introducing secondary market speculation.

---

## 4. Current Prototype vs Roadmap

| Dimension | Built Prototype (Current Milestone, Oct 2026) | Planned Production Roadmap |
|---|---|---|
| **Smart Contract** | Full lifecycle contract (`ZiwaChain.sol`) deployed and tested on Base Sepolia with 48 contract unit tests; off-chain hashing module (`src/hashing/`), harvester certificate pipeline (`src/certificate/`), public in-browser verify page (`web/`), simulated SMS engine (`src/sms/`), and 99 total passing tests. Demo batches are illustrative data generated by a local seed script, not real harvests. | Mainnet deployment on Base L2 |
| **Verification** | Single independent verifier role with relayer exclusion | 2-of-N multi-signature verifier consensus |
| **Harvester Privacy** | Per-batch HMAC-SHA256 pseudonyms preventing public linkability | Zero-knowledge proof bundles for aggregate income disclosure |
| **Settlement** | M-Pesa hash anchoring + SMS two-way co-signing | Automated webhook reconciliation via Safaricom Daraja API |
| **Credits** | Non-transferable ERC-1155 tokens tracking verified end-use mass | Redemption marketplace for subsidized tools and inputs |
| **Lender Tools** | Standalone certificate verification via public web tool | Batch Merkle statements for bulk SACCO underwriting |
| **Telecom Integration** | Simulated SMS gateway (`src/sms/SimulatedGateway`) and end-to-end conversation runner (`npm run demo:sms`). The prototype prints chat to stdout; no real SMS messages are sent. | Production adapter for Africa's Talking and Safaricom USSD gateway |

---

## 5. Honest Limitations

1. **Relayer Key Custody:** Because harvesters do not manage private keys, initial batch logging and SMS confirmation bridging rely on ZiwaClear's relayer key. While cryptographic checks prevent the relayer from verifying its own batches, the relayer is an operational trust point for SMS intake.
2. **SMS Confirmation vs Cryptographic Signatures:** The harvester's settlement confirmation ("YES 4821") is routed through standard telecom operators. While permanently hash-anchored on Base Sepolia, it represents a telecom-attested co-sign rather than a direct asymmetric ECDSA digital signature.
3. **Single Verifier Trust Point:** In the current prototype, a single verifier with `VERIFIER_ROLE` can approve or reject a batch. Multi-verifier approval (2-of-N) is scheduled on the roadmap.
4. **Permanent Mass Balance:** If an erroneous weight is recorded and accepted by the buyer, it cannot be edited on-chain. The batch must be cancelled and re-logged.
5. **Work Credits are Not Carbon Credits:** Work credits represent kilograms of verified biomass diverted to beneficial circular end use. They do not constitute certified carbon credits.
6. **Hash Proves Integrity, Not Truth:** A valid certificate hash confirms that a file matches the recorded hash. It does not confirm that the underlying claims in the certificate are accurate. Accuracy at entry depends on the field verifier, the buyer's independent acceptance, and the harvester's own SMS confirmation.
7. **Illustrative Demo Data:** The seeded batches in `demo/demo-data.json` are synthetic data generated by a local seed script. They are not records of real harvests.

