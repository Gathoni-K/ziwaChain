// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ZiwaChain} from "../ZiwaChain.sol";

/// @notice A contract relayer that intentionally does NOT implement IERC1155Receiver.
/// @dev Used to test and document that a custodian contract without ERC1155 receiver support
///      causes recordEndUse to revert with ERC1155InvalidReceiver.
contract PlainRelayer {
    function logHarvest(
        ZiwaChain zc,
        bytes32 batchId,
        bytes32 harvesterId,
        bytes32 hotspotRef,
        uint256 quantityKg,
        bytes32 evidenceHash,
        bytes32 payloadHash
    ) external {
        zc.logHarvest(batchId, harvesterId, hotspotRef, quantityKg, evidenceHash, payloadHash);
    }
}
