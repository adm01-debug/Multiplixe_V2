import { describe, it, expect } from "vitest";

describe("Security & Data Validation", () => {
  describe("Email validation patterns", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("should accept valid emails", () => {
      expect(emailRegex.test("user@example.com")).toBe(true);
      expect(emailRegex.test("user.name@domain.co")).toBe(true);
      expect(emailRegex.test("user+tag@gmail.com")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(emailRegex.test("")).toBe(false);
      expect(emailRegex.test("user@")).toBe(false);
      expect(emailRegex.test("@domain.com")).toBe(false);
      expect(emailRegex.test("user domain.com")).toBe(false);
      expect(emailRegex.test("user@.com")).toBe(false);
    });
  });

  describe("Password strength validation", () => {
    const checks = {
      minLength: (p: string) => p.length >= 8,
      uppercase: (p: string) => /[A-Z]/.test(p),
      lowercase: (p: string) => /[a-z]/.test(p),
      number: (p: string) => /[0-9]/.test(p),
      special: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(p),
    };

    it("should reject short passwords", () => {
      expect(checks.minLength("Ab1!")).toBe(false);
    });

    it("should accept strong passwords", () => {
      const strong = "MyP@ssw0rd!";
      expect(checks.minLength(strong)).toBe(true);
      expect(checks.uppercase(strong)).toBe(true);
      expect(checks.lowercase(strong)).toBe(true);
      expect(checks.number(strong)).toBe(true);
      expect(checks.special(strong)).toBe(true);
    });

    it("should detect missing uppercase", () => {
      expect(checks.uppercase("password1!")).toBe(false);
    });

    it("should detect missing special character", () => {
      expect(checks.special("Password1")).toBe(false);
    });

    it("should detect missing number", () => {
      expect(checks.number("Password!")).toBe(false);
    });

    it("should handle unicode characters", () => {
      expect(checks.minLength("Pàsswörd1!")).toBe(true);
    });

    it("should handle empty password", () => {
      expect(checks.minLength("")).toBe(false);
      expect(checks.uppercase("")).toBe(false);
      expect(checks.lowercase("")).toBe(false);
      expect(checks.number("")).toBe(false);
      expect(checks.special("")).toBe(false);
    });
  });

  describe("XSS prevention via textContent", () => {
    const sanitize = (input: string) => {
      const div = document.createElement("div");
      div.textContent = input;
      return div.innerHTML;
    };

    it("should escape HTML tags", () => {
      const result = sanitize("<script>alert('xss')</script>");
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("should handle normal text unchanged", () => {
      expect(sanitize("Hello World")).toBe("Hello World");
    });

    it("should escape angle brackets in attributes", () => {
      const result = sanitize('<img src=x onerror="alert(1)">');
      expect(result).toContain("&lt;img");
    });
  });

  describe("UUID validation", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it("should accept valid UUIDs", () => {
      expect(uuidRegex.test("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(uuidRegex.test("not-a-uuid")).toBe(false);
      expect(uuidRegex.test("")).toBe(false);
      expect(uuidRegex.test("123e4567-e89b-12d3-a456")).toBe(false);
    });
  });

  describe("Slug validation", () => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    it("should accept valid slugs", () => {
      expect(slugRegex.test("my-course")).toBe(true);
      expect(slugRegex.test("react-avancado")).toBe(true);
      expect(slugRegex.test("course123")).toBe(true);
    });

    it("should reject invalid slugs", () => {
      expect(slugRegex.test("My Course")).toBe(false);
      expect(slugRegex.test("course_name")).toBe(false);
      expect(slugRegex.test("")).toBe(false);
      expect(slugRegex.test("-start-with-dash")).toBe(false);
    });
  });
});
