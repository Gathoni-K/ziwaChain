/**
 * scripts/verify.ts
 *
 * Verifies the ZiwaChain contract on Base Sepolia via the Etherscan V2 API.
 *
 * Prerequisites:
 *   - Contract must already be deployed (run `npx hardhat run scripts/seed.ts --network baseSepolia`).
 *   - demo/demo-data.json must exist and contain `contractAddress` and `adminAddress`.
 *   - ETHERSCAN_API_KEY must be set in your .env file.
 *     One Etherscan V2 key covers Base Sepolia. Do NOT use a separate Basescan key.
 *
 * Run:
 *   npx hardhat run scripts/verify.ts --network baseSepolia
 */

import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const demoDataPath = path.join(process.cwd(), "demo", "demo-data.json");
  if (!fs.existsSync(demoDataPath)) {
    throw new Error(
      `demo/demo-data.json not found. Run scripts/seed.ts --network baseSepolia first.`
    );
  }

  const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf-8"));
  const { contractAddress, adminAddress, network: seededNetwork } = demoData;

  if (!contractAddress || !adminAddress) {
    throw new Error(
      "demo/demo-data.json is missing contractAddress or adminAddress. Re-run seed.ts."
    );
  }

  const currentNetwork = hre.network.name;
  if (seededNetwork !== currentNetwork) {
    console.warn(
      `WARNING: demo-data.json was seeded on '${seededNetwork}' but you are running --network ${currentNetwork}.`
    );
    console.warn(`Proceeding anyway — make sure this is intentional.`);
  }

  console.log(`Verifying ZiwaChain at ${contractAddress}`);
  console.log(`  Admin constructor argument: ${adminAddress}`);
  console.log(`  Network: ${currentNetwork}`);
  console.log(`  Etherscan API Key present: ${!!process.env.ETHERSCAN_API_KEY}`);
  console.log("");

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [adminAddress],
  });

  console.log("Verification submitted successfully.");
  console.log(`View on Basescan: https://sepolia.basescan.org/address/${contractAddress}#code`);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exitCode = 1;
});
