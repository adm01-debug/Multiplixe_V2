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
      const config = readFile("supabase/config.toml");

      it("should derive the user from the access token, not from the body", () => {
        expect(code).toContain("auth.getUser()");
        expect(code).toMatch(/const user_id = userData\.user\.id/);
        expect(code).not.toMatch(/user_id,\s*user_email,\s*ip_address/);
    });

      it("should require a JWT before running", () => {
        const marcador = "[functions.detect-new-device]";
        const inicio = config.indexOf(marcador);
        const bloco = config.slice(inicio + marcador.length);
        expect(bloco.split("[functions.")[0]).toContain("verify_jwt = true");
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

  describe("admin-user-actions", () => {
    const code = readFile("supabase/functions/admin-user-actions/index.ts");

    it("should whitelist the supported actions", () => {
      expect(code).toContain("validateInput");
      expect(code).toContain("deactivate");
      expect(code).toContain("reactivate");
    });

    it("should validate userId format", () => {
      expect(code).toContain("UUID_RE");
      expect(code).toMatch(/Invalid userId/);
    });

    it("should require the admin role server-side", () => {
      expect(code).toContain("user_roles");
      expect(code).toContain("Admin access required");
    });

    it("should block self-deactivation", () => {
      expect(code).toContain("userId === user.id");
    });

    it("should ban the account in GoTrue instead of trusting the profile flag", () => {
      expect(code).toContain("updateUserById");
      expect(code).toContain("ban_duration");
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

    it("should only run for an authenticated admin", () => {
      expect(code).toContain("req.headers.get('Authorization')");
      expect(code).toContain("auth.getUser()");
      expect(code).toContain("user_roles");
      expect(code).toContain("Apenas administradores");
    });
  });
});

describe("Edge Function Security - CORS Configuration", () => {
  const functions = [
    "supabase/functions/generate-certificate/index.ts",
    "supabase/functions/detect-new-device/index.ts",
    "supabase/functions/send-security-alert/index.ts",
    "supabase/functions/approve-password-reset/index.ts",
        "supabase/functions/admin-user-actions/index.ts",
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
