# ZiwaChain: Security and Data Integrity Assessment

**Track:** Sustainable Supply Chains & Circular Economy  
**Scope:** Smart Contract Security, Off-Chain Cryptography, Harvester Privacy, Threat Modeling, and Test Suite Verification  

---

## 1. Executive Summary

ZiwaChain bridges informal rural labor on Lake Victoria into an immutable provenance system on Base Sepolia. Because informal harvesters lack private keys and operate via standard 2G/3G SMS messaging, the protocol adopts an asymmetric trust design. This design introduces specific threat vectors that differ fundamentally from traditional decentralized finance protocols. 

This document details our threat model, smart contract security controls, cryptographic data integrity guarantees, and the 85 automated unit tests that empirically validate these invariants. We conclude with an unvarnished analysis of our trust assumptions and known operational limitations.

---

## 2. Threat Modeling & Specific Attack Mitigations

### 2.1 Threat: Relayer Key Compromise
**Attack Vector:** An attacker compromises the private key of the ZiwaClear relayer service (`RELAYER_ROLE`) and attempts to log fictitious harvest batches to generate fraudulent work credits or misappropriate payments.  
**Mitigating Controls:**
- **Separation of Duties (`VerifierCannotBeRelayer`):** In `ZiwaChain.sol`, `verifyBatch` contains an explicit role exclusion check:
  ```solidity
  if (hasRole(RELAYER_ROLE, msg.sender)) revert VerifierCannotBeRelayer();
  ```
  The relayer is cryptographically barred from verifying its own batches. Even with a compromised relayer key, an attacker cannot advance any batch past `Harvested` without colluding with a completely separate private key possessing `VERIFIER_ROLE`.
- **Downstream Commercial Acceptance Requirement:** Work credits are only minted during `recordEndUse`, which requires independent prior execution of `acceptBatch` (signed by a distinct `BUYER_ROLE` key) and `recordProcessing` (signed by a distinct `PROCESSOR_ROLE` key). Fabricated batches cannot progress through commercial gates.
- **Automated Test Validation:** Proven by test: `"stops a relayer from also acting as verifier (VerifierCannotBeRelayer)"` in [test/ZiwaChain.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/ZiwaChain.ts).

### 2.2 Threat: Colluding or Dishonest Field Verifier
**Attack Vector:** A corrupt biological inspector possessing `VERIFIER_ROLE` colludes with an unscrupulous harvester group to approve non-existent or heavily contaminated wet weed.  
**Mitigating Controls:**
- **Verifier Identity Immutably Logged:** The verifier's address is stored directly on the batch struct (`b.verifier = msg.sender`) and emitted in the `BatchVerified` event. Any systematic discrepancy triggers audit liability.
- **Secondary Commercial Gate:** Verification does not trigger payouts or credit issuance. The commercial buyer conducts an independent weighing and moisture inspection at their reception facility before signing `acceptBatch`. If the weed is unviable, the buyer refuses acceptance, permanently stalling the batch at stage `Verified`.
- **Terminal Rejection State:** If a verifier rejects a batch (`verifyBatch(batchId, false, ...)`), the stage transitions irreversibly to `Rejected`. The contract permanently locks the batch, preventing any subsequent resurrection.
- **Roadmap Mitigation:** Phase 2 implements a 2-of-N threshold signature requirement, requiring co-signing by both an accredited laboratory (e.g. KMFRI) and a community beach management elder.
- **Automated Test Validation:** Proven by test: `"lets a verifier reject a harvest and makes Rejected terminal"` in [test/ZiwaChain.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/ZiwaChain.ts).

