import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Hardhat Ignition deployment module for ZiwaChain.
//
// Usage:
//   npx hardhat ignition deploy ignition/modules/ZiwaChain.ts --network baseSepolia
//
// Account 0 (the first account in the configured keystore or DEPLOYER_PRIVATE_KEY) becomes
// the DEFAULT_ADMIN_ROLE holder. That address can then grant RELAYER_ROLE, VERIFIER_ROLE,
// BUYER_ROLE and PROCESSOR_ROLE to the appropriate wallets on-chain.
//
// The admin role can later be transferred to a multisig with no contract changes needed.

const ZiwaChainModule = buildModule("ZiwaChainModule", (m) => {
  // m.getAccount(0) resolves to the deployer address at deploy time.
  const admin = m.getAccount(0);

  // Deploy ZiwaChain with the deployer as the initial admin.
  const ziwaChain = m.contract("ZiwaChain", [admin]);

  return { ziwaChain };
});

export default ZiwaChainModule;
