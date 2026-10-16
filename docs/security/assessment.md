# ZiwaChain: Security and Data-Integrity Assessment

This document presents a comprehensive security, cryptographic, and data-integrity evaluation of **ZiwaChain**. It details the threat model, smart contract access controls, privacy mechanisms, mass-balance guarantees, trust assumptions, and empirical test coverage.

---

## 1. Threat Model & Actor Taxonomy

| Actor / Entity | Authentication / Key Management | Capabilities | Potential Malicious Behavior | Mitigating Controls |
|---|---|---|---|---|
| **Harvester** | SMS/USSD mobile number; no private keys | Submits harvest logs and settlement confirmation via telecom gateway | Report inflated harvest weight; deny receipt of payment | Physical verifier weighing; SMS confirmation code ("YES 4821") logged on-chain; buyer acceptance required |
| **Relayer (ZiwaClear)** | EVM private key (`RELAYER_ROLE`) | Submits `logHarvest` and `confirmSettlement`; holds custodian credit tokens | Fabricate phantom harvest batches; front-run settlement confirmations | Cannot self-verify (`VerifierCannotBeRelayer`); credits non-transferable; all batches require independent buyer acceptance |
| **Field Verifier** | EVM private key (`VERIFIER_ROLE`) | Approves or rejects harvests (`verifyBatch`) | Collude with harvesters to approve nonexistent biomass | Cannot be a relayer; verifier address logged in event; buyer conducts secondary physical intake check before acceptance |
| **Commercial Buyer** | EVM private key (`BUYER_ROLE`) | Accepts batch and records payment hash (`acceptBatch`) | Under-report accepted weight; submit bogus payment hashes | Mass balance limits acceptance to `<= harvestedKg`; harvester SMS confirmation provides cross-check; dispute evidence stored |
| **Processor** | EVM private key (`PROCESSOR_ROLE`) | Records biomass processing and end-use (`recordProcessing`, `recordEndUse`) | Mint excess work credits; inflate processing efficiency | Single processor per batch; mass balance limits cumulative end-use to `<= processedKg <= acceptedKg` |
| **External Observer / Adversary** | Public internet / JSON-RPC | Reads blockchain state and event logs | Trace harvester harvest volumes or identify lakeside communities | Per-batch HMAC pseudonyms; off-chain GPS coordinates and PII; salted payload hashes |

---

## 2. Smart Contract Security Controls

### 2.1 Role-Based Access Control (RBAC)
ZiwaChain utilizes OpenZeppelin Contracts v5 `AccessControl` to enforce strict operational permissions.
- Each function is protected with the `onlyRole` modifier:
  - `logHarvest`: `RELAYER_ROLE`
  - `verifyBatch`: `VERIFIER_ROLE`
  - `acceptBatch`: `BUYER_ROLE`
  - `confirmSettlement`: `RELAYER_ROLE`
  - `recordProcessing`: `PROCESSOR_ROLE`
  - `recordEndUse`: `PROCESSOR_ROLE` (plus `msg.sender == b.processor` check)
- `DEFAULT_ADMIN_ROLE` can grant and revoke roles. In production, administrative control can be transferred to a community multisig (e.g., Safe) without code modification.

### 2.2 Separation of Duties (`VerifierCannotBeRelayer`)
A primary failure mode in provenance systems is the submitter verifying their own submission. 
- In `verifyBatch`:
  ```solidity
  if (hasRole(RELAYER_ROLE, msg.sender)) revert VerifierCannotBeRelayer();
  ```
- This guarantees that the relayer service cannot approve batches it logged, eliminating automated self-dealing.

### 2.3 Strict Stage Monotonicity
The batch lifecycle follows a linear finite-state machine:
$$\text{None} \to \text{Harvested} \to \text{Verified} \to \text{Accepted} \to \text{Processed} \to \text{EndUse}$$
- Functions query `_requireStage(batchId, expectedStage)` before executing state changes.
- Stage `Rejected` is terminal: `verifyBatch(batchId, false, ...)` transitions the batch to `Rejected`, where no subsequent transition functions can ever execute.
- Re-entrancy or circular lifecycle transitions are mathematically impossible.

### 2.4 Mass-Balance Invariant Preservation
To prevent volume inflation, ghost biomass, and synthetic credit generation, the contract enforces three consecutive mass-balance checks:
1. **Commercial Acceptance:**
   $$\text{acceptedKg} \le \text{harvestedKg} \quad (\text{reverts with } \texttt{MassBalanceViolation})$$
2. **Processing Intake:**
   $$\text{processedKg} \le \text{acceptedKg} \quad (\text{reverts with } \texttt{MassBalanceViolation})$$
3. **End-Use Conversion & Credit Issuance:**
   $$\sum \text{endUseKg} \le \text{processedKg} \quad (\text{reverts with } \texttt{MassBalanceViolation})$$

Zero-value inputs (`quantityKg == 0`, `acceptedKg == 0`, `inputKg == 0`, `endUseKg == 0`) are explicitly rejected with `InvalidQuantity()`.

