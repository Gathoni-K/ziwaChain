import { expect } from "chai";
import { shortCode } from "../src/certificate/shortCode";
import { buildCertificate, toBase64Url, fromBase64Url } from "../src/certificate/build";
import { certificateQr } from "../src/certificate/qr";

describe("Certificate Module", () => {

  const samplePayloadHash1 = "0x0f04963fcce7334924a6c5acfa72bbefd976135e06f33a4ab459d005608f02c9";
  const samplePayloadHash2 = "0xdcd4e3d7e66f7a96319496880a22e4b46baf3576d589e6c06da6b41409204ae9";

  describe("shortCode (Crockford Base32)", () => {

    it("is deterministic and always 11 characters including the hyphen", () => {
      const code1 = shortCode(samplePayloadHash1);
      const code2 = shortCode(samplePayloadHash1);

      expect(code1).to.equal(code2);
      expect(code1.length).to.equal(11);
      expect(code1).to.match(/^[0-9A-HJ-NP-Z]{5}-[0-9A-HJ-NP-Z]{5}$/);
    });

    it("changes the short code when the payload hash changes", () => {
      const code1 = shortCode(samplePayloadHash1);
      const code2 = shortCode(samplePayloadHash2);

      expect(code1).to.not.equal(code2);
      expect(code2.length).to.equal(11);
      expect(code2).to.match(/^[0-9A-HJ-NP-Z]{5}-[0-9A-HJ-NP-Z]{5}$/);
    });

    it("requires a valid payload hash", () => {
      expect(() => shortCode("")).to.throw(/payloadHash is required/);
      expect(() => shortCode("0x12")).to.throw(/at least 8 bytes/);
    });

  });

  describe("buildCertificate & Base64URL round-trip", () => {

    const mockBatchData = {
      batchId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      pseudonym: "0x2222222222222222222222222222222222222222222222222222222222222222",
      chainId: "31337",
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      deploymentBlock: 1,
      stages: {
        HARVEST_LOGGED: {
          payload: {
            schemaVersion: 1,
            eventType: "HARVEST_LOGGED",
            batchId: "0x1111111111111111111111111111111111111111111111111111111111111111",
            hotspotRef: "0x3333333333333333333333333333333333333333333333333333333333333333",
            quantityKg: 1000,
            harvestedAt: 1729000000,
            region: "Winam Gulf",
            source: "ziwaclear-v1"
          },
          salt: "0x1234567890abcdef1234567890abcdef",
          hash: samplePayloadHash1,
          txHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
          blockNumber: 2
        }
      }
    };

    it("builds a version 1 certificate matching specification", () => {
      const cert = buildCertificate(mockBatchData, {
        paymentRef: "MPESA-TEST-9999",
        settlementCode: "4821",
        verifyBaseUrl: "https://ziwachain.org/verify"
      });

      expect(cert.version).to.equal(1);
      expect(cert.batchId).to.equal(mockBatchData.batchId);
      expect(cert.pseudonym).to.equal(mockBatchData.pseudonym);
      expect(cert.chainId).to.equal("31337");
      expect(cert.paymentRef).to.equal("MPESA-TEST-9999");
      expect(cert.settlementConfirmation.code).to.equal("4821");
      expect(cert.shortCode).to.equal(shortCode(samplePayloadHash1));
      expect(cert.verifyUrl).to.include("https://ziwachain.org/verify#c=");
    });

    it("successfully round-trips via Base64URL encoding and decoding", () => {
      const cert = buildCertificate(mockBatchData);
      const urlHash = cert.verifyUrl.split("#c=")[1];
      expect(urlHash).to.be.a("string");

      const decodedJson = fromBase64Url(urlHash);
      const parsedCert = JSON.parse(decodedJson);

      expect(parsedCert.batchId).to.equal(cert.batchId);
      expect(parsedCert.pseudonym).to.equal(cert.pseudonym);
      expect(parsedCert.shortCode).to.equal(cert.shortCode);
      expect(parsedCert.stages.HARVEST_LOGGED.payloadHash).to.equal(samplePayloadHash1);
    });

  });

  describe("certificateQr", () => {

    it("returns a valid PNG Data URL for a certificate", async () => {
      const mockBatchData = {
        batchId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        pseudonym: "0x2222222222222222222222222222222222222222222222222222222222222222",
        chainId: "31337",
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        deploymentBlock: 1,
        stages: {}
      };

      const cert = buildCertificate(mockBatchData);
      const qrDataUrl = await certificateQr(cert, "https://ziwachain.org/verify");

      expect(qrDataUrl).to.be.a("string");
      expect(qrDataUrl.startsWith("data:image/png;base64,")).to.be.true;
      expect(qrDataUrl.length).to.be.greaterThan(100);
    });

  });

});
