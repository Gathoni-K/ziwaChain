// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ZiwaChain
/// @notice Verified chain of custody for invasive water hyacinth biomass from Lake Victoria.
///
///   Chain of custody: Harvest → Verification → Buyer → Processing → End use
///
///   Harvesters report by SMS/USSD and hold no wallets; their batches are submitted
///   through a relayer address that ZiwaClear controls. Verifiers, buyers and processors
///   each sign with their own wallets.
///
/// @dev What this contract proves: that a record existed at a point in time, that it was not
///      altered afterwards, and that the process rules were followed. It does NOT prove that
///      the underlying real-world facts are true.
///
///      Personal data, GPS coordinates, photos and M-Pesa details are stored off-chain.
///      Only stage transitions, salted keccak256 hashes and quantities are recorded here.
///
///      Work credits (ERC-1155 token ID 1) are non-transferable records of verified biomass
///      that reached a real end use. They are NOT carbon credits.

contract ZiwaChain is ERC1155, AccessControl {

    // ─── Roles ────────────────────────────────────────────────────────────────

    /// @notice Submits harvests on behalf of SMS/USSD harvesters who hold no wallets.
    bytes32 public constant RELAYER_ROLE   = keccak256("RELAYER_ROLE");

    /// @notice Approves or rejects a logged harvest. Must NOT also hold RELAYER_ROLE.
    bytes32 public constant VERIFIER_ROLE  = keccak256("VERIFIER_ROLE");

    /// @notice Accepts a verified batch and records the payment reference hash.
    bytes32 public constant BUYER_ROLE     = keccak256("BUYER_ROLE");

    /// @notice Records processing and end use; triggers work-credit minting.
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");

    // ─── Token ID ─────────────────────────────────────────────────────────────

    /// @notice ERC-1155 token ID for work credits. One credit per kg that reaches end use.
    uint256 public constant WORK_CREDIT = 1;

    // ─── Stage lifecycle ──────────────────────────────────────────────────────

    /// @notice The stages a batch moves through in strict order.
    ///         None means the batchId has never been used.
    ///         Rejected is terminal: a rejected batch cannot advance.
    enum Stage {
        None,       // 0 – batch does not exist
        Harvested,  // 1 – logged by relayer; awaiting verification
        Verified,   // 2 – approved by verifier
        Rejected,   // 3 – rejected by verifier (terminal; re-log as a new batch)
        Accepted,   // 4 – accepted by buyer; M-Pesa payment made off-chain
        Processed,  // 5 – biomass passed to a processor
        EndUse      // 6 – at least one end-use event recorded; credits minted
    }

    // ─── Batch record ─────────────────────────────────────────────────────────

    /// @notice Everything the contract stores about one biomass lot.
    /// @dev Hashes replace every real-world identifier. The taxonomy for processType
    ///      and endUseType lives off-chain; the contract only stores the bytes32 label.
    struct Batch {
        Stage   stage;
        address custodian;              // relayer who submitted the harvest; holds minted credits
        address buyer;                  // buyer who called acceptBatch
        address processor;              // processor who called recordProcessing; must match in recordEndUse
        bytes32 harvesterId;            // per-batch pseudonym: HMAC(server_secret, groupId|batchId)
        bytes32 hotspotRef;             // keccak256 of the off-chain hotspot record
        uint256 harvestedKg;            // declared harvest mass
        uint256 acceptedKg;             // buyer-accepted mass (≤ harvestedKg)
        uint256 processedKg;            // mass fed to processing (≤ acceptedKg)
        uint256 endUseKgTotal;          // running total across all recordEndUse calls (≤ processedKg)
        bytes32 paymentRefHash;         // keccak256 of the M-Pesa payment reference
        bytes32 settlementConfirmation; // keccak256 of the harvester's SMS confirmation
        bool    settled;                // true once confirmSettlement has succeeded
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(bytes32 => Batch) private _batches;

    /// @dev _hashAuthor[batchId][hash] = the address that first recorded that hash for that batch.
    ///      Used by correctRecord to enforce "only the original author can supersede a hash."
    mapping(bytes32 => mapping(bytes32 => address)) private _hashAuthor;

    /// @dev _supersededByMap[batchId][oldHash] = newHash (zero means not yet superseded).
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _supersededByMap;

    /// @dev Total work credits attributed to a pseudonymous harvester ID across all end-use calls.
    ///      A harvester's full history across batches is assembled off-chain from their certificates.
    mapping(bytes32 => uint256) private _workCredits;

    // ─── Events ───────────────────────────────────────────────────────────────
    //
    // Every state transition emits an event. The verify page reads these events to reconstruct
    // a batch's full history without needing the ZiwaClear backend.

    event HarvestLogged(
        bytes32 indexed batchId,
        bytes32 indexed harvesterId,
        bytes32         hotspotRef,
        uint256         quantityKg,
        bytes32         evidenceHash,
        bytes32         payloadHash
    );

    event BatchVerified(
        bytes32 indexed batchId,
        address indexed verifier,
        bool            approved,
        bytes32         evidenceHash,
        bytes32         payloadHash
    );

    event BatchAccepted(
        bytes32 indexed batchId,
        address indexed buyer,
        uint256         acceptedKg,
        bytes32         paymentRefHash,
        bytes32         payloadHash
    );

    event SettlementConfirmed(
        bytes32 indexed batchId,
        bytes32         confirmationHash,
        bytes32         payloadHash
    );

    event BatchProcessed(
        bytes32 indexed batchId,
        address indexed processor,
        bytes32         processType,
        uint256         inputKg,
        uint256         outputUnits,
        bytes32         payloadHash
    );

    event EndUseRecorded(
        bytes32 indexed batchId,
        bytes32         endUseType,
        uint256         endUseKg,
        uint256         outputUnits,
        bytes32         payloadHash
    );

    event RecordCorrected(
        bytes32 indexed batchId,
        address indexed author,
        bytes32         supersededHash,
        bytes32         newHash,
        bytes32         reasonHash
    );

    /// @notice Emitted on every recordEndUse call so the verify page can show credit totals
    ///         without scanning ERC-1155 transfer events.
    event CreditsIssued(
        bytes32 indexed batchId,
        bytes32 indexed harvesterId,
        uint256         amount
    );

    // ─── Custom errors ────────────────────────────────────────────────────────

    /// @notice logHarvest was called with a batchId that already exists.
    error BatchAlreadyExists(bytes32 batchId);

    /// @notice A function was called for a batchId that has never been logged.
    error UnknownBatch(bytes32 batchId);

    /// @notice A stage transition was attempted from the wrong stage.
    ///         `current` is the stage the batch is actually at.
    error WrongStage(Stage current);

    /// @notice A quantity of zero was submitted where a positive value is required.
    error InvalidQuantity();

    /// @notice An address that holds RELAYER_ROLE attempted to call verifyBatch.
    ///         Separation of duties: a submitter must not verify their own submission.
    error VerifierCannotBeRelayer();

    /// @notice A quantity would violate mass balance (e.g. acceptedKg > harvestedKg).
    error MassBalanceViolation();

    /// @notice confirmSettlement was called a second time on the same batch.
    error AlreadySettled(bytes32 batchId);

    /// @notice recordEndUse was called by an address other than the stored processor.
    error NotBatchProcessor();

    /// @notice correctRecord was called with a hash that was never recorded for this batch.
    error HashNotFound();

    /// @notice correctRecord was called on a hash that has already been superseded.
    error HashAlreadySuperseded(bytes32 hash);

    /// @notice The caller of correctRecord is not the address that originally recorded the hash.
    error NotHashAuthor();

    /// @notice The proposed newHash in correctRecord is already registered for this batch.
    ///         Each hash can only appear once; reuse could create circular chains.
    error CannotReuseHash(bytes32 hash);

    /// @notice safeTransferFrom or safeBatchTransferFrom was called.
    ///         Work credits are non-transferable; only minting from address(0) is allowed.
    error NonTransferable();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param admin Receives DEFAULT_ADMIN_ROLE and can grant all other roles.
    ///              Can be transferred to a multisig later with no contract changes.
    constructor(address admin) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // State-transition functions
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Logs a harvest on behalf of an SMS/USSD harvester.
    ///         Only an address holding RELAYER_ROLE may call this.
    ///         Creates the batch record and moves it to stage Harvested.
    ///
    /// @param batchId       Unique identifier for this biomass lot (generated by ZiwaClear).
    /// @param harvesterId   Per-batch pseudonym. Computed as HMAC-SHA256(server_secret, groupId|batchId).
    ///                      A new pseudonym is issued for every batch so that batches from the same
    ///                      harvester cannot be linked on the public chain.
    /// @param hotspotRef    keccak256 hash of the off-chain hotspot record. Keeps ZiwaVision
    ///                      independent: ZiwaVision can plug in later without contract changes.
    /// @param quantityKg    Declared harvest mass in kilograms. Must be > 0.
    /// @param evidenceHash  keccak256 of the salted field-evidence payload (photos, notes off-chain).
    /// @param payloadHash   keccak256 of the canonical JSON event envelope (RFC 8785 + per-record salt).
    function logHarvest(
        bytes32 batchId,
        bytes32 harvesterId,
        bytes32 hotspotRef,
        uint256 quantityKg,
        bytes32 evidenceHash,
        bytes32 payloadHash
    ) external onlyRole(RELAYER_ROLE) {
        if (_batches[batchId].stage != Stage.None) revert BatchAlreadyExists(batchId);
        if (quantityKg == 0) revert InvalidQuantity();

        Batch storage b = _batches[batchId];
        b.stage       = Stage.Harvested;
        b.custodian   = msg.sender;   // relayer is the custodian; will receive minted credits
        b.harvesterId = harvesterId;
        b.hotspotRef  = hotspotRef;
        b.harvestedKg = quantityKg;

        _recordHash(batchId, evidenceHash);
        _recordHash(batchId, payloadHash);

        emit HarvestLogged(batchId, harvesterId, hotspotRef, quantityKg, evidenceHash, payloadHash);
    }

    /// @notice Approves or rejects a harvested batch.
    ///         Only an address holding VERIFIER_ROLE may call this.
    ///         The caller must NOT also hold RELAYER_ROLE (prevents a submitter from verifying
    ///         their own harvest).
    ///         A rejected batch is terminal and cannot advance further.
    ///
    /// @param batchId       The batch to verify. Must be at stage Harvested.
    /// @param approved      true → stage becomes Verified; false → stage becomes Rejected (terminal).
    /// @param evidenceHash  keccak256 of the verifier's salted evidence payload.
    /// @param payloadHash   keccak256 of the canonical JSON verification event.
    function verifyBatch(
        bytes32 batchId,
        bool    approved,
        bytes32 evidenceHash,
        bytes32 payloadHash
    ) external onlyRole(VERIFIER_ROLE) {
        if (hasRole(RELAYER_ROLE, msg.sender)) revert VerifierCannotBeRelayer();

        Batch storage b = _requireStage(batchId, Stage.Harvested);
        b.stage = approved ? Stage.Verified : Stage.Rejected;

        _recordHash(batchId, evidenceHash);
        _recordHash(batchId, payloadHash);

        emit BatchVerified(batchId, msg.sender, approved, evidenceHash, payloadHash);
    }

    /// @notice Records the buyer's acceptance of a verified batch.
    ///         Only an address holding BUYER_ROLE may call this.
    ///         msg.sender is stored as the buyer. One buyer per batch.
    ///         The M-Pesa payment itself happens off-chain; only its hash is recorded here.
    ///
    /// @param batchId        The batch to accept. Must be at stage Verified.
    /// @param acceptedKg     Quantity the buyer accepts in kg. Must be > 0 and ≤ harvestedKg.
    /// @param paymentRefHash keccak256 of the M-Pesa payment reference.
    /// @param payloadHash    keccak256 of the canonical JSON acceptance event.
    function acceptBatch(
        bytes32 batchId,
        uint256 acceptedKg,
        bytes32 paymentRefHash,
        bytes32 payloadHash
    ) external onlyRole(BUYER_ROLE) {
        Batch storage b = _requireStage(batchId, Stage.Verified);
        if (acceptedKg == 0) revert InvalidQuantity();
        if (acceptedKg > b.harvestedKg) revert MassBalanceViolation();

        b.stage          = Stage.Accepted;
        b.buyer          = msg.sender;
        b.acceptedKg     = acceptedKg;
        b.paymentRefHash = paymentRefHash;

        _recordHash(batchId, paymentRefHash);
        _recordHash(batchId, payloadHash);

        emit BatchAccepted(batchId, msg.sender, acceptedKg, paymentRefHash, payloadHash);
    }

    /// @notice Records the harvester's SMS settlement confirmation.
    ///         Only an address holding RELAYER_ROLE may call this.
    ///         Allowed at stage Accepted, Processed or EndUse. May only be called once per batch.
    ///         Does NOT change the stage. Does NOT gate work credits.
    ///
    /// @param batchId           The batch to confirm.
    /// @param confirmationHash  keccak256 of the harvester's SMS reply (e.g. "YES 4821").
    /// @param payloadHash       keccak256 of the canonical JSON confirmation event.
    function confirmSettlement(
        bytes32 batchId,
        bytes32 confirmationHash,
        bytes32 payloadHash
    ) external onlyRole(RELAYER_ROLE) {
        Batch storage b = _batches[batchId];
        if (b.stage == Stage.None) revert UnknownBatch(batchId);
        if (b.stage != Stage.Accepted &&
            b.stage != Stage.Processed &&
            b.stage != Stage.EndUse) {
            revert WrongStage(b.stage);
        }
        if (b.settled) revert AlreadySettled(batchId);

        b.settled                = true;
        b.settlementConfirmation = confirmationHash;

        _recordHash(batchId, confirmationHash);
        _recordHash(batchId, payloadHash);

        emit SettlementConfirmed(batchId, confirmationHash, payloadHash);
    }

    /// @notice Records that a batch has been processed.
    ///         Only an address holding PROCESSOR_ROLE may call this.
    ///         msg.sender is stored as the processor and must match in all later recordEndUse
    ///         calls for this batch. One processor per batch.
    ///
    /// @param batchId     The batch being processed. Must be at stage Accepted.
    /// @param processType bytes32 label for the processing type (e.g. keccak256("biogas")).
    ///                    The full taxonomy lives off-chain; only the label is stored in the event.
    /// @param inputKg     Mass fed into processing in kg. Must be > 0 and ≤ acceptedKg.
    /// @param outputUnits Number of output units (compost bags, biogas m³, etc.) for the event log.
    /// @param payloadHash keccak256 of the canonical JSON processing event.
    function recordProcessing(
        bytes32 batchId,
        bytes32 processType,
        uint256 inputKg,
        uint256 outputUnits,
        bytes32 payloadHash
    ) external onlyRole(PROCESSOR_ROLE) {
        Batch storage b = _requireStage(batchId, Stage.Accepted);
        if (inputKg == 0) revert InvalidQuantity();
        if (inputKg > b.acceptedKg) revert MassBalanceViolation();

        b.stage       = Stage.Processed;
        b.processor   = msg.sender;
        b.processedKg = inputKg;

        _recordHash(batchId, payloadHash);

        emit BatchProcessed(batchId, msg.sender, processType, inputKg, outputUnits, payloadHash);
    }

    /// @notice Records a partial or full end use of the processed biomass and mints work credits.
    ///         May be called multiple times; endUseKgTotal accumulates across calls.
    ///         Only an address holding PROCESSOR_ROLE that is also the stored processor for this
    ///         batch may call this. Any other address with PROCESSOR_ROLE reverts with NotBatchProcessor.
    ///
    ///         Mints one WORK_CREDIT (token ID 1) per kg to the custodian (relayer) on each call.
    ///         Credits are tracked per harvesterId in workCreditsOf for the verify page.
    ///
    /// @param batchId     The batch reaching end use. Must be at stage Processed or EndUse.
    /// @param endUseType  bytes32 label for the end-use category (e.g. keccak256("bioenergy")).
    /// @param endUseKg    Kilograms consumed in this end-use event. endUseKgTotal + endUseKg must
    ///                    not exceed processedKg.
    /// @param outputUnits Output units for this event (stored in the event log only).
    /// @param payloadHash keccak256 of the canonical JSON end-use event.
    function recordEndUse(
        bytes32 batchId,
        bytes32 endUseType,
        uint256 endUseKg,
        uint256 outputUnits,
        bytes32 payloadHash
    ) external onlyRole(PROCESSOR_ROLE) {
        Batch storage b = _batches[batchId];
        if (b.stage == Stage.None) revert UnknownBatch(batchId);
        if (b.stage != Stage.Processed && b.stage != Stage.EndUse) revert WrongStage(b.stage);
        if (msg.sender != b.processor) revert NotBatchProcessor();
        if (endUseKg == 0) revert InvalidQuantity();
        if (b.endUseKgTotal + endUseKg > b.processedKg) revert MassBalanceViolation();

        b.stage          = Stage.EndUse;     // idempotent on the second and later calls
        b.endUseKgTotal += endUseKg;

        _recordHash(batchId, payloadHash);

        // Mint one work credit per kg to the relayer, who holds them as custodian on behalf of
        // the pseudonymous harvester. Credits are non-transferable (enforced in _update below).
        _mint(b.custodian, WORK_CREDIT, endUseKg, "");
        _workCredits[b.harvesterId] += endUseKg;

        emit EndUseRecorded(batchId, endUseType, endUseKg, outputUnits, payloadHash);
        emit CreditsIssued(batchId, b.harvesterId, endUseKg);
    }

    /// @notice Supersedes an evidence or payload hash that was recorded in error.
    ///         Only the address that originally recorded the hash may call this.
    ///         Each hash can only be superseded once.
    ///         The replacement hash must not already be registered for this batch.
    ///
    ///         Quantities are NEVER corrected here. A wrong quantity means rejecting the
    ///         batch and re-logging it as a fresh batch. This protects mass-balance guarantees.
    ///
    /// @param batchId        The batch containing the hash to correct.
    /// @param supersededHash The hash being replaced.
    /// @param newHash        The corrected hash.
    /// @param reasonHash     keccak256 of the reason for the correction (kept for audit).
    function correctRecord(
        bytes32 batchId,
        bytes32 supersededHash,
        bytes32 newHash,
        bytes32 reasonHash
    ) external {
        if (_batches[batchId].stage == Stage.None) revert UnknownBatch(batchId);

        address author = _hashAuthor[batchId][supersededHash];
        if (author == address(0))   revert HashNotFound();
        if (author != msg.sender)   revert NotHashAuthor();

        if (_supersededByMap[batchId][supersededHash] != bytes32(0))
            revert HashAlreadySuperseded(supersededHash);

        // The replacement must be a fresh hash for this batch to prevent reuse and circular chains.
        if (_hashAuthor[batchId][newHash] != address(0)) revert CannotReuseHash(newHash);

        _supersededByMap[batchId][supersededHash] = newHash;
        _recordHash(batchId, newHash);   // the corrector becomes the author of the new hash

        emit RecordCorrected(batchId, msg.sender, supersededHash, newHash, reasonHash);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // View functions
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Returns the full on-chain record for a batch.
    ///         Reverts with UnknownBatch if the batchId has never been used.
    function getBatch(bytes32 batchId) external view returns (Batch memory) {
        if (_batches[batchId].stage == Stage.None) revert UnknownBatch(batchId);
        return _batches[batchId];
    }

    /// @notice Returns the total work credits attributed to a pseudonymous harvester ID.
    /// @dev    Because each batch uses a new pseudonym, a harvester's cumulative total across
    ///         all batches must be assembled off-chain from their set of certificates.
    function workCreditsOf(bytes32 harvesterId) external view returns (uint256) {
        return _workCredits[harvesterId];
    }

    /// @notice Returns the hash that replaced the given hash for a batch, or bytes32(0) if it
    ///         has not been superseded.
    function supersededBy(bytes32 batchId, bytes32 hash) external view returns (bytes32) {
        return _supersededByMap[batchId][hash];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Non-transferability
    // ═══════════════════════════════════════════════════════════════════════════

    /// @dev Overrides the internal ERC-1155 _update hook, which is called for every token
    ///      movement including minting, burning and transfers.
    ///      We allow minting (from == address(0)) and block everything else, making work
    ///      credits permanently non-transferable and non-burnable.
    ///      The public safeTransferFrom / safeBatchTransferFrom functions still exist on the
    ///      ABI but will always revert through this hook.
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        if (from != address(0)) revert NonTransferable();
        super._update(from, to, ids, values);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Interface resolution
    // ═══════════════════════════════════════════════════════════════════════════

    /// @dev Both ERC1155 and AccessControl define supportsInterface; this resolves the conflict.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Internal helpers
    // ═══════════════════════════════════════════════════════════════════════════

    /// @dev Records msg.sender as the author of a hash for a given batch, but only on the
    ///      first call. If the same (batchId, hash) pair is seen again the mapping is left
    ///      unchanged, so authorship always belongs to whoever first included that hash.
    function _recordHash(bytes32 batchId, bytes32 hash) private {
        if (_hashAuthor[batchId][hash] == address(0)) {
            _hashAuthor[batchId][hash] = msg.sender;
        }
    }

    /// @dev Asserts that a batch exists and is at `expected` stage.
    ///      Returns a storage pointer to the Batch so the caller can modify it directly.
    function _requireStage(bytes32 batchId, Stage expected) private view returns (Batch storage b) {
        b = _batches[batchId];
        if (b.stage == Stage.None)   revert UnknownBatch(batchId);
        if (b.stage != expected)     revert WrongStage(b.stage);
    }
}