### 2.5 Non-Transferability of Work Credits
Work credits (ERC-1155 token ID 1) represent physical biomass circularity outcomes, not tradable financial instruments. Secondary market trading would introduce speculation and wash trading.
- Non-transferability is enforced at the base token level by overriding the OpenZeppelin internal `_update` hook:
  ```solidity
  function _update(
      address from,
      address to,
      uint256[] memory ids,
      uint256[] memory values
  ) internal override {
      if (from != address(0)) revert NonTransferable();
      super._update(from, to, ids, values);
  }
  ```
- Any attempt to call `safeTransferFrom` or `safeBatchTransferFrom` reverts immediately with `NonTransferable()`. Only minting (`from == address(0)`) is permitted. Burning is also blocked.

### 2.6 Tamper-Evident Hash Correction Architecture
Field operations are prone to clerical errors (e.g., miskeyed photo references or corrupt metadata payloads). Rather than allowing arbitrary in-place data mutation, `correctRecord` implements an append-only audit trail:
- **Authorship Enforced:** Only the address that originally recorded the hash for that batch can supersede it (`_hashAuthor[batchId][hash] == msg.sender`).
- **Single Supersession:** A hash can only be superseded once (`HashAlreadySuperseded`).
- **Anti-Reuse Rule:** A replacement hash cannot already exist for that batch (`CannotReuseHash`), preventing circular substitution attacks ($A \to B \to A$).
- **Quantity Protection:** Quantities **cannot** be modified via `correctRecord`. A mass discrepancy requires rejecting and re-logging the batch.

---

## 3. Data Integrity & Privacy Controls

### 3.1 Harvester Privacy via HMAC Derivation
Informal harvesters in Kenya are vulnerable to predatory pricing or surveillance if their cumulative harvest histories or landing locations are publicly linkable.
- Hashing phone numbers directly with SHA-256 or Keccak-256 is vulnerable to brute-force precomputation due to low search space (~$10^9$ possible phone numbers).
- ZiwaChain derives a unique per-batch pseudonym:
  $$\text{harvesterId} = \text{HMAC-SHA256}(\text{ServerSecret}, \text{groupId} \parallel \text{batchId})$$
- Even if a harvester submits 50 batches across three seasons, each batch carries an uncorrelated `harvesterId` on the public blockchain.
- Only the harvester presenting their signed certificates can selectively reveal and prove their cumulative history to lenders.

### 3.2 Canonical JSON (RFC 8785) & Salting
A core vulnerability in decentralized verification is serialization divergence between off-chain backend environments and in-browser JavaScript engines.
- ZiwaChain enforces deterministic canonical JSON serialization following RFC 8785 (keys sorted by UTF-16 code units, zero whitespace, normalized numbers).
- Each record incorporates a 32-byte cryptographic salt:
  $$\text{payloadHash} = \text{keccak256}(\text{CanonicalJSON(payload)} \parallel \text{salt})$$
- The salt guarantees pre-image resistance and prevents dictionary attacks against low-entropy fields (such as standard biomass types or dates).

### 3.3 Two-Sided Settlement Attestation
Disputes in biomass trading typically center on whether payment was actually made or received:
- Downstream buyers sign `acceptBatch` with their wallet, recording `paymentRefHash` (hash of the M-Pesa receipt).
- The harvester confirms receipt via two-way SMS by texting "YES [4-digit code]".
- The relayer records `confirmationHash = keccak256("YES 4821" || salt)` via `confirmSettlement`.
- Both parties' attestations are permanently anchored to the batch on-chain.

### 3.4 Portable Certificate Privacy and Integrity
The Harvester Certificate (`src/certificate/build.ts`) packages the off-chain verification material into a portable JSON structure:
- **Serverless Client Verification:** The certificate data is encoded into the URL fragment (`#c=<base64url>`). According to HTTP standards (RFC 3986), URL fragments are processed purely by the browser and are never transmitted in HTTP requests, preventing certificate payload logging on web servers.
- **Transcription Error Resilience:** The human-readable short code utilizes Crockford Base32 (`src/certificate/shortCode.ts`), explicitly excluding the letters `I`, `L`, `O`, and `U` to prevent visual and phonetic confusion when read over low-quality voice calls or SMS.
- **Zero PII Leakage:** The certificate contains only stage event types, integer metrics, salts, transaction hashes, and the plain M-Pesa receipt reference, completely omitting personal names, phone numbers, and physical coordinates.

---

## 4. Trust Assumptions and Honest Limitations

1. **Relayer Key Custody:** Because harvesters do not manage private keys, initial batch logging and SMS confirmation bridging rely on ZiwaClear's relayer key. Compromise of the relayer key would permit logging fraudulent batches (though verification and commercial acceptance would still require distinct verifier and buyer private keys).
2. **Single Verifier Trust Point:** The prototype enforces a single verifier per batch. While verifiers cannot be relayers, a dishonest verifier could collude with a harvester to approve sub-standard biomass. A multi-signature threshold model (2-of-N verifiers) is planned for production.
3. **Off-Chain Fiat Settlement:** M-Pesa payments occur outside the EVM. While the payment hash is recorded on-chain, the contract cannot verify the solvency of the fiat bank account without an oracle.
4. **Permanent Mass Balance:** If an erroneous weight is recorded and accepted by the buyer, it cannot be edited on-chain. The batch must be rejected or cancelled.

