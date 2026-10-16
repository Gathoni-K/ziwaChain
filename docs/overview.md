# ZiwaChain: Problem & Solution Overview

**Track:** Sustainable Supply Chains & Circular Economy  
**Focus:** Invasive Aquatic Biomass Traceability & Harvester Provenance on Lake Victoria  

---

## 1. Executive Summary

Lake Victoria, Africa's largest freshwater lake, is choked by massive recurring mats of invasive water hyacinth (*Pontederia crassipes*). The weed forms dense blankets across fishing bays, suffocates aquatic biodiversity, impedes municipal water intake, blocks transport routes, and undergoes rapid anaerobic decay that generates substantial methane ($CH_4$) emissions. 

Informal harvesting communities manually clear thousands of metric tons of weed each season. However, because they operate entirely in the cash and informal economy, these harvesters remain economically invisible. They lack verifiable records of delivered weights or earnings, leaving them exposed to frequent payment disputes, predatory pricing, and systemic exclusion from formal credit facilities such as agricultural savings and credit cooperatives (SACCOs). Meanwhile, downstream clean-energy processors converting biomass into biogas, biochar, and organic fertilizer cannot reliably prove sustainable provenance or circular outcomes to corporate buyers and carbon registries.

**ZiwaChain** solves this by establishing a decentralized, verified chain of custody that bridges low-connectivity SMS harvesters to an immutable provenance protocol deployed on Base Sepolia. By enforcing strict mass-balance validation, independent role-based verification, and two-sided settlement co-signing, ZiwaChain produces portable, tamper-evident digital certificates for informal workers and issues non-transferable work credits for verified circular diversion.

---

## 2. The Problem: The Triple Breakdown on Lake Victoria

### A. Ecological & Climate Hazard
Water hyacinth is one of the world's fastest-multiplying freshwater weeds, with biomass doubling in as little as 5 to 15 days under nutrient-rich conditions. When unmanaged, millions of tons of biomass die, sink to the lakebed, and decay anaerobically. This produces severe localized deoxygenation (killing fish nurseries) and releases substantial quantities of biogenic methane—a greenhouse gas with over 28 times the 100-year global warming potential of carbon dioxide ($CO_2$).

### B. Harvester Precarity & Credit Invisibility
The manual removal of hyacinth is physically hazardous, exposing workers to waterborne parasites, snakebites, and equipment hazards. Despite performing critical ecological restoration, harvesters face severe structural handicaps:
- **No Portable Record:** Harvesters operate with basic 2G/3G mobile phones. Deliveries are tracked on paper logs or informal spreadsheets held exclusively by middle-tier aggregators.
- **Payment Disputes:** Weight deductions for moisture or impurities are frequently applied arbitrarily by buyers, with no verifiable baseline for dispute resolution.
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
   Harvesters report harvest tallies through standard SMS/USSD messages. ZiwaClear’s relayer logs the harvest on Base Sepolia, anchoring a salted payload hash and a pseudonymous identifier without requiring harvesters to hold wallets or pay gas.
2. **Separation of Duties & Physical Verification:**
   Biomass cannot advance to commercial sale without physical sampling by an authorized field verifier. The contract explicitly enforces separation of duties: relayers who log harvests are cryptographically prohibited from verifying them (`VerifierCannotBeRelayer`).
3. **Strict On-Chain Mass Balance:**
   The smart contract natively enforces conservation of mass:
   $$\text{acceptedKg} \le \text{harvestedKg} \quad \text{and} \quad \text{processedKg} \le \text{acceptedKg} \quad \text{and} \quad \sum \text{endUseKg} \le \text{processedKg}$$
   This guarantees that volume cannot be synthetically inflated at any intermediate stage.
4. **Two-Sided Settlement Attestation:**
   Commercial buyers sign acceptance using their EVM wallet, committing the hash of the off-chain M-Pesa transaction reference. The harvester confirms payment receipt via a two-way SMS code ("YES 4821"), permanently locking the settlement attestation on-chain.
5. **Portable Harvester Proof:**
   Upon settlement, the harvester receives a portable certificate containing canonical payload metadata, random salts, and on-chain event references. This certificate can be verified by any third party (such as a SACCO loan officer) using a static, browser-based verification interface that directly queries the blockchain without intermediate database dependencies.
6. **Incentivizing Circular Outcomes (Work Credits):**
   Biomass diverted into verified circular processing mints non-transferable ERC-1155 `WORK_CREDIT` tokens (1 credit per kilogram reaching final end use). These tokens reward proven circularity without introducing secondary market speculation.

---

## 4. Current Prototype vs Roadmap

| Dimension | Built Prototype (Oct 2026) | Planned Roadmap |
|---|---|---|
| **Smart Contract** | Full lifecycle contract (`ZiwaChain.sol`) deployed and tested on Base Sepolia with 42 passing unit tests | Mainnet deployment on Base L2 |
| **Verification** | Single independent verifier role with relayer exclusion | 2-of-N multi-signature verifier consensus |
| **Harvester Privacy** | Per-batch HMAC-SHA256 pseudonyms preventing public linkability | Zero-knowledge proof bundles for aggregate income disclosure |
| **Settlement** | M-Pesa hash anchoring + SMS two-way co-signing | Automated webhook reconciliation via Safaricom Daraja API |
| **Credits** | Non-transferable ERC-1155 tokens tracking verified end-use mass | Redemption marketplace for subsidized tools and inputs |
| **Lender Tools** | Standalone certificate verification via public web tool | Batch Merkle statements for bulk SACCO underwriting |
