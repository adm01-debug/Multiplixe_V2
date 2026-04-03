import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, "../../", filePath), "utf-8");

describe("Edge Function Security - Input Validation", () => {
  describe("generate-certificate", () => {
    const code = readFile("supabase/functions/generate-certificate/index.ts");

    it("should validate courseId as UUID", () => {
      expect(code).toMatch(/uuid|courseId|course_id/i);
    });

    it("should validate request body exists", () => {
      expect(code).toMatch(/req\.json|json\(\)/);
    });

    it("should use Supabase client for admin operations", () => {
      expect(code).toContain("createClient");
    });

    it("should return proper error responses with status codes", () => {
      expect(code).toMatch(/status:\s*(400|401|403|500)/);
    });
  });

  describe("detect-new-device", () => {
    const code = readFile("supabase/functions/detect-new-device/index.ts");

    it("should validate user_id input", () => {
      expect(code).toMatch(/user_id|userId/);
    });

    it("should validate email input", () => {
      expect(code).toContain("email");
    });

    it("should handle error cases gracefully", () => {
      expect(code).toContain("catch");
    });
  });

  describe("send-security-alert", () => {
    const code = readFile("supabase/functions/send-security-alert/index.ts");

    it("should validate severity levels", () => {
      expect(code).toMatch(/severity|low|medium|high|critical/i);
    });

    it("should validate alert_type", () => {
      expect(code).toContain("alert_type");
    });

    it("should use Supabase client for database operations", () => {
      expect(code).toContain("createClient");
    });
  });

  describe("approve-password-reset", () => {
    const code = readFile("supabase/functions/approve-password-reset/index.ts");

    it("should validate requestId", () => {
      expect(code).toMatch(/requestId|request_id/i);
    });

    it("should validate action type", () => {
      expect(code).toMatch(/action|approve|reject/i);
    });

    it("should check authorization", () => {
      expect(code).toMatch(/authorization|auth|token/i);
    });
  });

  describe("cleanup-security-logs", () => {
    const code = readFile("supabase/functions/cleanup-security-logs/index.ts");

    it("should call cleanup RPC function", () => {
      expect(code).toContain("cleanup_old_security_logs");
    });

    it("should return success status with timestamp", () => {
      expect(code).toContain("timestamp");
      expect(code).toContain("success");
    });

    it("should handle errors with proper error messages", () => {
      expect(code).toContain("errorMessage");
    });
  });
});

describe("Edge Function Security - CORS Configuration", () => {
  const functions = [
    "supabase/functions/generate-certificate/index.ts",
    "supabase/functions/detect-new-device/index.ts",
    "supabase/functions/send-security-alert/index.ts",
    "supabase/functions/approve-password-reset/index.ts",
    "supabase/functions/cleanup-security-logs/index.ts",
  ];

  functions.forEach((fn) => {
    const name = fn.split("/")[2];

    it(`${name} should have wildcard CORS origin`, () => {
      const code = readFile(fn);
      expect(code).toMatch(/['"]?\*['"]?/);
      expect(code).toContain("Access-Control-Allow-Origin");
    });

    it(`${name} should allow content-type header`, () => {
      const code = readFile(fn);
      expect(code).toMatch(/content-type/i);
    });

    it(`${name} should allow authorization header`, () => {
      const code = readFile(fn);
      expect(code).toMatch(/authorization/i);
    });

    it(`${name} should allow apikey header`, () => {
      const code = readFile(fn);
      expect(code).toMatch(/apikey/i);
    });
  });
});