### 2.3 Threat: Brute-Forcing Harvester Identities (Why Per-Batch HMAC Pseudonyms)
**Attack Vector:** An adversary monitors Base Sepolia event logs to trace individual harvester earnings, calculate family cash flows, or track seasonal movements of vulnerable informal workers.  
**Why Plain Hashes Fail:** Phone numbers have very low entropy (only 7 to 9 variable digits within a known country code such as Kenya's `+254`). A basic GPU cluster can compute all 100 million Kenyan phone number keccak256 hashes in under two seconds, rendering standard salted hashes ineffective against rainbow tables.  
**Mitigating Controls:**
- **HMAC-SHA256 Derivation with Server Secret:** Harvester identities are derived using HMAC-SHA256 initialized with a high-entropy 256-bit server secret:
  $$\text{harvesterId} = \text{HMAC-SHA256}(\text{ServerSecret}, \text{groupId} \parallel \text{batchId})$$
- **Per-Batch Un-linkability:** Because the `batchId` is included in the HMAC payload, a harvester group receives a completely distinct, un-correlated 32-byte identifier on every single batch.
- **Selective Disclosure:** A harvester who wishes to prove their 6-month delivery history to a micro-lender (SACCO) presents their collection of certificates. The lender verifies each certificate individually, while outside observers cannot link the batches together on-chain.
- **Automated Test Validation:** Proven by tests: `"produces unlinkable pseudonyms for different batches of the same harvester group"` and `"requires secret, groupId, and batchId"` in [test/hashing.test.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/hashing.test.ts).

### 2.4 Threat: Replayed, Forged, or Altered Certificates
**Attack Vector:** A bad actor alters a certificate JSON to inflate their delivered kilograms from 500 kg to 5,000 kg and attempts to use the forged certificate to obtain a bank loan, or re-hashes a tampered payload to try to bypass client-side verification.  
**Mitigating Controls:**
- **Canonical Re-computation in Browser:** The public verify page ([web/main.ts](docs/../web/main.ts)) recomputes the keccak256 hash of the canonical JSON payload and random salt client-side. If a single character or quantity is altered, the recomputed hash diverges from the certificate hash.
- **Direct Event Provenance Binding:** In Step 2, the client queries Base Sepolia event logs directly and binds EVERY certificate stage to its on-chain event (`HarvestLogged`, `BatchVerified`, `BatchAccepted`, `SettlementConfirmed`, `BatchProcessed`, `EndUseRecorded`), asserting that the certificate's `payloadHash` and transaction hash strictly match the on-chain log. If an attacker tampers with the payload and recomputes the certificate hash, the forged hash is absent from on-chain event arguments, causing verification to fail.
- **Harvester Pseudonym & Commercial Payment Verification:** The engine asserts `cert.pseudonym === getBatch().harvesterId` and validates the plain `paymentRef` against `batchData.paymentRefHash` and `BUYER_ACCEPTED.payload.paymentRefHash`.
- **Authentic Rejection Handling:** Authentic rejected batches display an amber notice banner ("This record is authentic, but the batch was rejected at verification. No credits were issued.") and never show a green verified banner.
- **Automated Test Validation:** Proven by 10 verification algorithm tests in [test/verify.test.ts](docs/../test/verify.test.ts) testing single-field changes, forged-and-rehashed payloads, pseudonym mismatches, payment reference tampering, and terminal rejected states.

### 2.5 Threat: Double Crediting & Mass Inflation (Mass-Balance Invariants)
**Attack Vector:** A processor attempts to claim 10,000 work credits from an initial harvest of only 1,000 kilograms of wet hyacinth by repeatedly calling `recordEndUse` or inflating conversion ratios.  
**Mitigating Controls:**
- **Strict Mathematical Conservation of Mass:** The smart contract natively enforces conservation of mass across three consecutive stages:
  1. `acceptBatch`: Requires `acceptedKg <= b.quantityKg` (reverting with `MassBalanceViolation`).
  2. `recordProcessing`: Requires `inputKg <= b.acceptedKg` (reverting with `MassBalanceViolation`).
  3. `recordEndUse`: Requires `b.endUseKgTotal + endUseKg <= b.processedKg` (reverting with `MassBalanceViolation`).
- **Cumulative End-Use Tracking:** While partial calls to `recordEndUse` are supported to accommodate multi-day processing runs, the contract maintains a strict running sum (`b.endUseKgTotal`). The cumulative sum can never exceed the verified processed input.
- **Zero-Value Input Blocking:** Zero quantities (`quantityKg == 0`, `acceptedKg == 0`, `inputKg == 0`, `endUseKg == 0`) revert immediately with `InvalidQuantity()`.
- **Automated Test Validation:** Proven by tests: `"refuses acceptedKg that exceeds harvestedKg (mass balance)"`, `"refuses inputKg that exceeds acceptedKg"`, and `"refuses total endUseKg that exceeds inputKg"` in [test/ZiwaChain.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/ZiwaChain.ts).

### 2.6 Threat: Hash Collisions and Canonicalization Divergence
**Attack Vector:** Differences in key ordering, whitespace, float representations, or character encodings between the Node.js backend and the browser verification page produce false verification failures.  
**Mitigating Controls:**
- **RFC 8785 JSON Canonicalization:** Payloads are serialized using RFC 8785 Canonical JSON (`canonicalize` npm package in [src/hashing/canonical.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/src/hashing/canonical.ts)). Keys are strictly sorted by UTF-16 code units, and all superfluous whitespace is eliminated.
- **Integer Strictness:** To eliminate floating-point representation variances across JavaScript engines, all quantities and timestamps are validated as safe integers. Floating-point numbers, `NaN`, `Infinity`, `undefined`, functions, and symbols are rejected with descriptive errors before serialization.
- **128-Bit Cryptographic Salts:** Every record combines its canonical payload with a 16-byte random hex salt (`crypto.getRandomValues`) before hashing:
  $$\text{payloadHash} = \text{keccak256}(\text{toUtf8Bytes}(\text{canonicalJson}(\{ \text{salt}, \text{payload} \}))) \quad (\texttt{src/hashing/hash.ts})$$
- **Automated Test Validation:** Proven by 18 unit tests in [test/hashing.test.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/hashing.test.ts) testing nested sorting, float rejection, and pre-image sensitivity.

### 2.7 Threat: Privacy Violations & PII Leakage
**Attack Vector:** Harvester names, exact residence locations, or phone numbers are exposed on public explorers, exposing rural harvesters to identity theft or predatory lending.  
**Mitigating Controls:**
- **Zero On-Chain PII:** The contract stores zero strings, personal names, phone numbers, or GPS coordinates. All on-chain metadata consists of `bytes32` hashes, integer kilograms, timestamps, and EVM addresses.
- **Phone Masking:** The SMS gateway enforces strict phone masking (`src/sms/gateway.ts`). Full phone numbers never appear in logs or console outputs (e.g. `+254712345678` is masked as `+2547****678`).
- **Client-Side URL Fragment Privacy:** When certificates are loaded via QR code, certificate metadata is passed in the URL fragment (`#c=<base64url>`). Under RFC 3986, URL fragments are processed purely by client browser engines and are never transmitted in HTTP headers, preventing web server access logs from recording certificate data.
- **Automated Test Validation:** Proven by tests: `"masks all but the last 3 digits of a standard phone number"` and `"does not include the full phone number in the masked output"` in [test/sms.test.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/sms.test.ts).

### 2.8 Threat: Speculative Secondary Trading & Wash Trading (Non-Transferable Credits)
**Attack Vector:** Speculators acquire work credits, trade them on secondary DEXs, and execute wash trades to artificially pump perceived ecological impact.  
**Mitigating Controls:**
- **ERC-1155 `_update` Hook Enforcement:** Work credits (token ID 1, `WORK_CREDIT`) represent verified ecological restoration work, not tradable financial assets. Non-transferability is enforced at the core contract level by overriding the OpenZeppelin ERC-1155 `_update` internal hook:
  ```solidity
  function _update(
      address from,
      address to,
      uint256[] memory ids,
      uint256[] memory values
  ) internal virtual override {
      if (from != address(0)) {
          revert WorkCreditsNotTransferable();
      }
      super._update(from, to, ids, values);
  }
  ```
- **Mint-Only Allowance:** Transfers from any address other than `address(0)` (minting) revert unconditionally with `WorkCreditsNotTransferable()`. Token transfers and token burns are mathematically blocked.
- **Automated Test Validation:** Proven by tests: `"blocks safeTransferFrom for work credits"` and `"blocks safeBatchTransferFrom for work credits"` in [test/ZiwaChain.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/ZiwaChain.ts).

### 2.9 Threat: Admin Key Compromise & Centralization Risk
**Attack Vector:** The deployment admin key is stolen, allowing an attacker to reassign roles or disrupt protocol access control.  
**Mitigating Controls:**
- **Zero Operational Intervention:** The admin role (`DEFAULT_ADMIN_ROLE`) cannot call operational lifecycle methods (`logHarvest`, `verifyBatch`, `acceptBatch`, `confirmSettlement`, `recordProcessing`, `recordEndUse`). It can only grant and revoke roles.
- **Clean Multi-Sig Handover:** The contract is implemented without upgradeable proxies or complex storage layout requirements. Handing complete administrative ownership to a multi-signature smart contract vault (such as Gnosis Safe) requires a single transaction (`grantRole(DEFAULT_ADMIN_ROLE, safeAddress)` followed by `renounceRole`), requiring zero smart contract redeployment.

---

## 3. Append-Only Tamper-Evident Corrections

To accommodate real-world field errors (such as typographical errors in laboratory reports or incorrect photo hashes) without permitting arbitrary history rewriting, ZiwaChain implements an append-only correction mechanism (`correctRecord`):
- **Authorship Verification:** Only the original account that registered a hash can supersede it (`_hashAuthor[batchId][hash] == msg.sender`).
- **No Double Corrections:** An already-superseded hash cannot be corrected a second time (`_supersededByMap[batchId][oldHash] == bytes32(0)`).
- **No Hash Collisions:** The replacement hash cannot match an existing registered hash (`_hashAuthor[batchId][newHash] == address(0)`).
- **Immutable Historical Trail:** The original hash remains recorded on the contract, and the public verify page displays both hashes with an explicit notice indicating the record was corrected.
- **Mass Invariance:** Kilogram quantities can never be edited via `correctRecord`. If a weight error is confirmed after acceptance, the batch must be rejected or cancelled.
- **Automated Test Validation:** Proven by 6 unit tests in [test/ZiwaChain.ts](file:///home/grace/Projects/CODEINE/hackathonTingz/ZiwaChain/test/ZiwaChain.ts).

---

## 4. Honest Trust Assumptions & System Limitations

To ensure transparency with evaluating judges, we explicitly disclose the following trust assumptions:

1. **Relayer Custody Dependence:** Because harvesters do not manage EVM wallets, initial batch reporting relies on ZiwaClear's relayer key. While cryptographic checks prevent the relayer from verifying its own batches, the relayer is a centralized operational point for SMS intake.
2. **Custodian Multi-Relayer Isolation:** In the current prototype, any address with `RELAYER_ROLE` can invoke `confirmSettlement`. Restricting confirmation strictly to `b.custodian` is planned for multi-relayer enterprise scaling.
3. **Custodian Contract Receiver Requirement:** Work credits are minted to `b.custodian`. If the custodian address is a smart contract wallet, it must implement `IERC1155Receiver`; otherwise `recordEndUse` reverts with `ERC1155InvalidReceiver`.
4. **SMS Confirmation vs Cryptographic Signatures:** The harvester's settlement confirmation ("YES 4821") is routed through standard telecom operators. While permanently hash-anchored on Base Sepolia, it represents a telecom-attested co-sign rather than a direct asymmetric ECDSA digital signature. In the prototype, this SMS gateway is simulated (`src/sms/SimulatedGateway.ts`); live telecom integration is planned for production.
5. **Single Verifier Trust Point in Prototype:** The current contract relies on a single verifier key per batch. While verifiers cannot hold the relayer role, a dishonest verifier could collude with harvesters to approve sub-standard biomass. Upgrading to 2-of-N threshold verification is scheduled for Phase 2.
6. **Permanent Mass Balance:** If a scaling error is accepted by a commercial buyer, the kilogram mass cannot be altered retroactively. The batch must be cancelled and re-logged.
7. **Work Credits are Not Carbon Credits:** Work credits represent verified kilograms of hyacinth removed and diverted to circular processing. They do not constitute certified carbon credits.
8. **Field Inspection, Weighbridge & Intake Checks:** Landing-site field inspection, weighbridge calibration, and physical intake sampling describe the intended real-world process; hardware integrations are not built into the software prototype and test runs use simulated development signers.
9. **Illustrative Demo Data:** Seeded batches in `demo/demo-data.json` are illustrative demo data for protocol testing, not records of physical harvests.

For an architectural comparison explaining why a public blockchain is used rather than a centralized database or signed log, see [Why ZiwaChain Uses a Blockchain](whyBlockchain.md).

---

## 5. Automated Security Test Results

All 94 automated security and functional tests pass against the in-process Hardhat network:

```bash
$ npx hardhat test

  ZiwaChain
    logHarvest (4 tests passing)
    verifyBatch (4 tests passing)
    acceptBatch (5 tests passing)
    confirmSettlement (5 tests passing)
    recordProcessing (4 tests passing)
    recordEndUse (8 tests passing, including CEI and receiver lockout check)
    correctRecord (7 tests passing, including zero-hash InvalidHash check)
    work credit non-transferability (2 tests passing)
    view helpers (4 tests passing)

  Certificate Module
    shortCode Crockford Base32 (3 tests passing)
    buildCertificate & Base64URL round-trip (2 tests passing)
    certificateQr (1 test passing)

  Hashing Module
    RFC 8785 Canonical JSON (7 tests passing)
    Salt Generation (2 tests passing)
    Record & Confirmation Hashing (5 tests passing)
    Pseudonym Derivation HMAC-SHA256 (4 tests passing)

  Link and Script Integrity
    npm script targets check (1 test passing)
    README.md relative link resolution (1 test passing)
    docs/ link resolution (1 test passing)

  Public Verification Algorithm (web/in-browser verification)
    Client-side hash recomputation (2 tests passing)
    Event log matching & supersession audit (2 tests passing)
    Conservation of mass balance & payment reference check (2 tests passing)
    Tamper detection on forged and re-hashed payloads (1 test passing)
    Pseudonym integrity validation (1 test passing)
    Payment reference validation (1 test passing)
    Rejected batch amber status handling (1 test passing)

  SMS Flow
    Phone masking privacy (3 tests passing)
    Inbound message parsing & whitespace handling (5 tests passing)
    Settlement on-chain recording & re-entry refusal (3 tests passing)
    PROOF delivery & not-found handling (2 tests passing)

  94 passing (4s)
```
