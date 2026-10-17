import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
dotenv.config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: { evmVersion: "cancun" },
  },
  networks: {
    sepolia: { url: process.env.SEPOLIA_RPC_URL ?? "", accounts },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
      accounts,
    },
  },
  // Etherscan V2: one API key covers all supported networks including Base Sepolia.
  // Do NOT add a customChains entry or a per-chain baseSepolia key — those are
  // the deprecated V1 approach and break with hardhat-verify v2.
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ?? "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "docs/architecture/gasReport.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    // Set REPORT_GAS=true and optionally COINMARKETCAP_API_KEY for live USD estimates.
  },
};

export default config;