import demoData from "../demo/demo-data.json";
import batchA from "../demo/certificates/0x2979c3606b661c258449350a53dd28384d5d42d8032e35ac9bc98739b5e17bcd.json";
import batchBRejected from "../demo/certificates/0x2b6293d3dc213c071c149c2c6f793cdd8811b7645e49ff163207f1a8e5d60b2b-rejected.json";
import batchCCert from "../demo/certificates/0xd40a728929587fa4c1da8091b20cdfd2c377f2052bb08ceda61e3f5affc559d7.json";
import batchD from "../demo/certificates/0x62438758e29069339cee4648ac047282fd4ea6ff7a7933bc44d665a66cc2917e.json";

const rawBatchB = demoData.batches.batchB;
const batchBStages: Record<string, any> = {};
for (const [key, stage] of Object.entries(rawBatchB.stages as Record<string, any>)) {
  batchBStages[key] = {
    eventType: stage.payload.eventType,
    payload: stage.payload,
    salt: stage.salt,
    payloadHash: stage.hash,
    txHash: stage.txHash,
    blockNumber: stage.blockNumber
  };
}

const batchB = {
  version: 1,
  chainId: demoData.chainId,
  contractAddress: demoData.contractAddress,
  batchId: rawBatchB.batchId,
  pseudonym: rawBatchB.pseudonym,
  deploymentBlock: demoData.deploymentBlock,
  stages: batchBStages,
  status: "Rejected",
  notice: batchBRejected.notice,
  rejectionReason: "Excessive mud and inorganic contamination exceeding threshold."
};

const batchC = {
  ...batchCCert,
  supersededRecords: demoData.batches.batchC.supersededRecords
};

export { batchA, batchB, batchC, batchD };
