import { describe, it, expect } from "vitest";
import {
  CERTIFICATE_BRAND,
  absoluteCertificateUrl,
  buildCertificatePdf,
  buildLinkedInCertificationUrl,
  certificateFileName,
  formatCertificateDate,
  type CertificatePdfData,
} from "@/lib/certificatePdf";

const data: CertificatePdfData = {
  userName: "Maria Silva",
  courseTitle: "Tecnicas de Vendas",
  issuedAt: "2026-11-05T12:00:00.000Z",
  verificationCode: "ABC-123",
  verificationUrl: "/verificar-certificado?code=ABC-123",
};

describe("certificado em PDF", () => {
  it("gera um PDF de verdade com os dados do aluno", () => {
    const pdf = buildCertificatePdf(data).output();
    expect(pdf.startsWith("%PDF")).toBe(true);
    expect(pdf).toContain(CERTIFICATE_BRAND.toUpperCase());
    expect(pdf).toContain("CERTIFICADO");
    expect(pdf).toContain("Maria Silva");
    expect(pdf).toContain("Tecnicas de Vendas");
    expect(pdf).toContain("ABC-123");
  });

  it("nomeia o arquivo como .pdf, nao mais como .svg", () => {
    expect(certificateFileName("ABC-123")).toBe("certificado-ABC-123.pdf");
    expect(certificateFileName(" abc 123 ")).toBe("certificado-ABC-123.pdf");
    expect(certificateFileName("///")).toBe("certificado-multiplixe.pdf");
  });

  it("formata a data de emissao em pt-BR", () => {
    expect(formatCertificateDate("2026-11-05T12:00:00.000Z")).toBe("05 de novembro de 2026");
    expect(formatCertificateDate("nao-e-data")).toBe("");
  });
});

describe("compartilhamento no LinkedIn", () => {
  it("monta a URL de certificacao com codigo e curso", () => {
    const url = new URL(buildLinkedInCertificationUrl(data, "https://multiplixe-v2.vercel.app"));
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(url.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(url.searchParams.get("name")).toBe("Tecnicas de Vendas");
    expect(url.searchParams.get("organizationName")).toBe(CERTIFICATE_BRAND);
    expect(url.searchParams.get("certId")).toBe("ABC-123");
    expect(url.searchParams.get("certUrl")).toBe(
      "https://multiplixe-v2.vercel.app/verificar-certificado?code=ABC-123",
    );
    expect(url.searchParams.get("issueYear")).toBe("2026");
    expect(url.searchParams.get("issueMonth")).toBe("11");
  });

  it("mantem URL de verificacao absoluta como esta", () => {
    expect(absoluteCertificateUrl("https://exemplo.com/v?code=1", "https://base.com")).toBe(
      "https://exemplo.com/v?code=1",
    );
    expect(absoluteCertificateUrl("verificar?code=1", "https://base.com/")).toBe(
      "https://base.com/verificar?code=1",
    );
  });
});