import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

vi.stubEnv("DATABASE_URL", "postgresql://x:x@localhost:5432/x");
const TEST_JWT_SECRET = "supersecretjwtkeytestminimumthirtytwocharacterslong";
vi.stubEnv("JWT_SECRET", TEST_JWT_SECRET);
vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/test-soul-body");

const { isEbookFormat, resolveBookPdfFile, ebooksDir } = await import("../src/services/ebookAccess.service.js");

describe("E-Book Access Service Unit Tests", () => {
  describe("isEbookFormat", () => {
    it("correctly identifies digital formats", () => {
      expect(isEbookFormat("E-Book")).toBe(true);
      expect(isEbookFormat("ebook")).toBe(true);
      expect(isEbookFormat("Kindle Edition")).toBe(true);
      expect(isEbookFormat("digital")).toBe(true);
      expect(isEbookFormat("Soft copy PDF")).toBe(true);
    });

    it("correctly rejects physical formats and empty values", () => {
      expect(isEbookFormat("Hardcover")).toBe(false);
      expect(isEbookFormat("Paperback")).toBe(false);
      expect(isEbookFormat("")).toBe(false);
      expect(isEbookFormat(undefined)).toBe(false);
    });
  });

  describe("resolveBookPdfFile", () => {
    const testPdfName = "unit_test_sample.pdf";
    const testPdfPath = path.join(ebooksDir, testPdfName);

    beforeEach(() => {
      if (fs.existsSync(testPdfPath)) {
        try { fs.unlinkSync(testPdfPath); } catch {}
      }
    });

    it("returns exists: false when PDF file does not exist on disk", () => {
      const res = resolveBookPdfFile("/uploads/ebooks/non_existent_file.pdf", { slug: "non-existent" });
      expect(res.exists).toBe(false);
    });

    it("returns exists: true when PDF file is physically present in ebooks directory", () => {
      fs.writeFileSync(testPdfPath, "%PDF-1.4 dummy unit test content");
      try {
        const res = resolveBookPdfFile(`/uploads/ebooks/${testPdfName}`, { slug: "unit-test-sample" });
        expect(res.exists).toBe(true);
        expect(res.filename).toBe(testPdfName);
        expect(res.filePath).toBe(testPdfPath);
      } finally {
        if (fs.existsSync(testPdfPath)) {
          fs.unlinkSync(testPdfPath);
        }
      }
    });
  });

  describe("Customer & Admin Authentication Token Validation", () => {
    it("generates valid customer token and decodes verified email", () => {
      const customerToken = jwt.sign(
        { customerId: "cust_12345", email: "reader@example.com" },
        TEST_JWT_SECRET,
        { expiresIn: "7d" }
      );
      const decoded = jwt.verify(customerToken, TEST_JWT_SECRET) as any;
      expect(decoded.email).toBe("reader@example.com");
      expect(decoded.customerId).toBe("cust_12345");
    });

    it("rejects invalid or tampered tokens", () => {
      expect(() => {
        jwt.verify("tampered.token.here", TEST_JWT_SECRET);
      }).toThrow();
    });
  });
});
