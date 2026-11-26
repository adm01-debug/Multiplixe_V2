import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CertificateCard } from "@/components/CertificateCard";

const { downloadCertificate, generateCertificate } = vi.hoisted(() => ({
  downloadCertificate: vi.fn(),
  generateCertificate: vi.fn(async () => ({
    id: "c1",
    user_id: "u1",
    course_id: "course-1",
    verification_code: "ABC-123",
    issued_at: "2026-11-05T12:00:00.000Z",
    user_name: "Maria Silva",
    course_title: "Tecnicas de Vendas",
    verificationUrl: "/verificar-certificado?code=ABC-123",
    pdfBase64: "",
  })),
}));

vi.mock("@/hooks/useCertificates", () => ({
  useCertificates: () => ({ generateCertificate, downloadCertificate }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const certificate = {
  id: "c1",
  user_id: "u1",
  course_id: "course-1",
  verification_code: "ABC-123",
  issued_at: "2026-11-05T12:00:00.000Z",
  user_name: "Maria Silva",
  course_title: "Tecnicas de Vendas",
};

describe("CertificateCard", () => {
  it("baixa o certificado como PDF com os dados do certificado", async () => {
    render(<CertificateCard certificate={certificate} />);
    fireEvent.click(screen.getByRole("button", { name: /baixar/i }));
    await waitFor(() => expect(downloadCertificate).toHaveBeenCalledTimes(1));
    expect(downloadCertificate).toHaveBeenCalledWith({
      userName: "Maria Silva",
      courseTitle: "Tecnicas de Vendas",
      issuedAt: "2026-11-05T12:00:00.000Z",
      verificationCode: "ABC-123",
      verificationUrl: "/verificar-certificado?code=ABC-123",
    });
  });

  it("oferece adicionar o certificado ao LinkedIn", () => {
    render(<CertificateCard certificate={certificate} />);
    const link = screen.getByRole("link", { name: /adicionar certificado ao linkedin/i });
    expect(link.getAttribute("href")).toContain("linkedin.com/profile/add");
    expect(link.getAttribute("href")).toContain("certId=ABC-123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});