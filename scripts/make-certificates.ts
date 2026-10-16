import * as fs from "fs";
import * as path from "path";
import { buildCertificate } from "../src/certificate/build";
import { certificateQr } from "../src/certificate/qr";

async function main() {
  console.log("================================================================================");
  console.log("ZiwaChain Harvester Certificate Generator");
  console.log("================================================================================");

  const demoDataPath = path.join(process.cwd(), "demo", "demo-data.json");
  if (!fs.existsSync(demoDataPath)) {
    throw new Error(
      `Demo data not found at ${demoDataPath}. Please run the seed script first: npx hardhat run scripts/seed.ts`
    );
  }

  const rawDemo = fs.readFileSync(demoDataPath, "utf-8");
  const demoData = JSON.parse(rawDemo);

  const certDir = path.join(process.cwd(), "demo", "certificates");
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const batches = demoData.batches || {};
  console.log(`Loaded ${Object.keys(batches).length} batches from demo-data.json\n`);

  for (const [batchKey, batchData] of Object.entries<any>(batches)) {
    const batchId = batchData.batchId;
    const status = batchData.status || "";

    console.log(`Processing ${batchKey} (${batchId})...`);

    if (status.toLowerCase().includes("rejected")) {
      // For rejected batches, write a formal audit note documenting rejection
      const notePath = path.join(certDir, `${batchId}.note.txt`);
      const noteContent = `ZiwaChain Batch Verification Audit Note
--------------------------------------------------------------------------------
Batch ID:    ${batchId}
Pseudonym:   ${batchData.pseudonym}
Status:      Rejected (Terminal Quality Rejection)
Reason:      Excessive mud and inorganic contamination exceeding threshold.
Outcome:     In accordance with ZiwaChain protocol rules, stage Rejected is terminal.
             Work credits are not issued and a commercial certificate of custody is withheld.
Timestamp:   ${new Date().toISOString()}
--------------------------------------------------------------------------------
`;
      fs.writeFileSync(notePath, noteContent);

      const rejectedJsonPath = path.join(certDir, `${batchId}-rejected.json`);
      fs.writeFileSync(
        rejectedJsonPath,
        JSON.stringify(
          {
            version: 1,
            batchId,
            pseudonym: batchData.pseudonym,
            status: "Rejected",
            notice: "Batch rejected during independent physical verification; certificate withheld."
          },
          null,
          2
        )
      );

      console.log(`  [REJECTED] Audit note and rejection summary written to ${notePath}`);
      continue;
    }

    // Build the portable Harvester Certificate
    const certificate = buildCertificate(
      {
        ...batchData,
        chainId: demoData.chainId,
        contractAddress: demoData.contractAddress,
        deploymentBlock: demoData.deploymentBlock
      },
      {
        paymentRef: "MPESA-QKH78219XZ-2026",
        settlementCode: "4821",
        verifyBaseUrl: "https://ziwachain.org/verify"
      }
    );

    // Save Certificate JSON
    const jsonPath = path.join(certDir, `${batchId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(certificate, null, 2));
    console.log(`  [OK] Certificate JSON saved to ${jsonPath}`);
    console.log(`       Short Code (SMS): ${certificate.shortCode}`);

    // Generate and save QR code PNG
    const qrDataUrl = await certificateQr(certificate, "https://ziwachain.org/verify");
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const pngPath = path.join(certDir, `${batchId}.png`);
    fs.writeFileSync(pngPath, Buffer.from(base64Data, "base64"));
    console.log(`  [OK] QR Code PNG saved to ${pngPath}`);
  }

  console.log("\n================================================================================");
  console.log(`All certificates successfully written to: ${certDir}`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Certificate generation failed:", err);
  process.exitCode = 1;
});
