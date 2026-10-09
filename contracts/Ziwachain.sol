//SPDX-Lincense-Identifier : MIT

pragma solidity ^0.8.20;
//defines the SOlidity version this file needs

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

//bring in the OpenZeppelin building blocks, ERC1155 is the std. for tokes which we use for work credits
//AccessControl handles roles

///@title ZIwaChain
/// @notice Verified chain of custody for invasive water hyacinth biomass:

/// Harvest -> Verification -> Buyer -> Processing -> End use
/// Hotsport detection stays off-chain and is referenced by hash.

/// @dev Personal data and evidence stay off-chain, only hashes, stages and quantities are recorded. 
/// Circular impact credits are non-transferable
/// ERC-1155 tokens minted at end use. They are not carbon credits. 




// this file contains the smart contract

contract ZiwaChain is ERC1155, AccessControl {
    //our contract inherits everything the two provide
    //define roles, who is allowed to do what
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");

    //each role is a labe, a hash of its name
    //hashing keeps the label a fixed size

    // define the stage a batch moves through

    enum Stage {
        None,
        Harvested,
        Verified,
        Rejected,
        Accepted,
        Processed,
        EndUse
    }

    //everything the contract remembers about one batch
    struct Batch {
        Stage stage;
        address custodian;
        address buyer;
        address processor;
        bytes32 harvesterId;
        bytes32 hotspotRef;
        uint256 harvestedKg;
        uint256 acceptedKg;
        uint256 endUseKgTotal;
        bytes32 settlementConfirmation;
    }
    //defines the contract's memory for a single batch
    //mass-balance rule uses the quantities, hashes and pseudonyms are stored as bytes32, never names or phone numbers

    //look up a batch by its ID
    mapping(bytes32 => Batch) private _batches;
    //a lookup able from a batch ID to its record

    event HarvestLogged(
        bytes32 indexed batchId,
        bytes32 indexed harvesterId,
        bytes32 hotspotRef,
        uint256 quantityKg,
        bytes32 evidenceHash,
        bytes32 payloadHash
    );

    event BatchVerified(
        bytes32 indexed batchId,
        address indexed verifier,
        bool approved,
        bytes32 evidenceHash,
        bytes32 payloadHash
    );
    //events are the public history, when a step happens, the contract writes a line to the chain's log that anyone can read.
    //this is how the verify page will see a batch's journey, indexed means you can search the log by that field such as all events for one batch

    //errors, the reasons a contract might refuse a call
    error BatchAlreadyExists(bytes32 batchId);
    error UnknownBatch(bytes32 batchId);
    error WrongStage(Stage current);
    error InvalidQuantity();
    error VerifierCannotBeRelayer();

    constructor(address admin) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }
    //runs once at deployment

    //the relayer registers a harvest on behalf of the harvester
    function logHarvest (
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
        b.stage = Stage.Harvested;
        b.custodian = msg.sender;
        b.harvesterId = harvesterId;
        b.hotspotRef = hotspotRef;
        b.harvestedKg = quantityKg;

        emit HarvestLogged(batchId, harvesterId, hotspotRef, quantityKg, evidenceHash, payloadHash);

    }

    function verifyBatch(
        bytes32 batchId,
        bool approved,
        bytes32 evidenceHash,
        bytes32 payloadHash
    ) external onlyRole(VERIFIER_ROLE) {
        // external meaning it is called from outside the contract and onlyRole is the guard, anyone without that role is refused the function before the function body runs

        if (hasRole(RELAYER_ROLE, msg.sender)) revert VerifierCannotBeRelayer();
        // revert... is the rule check in all these code blocks, if the condition is true, the call stops and nothing is saved

        Batch storage b =  _requireStage(batchId, Stage.Harvested);
        b.stage = approved ? Stage.Verified : Stage.Rejected;

        emit BatchVerified(batchId, msg.sender, approved, evidenceHash, payloadHash);
    }

    //read a batch's record
    function getBatch(bytes32 batchId) external view returns (Batch memory) {
        if (_batches[batchId].stage == Stage.None) revert UnknownBatch(batchId);
        return _batches[batchId]; 
    }

    //helper: the batch must exist and be at the expected stage
    function _requireStage(bytes32 batchId, Stage expected) private view returns (Batch storage b) {
        b = _batches[batchId];
        if (b.stage == Stage.None) revert UnknownBatch(batchId);
        //this checks if the Batch even exists
        if (b.stage != expected) revert WrongStage(b.stage);
        //checking if the ID is already taken
    }

    //a verifier approves or rejects the harvest

    //the block of code is needed because both ERC1155 and AccessControl define this function
    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC1155, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

}