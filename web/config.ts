/**
 * Configuration for the ZiwaChain in-browser verification client.
 * Browser-safe with zero external network dependencies other than the chosen JSON-RPC provider.
 */

export const DEFAULT_BASE_SEPOLIA_RPC = "https://sepolia.base.org";
export const LOCAL_HARDHAT_RPC = "http://127.0.0.1:8545";

/**
 * Resolves the JSON-RPC provider URL.
 * Checks the window query string for `?rpc=<url>`.
 * Falls back to local RPC if certificate chainId is 31337, or Base Sepolia public RPC otherwise.
 */
export function getRpcUrl(certificateChainId?: string): string {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const customRpc = urlParams.get("rpc");
    if (customRpc) {
      return customRpc;
    }
  }

  if (certificateChainId === "31337") {
    return LOCAL_HARDHAT_RPC;
  }

  return DEFAULT_BASE_SEPOLIA_RPC;
}

/**
 * Stage enum mapping matching ZiwaChain.sol
 */
export const STAGE_NAMES: Record<number, string> = {
  0: "None",
  1: "Harvested",
  2: "Verified",
  3: "Rejected",
  4: "Accepted",
  5: "Processed",
  6: "EndUse"
};

/**
 * Minimal ABI covering view methods and provenance events for ZiwaChain.
 */
export const ZIWACHAIN_ABI = [
  "function getBatch(bytes32 batchId) view returns (tuple(uint8 stage, address custodian, address buyer, address processor, bytes32 harvesterId, bytes32 hotspotRef, uint256 harvestedKg, uint256 acceptedKg, uint256 processedKg, uint256 endUseKgTotal, bytes32 paymentRefHash, bytes32 settlementConfirmation, bool settled))",
  "function workCreditsOf(bytes32 harvesterId) view returns (uint256)",
  "function supersededBy(bytes32 batchId, bytes32 hash) view returns (bytes32)",
  "event HarvestLogged(bytes32 indexed batchId, bytes32 indexed harvesterId, bytes32 hotspotRef, uint256 quantityKg, bytes32 evidenceHash, bytes32 payloadHash)",
  "event BatchVerified(bytes32 indexed batchId, address indexed verifier, bool approved, bytes32 evidenceHash, bytes32 payloadHash)",
  "event BatchAccepted(bytes32 indexed batchId, address indexed buyer, uint256 acceptedKg, bytes32 paymentRefHash, bytes32 payloadHash)",
  "event SettlementConfirmed(bytes32 indexed batchId, bytes32 confirmationHash, bytes32 payloadHash)",
  "event BatchProcessed(bytes32 indexed batchId, address indexed processor, bytes32 processType, uint256 inputKg, uint256 outputUnits, bytes32 payloadHash)",
  "event EndUseRecorded(bytes32 indexed batchId, bytes32 endUseType, uint256 endUseKg, uint256 outputUnits, bytes32 payloadHash)",
  "event RecordCorrected(bytes32 indexed batchId, address indexed author, bytes32 supersededHash, bytes32 newHash, bytes32 reasonHash)",
  "event CreditsIssued(bytes32 indexed batchId, bytes32 indexed harvesterId, uint256 amount)"
];