---

## 5. Automated Security Test Coverage

The security guarantees, invariant checks, cryptographic canonicalization, privacy derivations, and certificate structures are validated by 66 automated tests across `test/ZiwaChain.ts`, `test/hashing.test.ts`, and `test/certificate.test.ts`.

```bash
  ZiwaChain
    logHarvest
      ✔ lets the relayer log a harvest and sets the correct fields
      ✔ refuses anyone who does not hold RELAYER_ROLE
      ✔ refuses a harvest of zero kg
      ✔ refuses a batchId that already exists
    verifyBatch
      ✔ lets a verifier approve a harvest and advances to Verified
      ✔ lets a verifier reject a harvest and makes Rejected terminal
      ✔ stops a relayer from also acting as verifier (VerifierCannotBeRelayer)
      ✔ refuses a batch that does not exist
    acceptBatch
      ✔ lets a buyer accept a verified batch and records buyer + acceptedKg
      ✔ refuses anyone without BUYER_ROLE
      ✔ refuses acceptance when the batch is not at stage Verified
      ✔ refuses acceptedKg that exceeds harvestedKg (mass balance)
      ✔ refuses an acceptedKg of zero
    confirmSettlement
      ✔ lets the relayer confirm settlement after acceptance and marks batch settled
      ✔ lets the relayer confirm settlement after processing (stage need not be Accepted)
      ✔ lets the relayer confirm settlement even after end use
      ✔ refuses a second confirmSettlement on the same batch (AlreadySettled)
      ✔ refuses confirmation when the batch is at stage Harvested (WrongStage)
    recordProcessing
      ✔ lets a processor record processing and stores processor + processedKg
      ✔ refuses anyone without PROCESSOR_ROLE
      ✔ refuses inputKg that exceeds acceptedKg (mass balance)
      ✔ refuses processing when batch is not at stage Accepted
    recordEndUse
      ✔ lets the processor record end use and advances stage to EndUse
      ✔ accumulates endUseKgTotal across multiple partial calls
      ✔ mints one WORK_CREDIT per kg to the custodian and emits CreditsIssued
      ✔ tracks credits per harvesterId via workCreditsOf
      ✔ accumulates workCreditsOf across multiple end-use calls for the same harvesterId
      ✔ refuses recordEndUse from a different PROCESSOR_ROLE address (NotBatchProcessor)
      ✔ refuses endUseKg that would push endUseKgTotal above processedKg (mass balance)
      ✔ refuses cumulative end-use that exceeds processedKg
      ✔ refuses end use at the wrong stage (Accepted, not Processed)
    correctRecord
      ✔ lets the original hash author correct a hash and records the supersession
      ✔ refuses a hash that was never recorded for this batch (HashNotFound)
      ✔ refuses correction by an address that is not the original author (NotHashAuthor)
      ✔ refuses correcting a hash that has already been superseded (HashAlreadySuperseded)
      ✔ refuses reusing an already-registered hash as the replacement (CannotReuseHash)
    work credit non-transferability
      ✔ blocks safeTransferFrom for work credits
      ✔ blocks safeBatchTransferFrom for work credits
    view helpers
      ✔ getBatch reverts with UnknownBatch for an unrecognised batchId
      ✔ supersededBy returns the replacement hash after a correction
      ✔ supersededBy returns bytes32(0) for an un-superseded hash
      ✔ workCreditsOf returns 0 for a harvesterId that has no credits yet

  Certificate Module
    shortCode (Crockford Base32)
      ✔ is deterministic and always 11 characters including the hyphen
      ✔ changes the short code when the payload hash changes
      ✔ requires a valid payload hash
    buildCertificate & Base64URL round-trip
      ✔ builds a version 1 certificate matching specification
      ✔ successfully round-trips via Base64URL encoding and decoding
    certificateQr
      ✔ returns a valid PNG Data URL for a certificate

  Hashing Module
    RFC 8785 Canonical JSON
      ✔ ensures object key order does not change output
      ✔ handles deeply nested objects with mixed key order
      ✔ rejects non-integer floating-point numbers
      ✔ rejects NaN
      ✔ rejects Infinity and -Infinity
      ✔ rejects undefined values
      ✔ rejects functions and symbols
    Salt Generation
      ✔ generates a 0x-prefixed 16-byte (34-character) hex string
      ✔ generates distinct salts on subsequent calls
    Record & Confirmation Hashing
      ✔ computes deterministic 66-character 0x-prefixed keccak256 hashes
      ✔ changes hash when salt changes
      ✔ detects tampering when any payload field changes (e.g. quantityKg)
      ✔ detects tampering when metadata changes (e.g. harvestedAt timestamp)
      ✔ hashes settlement confirmation codes deterministically
    Pseudonym Derivation (HMAC-SHA256)
      ✔ is deterministic for identical inputs
      ✔ produces unlinkable pseudonyms for different batches of the same harvester group
      ✔ produces different pseudonyms for different secrets
      ✔ requires secret, groupId, and batchId

  66 passing (2s)
```
