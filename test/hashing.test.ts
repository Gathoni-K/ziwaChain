import { expect } from "chai";
import { canonicalJson } from "../src/hashing/canonical";
import { newSalt } from "../src/hashing/salt";
import { hashRecord, hashConfirmation } from "../src/hashing/hash";
import { derivePseudonym } from "../src/hashing/pseudonym";
import { HarvestPayload } from "../src/hashing/types";

describe("Hashing Module", () => {

  describe("RFC 8785 Canonical JSON", () => {

    it("ensures object key order does not change output", () => {
      const obj1 = { b: 1, a: 2 };
      const obj2 = { a: 2, b: 1 };
      const expected = '{"a":2,"b":1}';

      expect(canonicalJson(obj1)).to.equal(expected);
      expect(canonicalJson(obj2)).to.equal(expected);
      expect(canonicalJson(obj1)).to.equal(canonicalJson(obj2));
    });

    it("handles deeply nested objects with mixed key order", () => {
      const complex1 = {
        meta: { z: 10, y: 20 },
        list: [1, 2, { d: 4, c: 3 }],
        active: true
      };
      const complex2 = {
        active: true,
        list: [1, 2, { c: 3, d: 4 }],
        meta: { y: 20, z: 10 }
      };

      expect(canonicalJson(complex1)).to.equal(canonicalJson(complex2));
      expect(canonicalJson(complex1)).to.equal(
        '{"active":true,"list":[1,2,{"c":3,"d":4}],"meta":{"y":20,"z":10}}'
      );
    });

    it("rejects non-integer floating-point numbers", () => {
      expect(() => canonicalJson({ weightKg: 100.5 })).to.throw(
        /non-integer number/
      );
    });

    it("rejects NaN", () => {
      expect(() => canonicalJson({ val: NaN })).to.throw(/NaN is not permitted/);
    });

    it("rejects Infinity and -Infinity", () => {
      expect(() => canonicalJson({ val: Infinity })).to.throw(
        /Infinity is not permitted/
      );
      expect(() => canonicalJson({ val: -Infinity })).to.throw(
        /Infinity is not permitted/
      );
    });

    it("rejects undefined values", () => {
      expect(() => canonicalJson(undefined)).to.throw(
        /undefined is not permitted/
      );
      expect(() => canonicalJson({ field: undefined })).to.throw(
        /undefined is not permitted/
      );
    });

    it("rejects functions and symbols", () => {
      expect(() => canonicalJson({ fn: () => {} })).to.throw(
        /functions are not permitted/
      );
      expect(() => canonicalJson({ sym: Symbol("test") })).to.throw(
        /symbols are not permitted/
      );
    });

  });

  describe("Salt Generation", () => {

    it("generates a 0x-prefixed 16-byte (34-character) hex string", () => {
      const salt = newSalt();
      expect(salt).to.match(/^0x[0-9a-f]{32}$/);
      expect(salt.length).to.equal(34);
    });

    it("generates distinct salts on subsequent calls", () => {
      const salt1 = newSalt();
      const salt2 = newSalt();
      expect(salt1).to.not.equal(salt2);
    });

  });

  describe("Record & Confirmation Hashing", () => {

    const samplePayload: HarvestPayload = {
      schemaVersion: 1,
      eventType: "HARVEST_LOGGED",
      batchId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      hotspotRef: "0x2222222222222222222222222222222222222222222222222222222222222222",
      quantityKg: 1000,
      harvestedAt: 1729000000,
      region: "Winam Gulf",
      source: "ziwaclear-v1"
    };

    it("computes deterministic 66-character 0x-prefixed keccak256 hashes", () => {
      const salt = "0x1234567890abcdef1234567890abcdef";
      const hash1 = hashRecord(samplePayload, salt);
      const hash2 = hashRecord(samplePayload, salt);

      expect(hash1).to.match(/^0x[0-9a-fA-F]{64}$/);
      expect(hash1.length).to.equal(66);
      expect(hash1).to.equal(hash2);
    });

    it("changes hash when salt changes", () => {
      const saltA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const saltB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

      const hashA = hashRecord(samplePayload, saltA);
      const hashB = hashRecord(samplePayload, saltB);

      expect(hashA).to.not.equal(hashB);
    });

    it("detects tampering when any payload field changes (e.g. quantityKg)", () => {
      const salt = "0x1234567890abcdef1234567890abcdef";
      const tamperedPayload: HarvestPayload = {
        ...samplePayload,
        quantityKg: 1001 // altered by 1 kg
      };

      const originalHash = hashRecord(samplePayload, salt);
      const tamperedHash = hashRecord(tamperedPayload, salt);

      expect(originalHash).to.not.equal(tamperedHash);
    });

    it("detects tampering when metadata changes (e.g. harvestedAt timestamp)", () => {
      const salt = "0x1234567890abcdef1234567890abcdef";
      const tamperedPayload: HarvestPayload = {
        ...samplePayload,
        harvestedAt: 1729000001
      };

      const originalHash = hashRecord(samplePayload, salt);
      const tamperedHash = hashRecord(tamperedPayload, salt);

      expect(originalHash).to.not.equal(tamperedHash);
    });

    it("hashes settlement confirmation codes deterministically", () => {
      const salt = "0x1234567890abcdef1234567890abcdef";
      const code = "YES 4821";

      const confHash1 = hashConfirmation(code, salt);
      const confHash2 = hashConfirmation(code, salt);

      expect(confHash1).to.match(/^0x[0-9a-fA-F]{64}$/);
      expect(confHash1.length).to.equal(66);
      expect(confHash1).to.equal(confHash2);

      const wrongCodeHash = hashConfirmation("YES 4822", salt);
      expect(confHash1).to.not.equal(wrongCodeHash);
    });

  });

  describe("Pseudonym Derivation (HMAC-SHA256)", () => {

    const secret = "super-secret-server-key-2026";
    const groupId = "harvester-group-kisumu-01";
    const batchId1 = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const batchId2 = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    it("is deterministic for identical inputs", () => {
      const p1 = derivePseudonym(secret, groupId, batchId1);
      const p2 = derivePseudonym(secret, groupId, batchId1);

      expect(p1).to.equal(p2);
      expect(p1).to.match(/^0x[0-9a-f]{64}$/);
      expect(p1.length).to.equal(66);
    });

    it("produces unlinkable pseudonyms for different batches of the same harvester group", () => {
      const p1 = derivePseudonym(secret, groupId, batchId1);
      const p2 = derivePseudonym(secret, groupId, batchId2);

      expect(p1).to.not.equal(p2);
    });

    it("produces different pseudonyms for different secrets", () => {
      const p1 = derivePseudonym(secret, groupId, batchId1);
      const p2 = derivePseudonym("another-secret-key-1234", groupId, batchId1);

      expect(p1).to.not.equal(p2);
    });

    it("requires secret, groupId, and batchId", () => {
      expect(() => derivePseudonym("", groupId, batchId1)).to.throw(/secret is required/);
      expect(() => derivePseudonym(secret, "", batchId1)).to.throw(/groupId is required/);
      expect(() => derivePseudonym(secret, groupId, "")).to.throw(/batchId is required/);
    });

  });

});
