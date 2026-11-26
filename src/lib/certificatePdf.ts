import jsPDF from "jspdf";

export const CERTIFICATE_BRAND = "Promo Brindes";

const NAVY: [number, number, number] = [17, 24, 39];
const GOLD: [number, number, number] = [176, 141, 55];
const MUTED: [number, number, number] = [90, 96, 110];

export interface CertificatePdfData {
  userName: string;
  courseTitle: string;
  issuedAt: string;
  verificationCode: string;
  verificationUrl: string;
}

const PAGE_WIDTH = 297;

export const formatCertificateDate = (issuedAt: string): string => {
  const date = new Date(issuedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

export const certificateFileName = (verificationCode: string): string => {
  const safe = verificationCode.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `certificado-${safe || "multiplixe"}.pdf`;
};

export const absoluteCertificateUrl = (verificationUrl: string, baseUrl?: string): string => {
  if (/^https?:\/\//i.test(verificationUrl)) return verificationUrl;
  const base = (baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");
  if (!base) return verificationUrl;
  return `${base}${verificationUrl.startsWith("/") ? "" : "/"}${verificationUrl}`;
};

export const buildLinkedInCertificationUrl = (
  data: CertificatePdfData,
  baseUrl?: string,
): string => {
  const issued = new Date(data.issuedAt);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: data.courseTitle,
    organizationName: CERTIFICATE_BRAND,
    certUrl: absoluteCertificateUrl(data.verificationUrl, baseUrl),
    certId: data.verificationCode,
  });
  if (!Number.isNaN(issued.getTime())) {
    params.set("issueYear", String(issued.getFullYear()));
    params.set("issueMonth", String(issued.getMonth() + 1));
  }
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
};

/**
 * Certificado em PDF A4 paisagem, tema claro para impressao.
 * jsPDF nao embute fonte customizada aqui de proposito: as fontes padrao
 * (Times/Helvetica) cobrem pt-BR e mantem o arquivo pequeno.
 */
export const buildCertificatePdf = (data: CertificatePdfData): jsPDF => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const center = PAGE_WIDTH / 2;

  // moldura dupla
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.1);
  doc.rect(9, 9, PAGE_WIDTH - 18, 192);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, PAGE_WIDTH - 26, 184);

  // marca
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text(CERTIFICATE_BRAND.toUpperCase(), center, 30, { align: "center", charSpace: 1.2 });
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(center - 22, 33.5, center + 22, 33.5);

  // titulo
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...NAVY);
  doc.text("CERTIFICADO DE CONCLUS\u00c3O", center, 58, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Certificamos que", center, 74, { align: "center" });

  // nome
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  const nameLines = doc.splitTextToSize(data.userName, 210) as string[];
  let y = 92;
  nameLines.forEach((line) => {
    doc.text(line, center, y, { align: "center" });
    y += 9;
  });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(68, y - 3, PAGE_WIDTH - 68, y - 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("concluiu com \u00eaxito o curso", center, y + 8, { align: "center" });

  // curso
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  const titleLines = doc.splitTextToSize(data.courseTitle, 200) as string[];
  let courseY = y + 20;
  titleLines.slice(0, 2).forEach((line) => {
    doc.text(line, center, courseY, { align: "center" });
    courseY += 7;
  });

  // data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const issued = formatCertificateDate(data.issuedAt);
  if (issued) {
    doc.text(`Emitido em ${issued}`, center, Math.max(courseY + 4, 150), { align: "center" });
  }

  // assinatura
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(40, 176, 95, 176);
  doc.setFontSize(8.5);
  doc.text("Coordena\u00e7\u00e3o de Ensino", 67.5, 181, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(PAGE_WIDTH - 95, 176, PAGE_WIDTH - 40, 176);
  doc.text("Emitido digitalmente", PAGE_WIDTH - 67.5, 181, { align: "center" });

  // rodape com verificacao
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`C\u00f3digo de verifica\u00e7\u00e3o: ${data.verificationCode}`, 22, 192);
  const verifyText = doc.splitTextToSize(`Verifique em: ${data.verificationUrl}`, 120) as string[];
  doc.text(verifyText[0], PAGE_WIDTH - 22, 192, { align: "right" });

  doc.setFontSize(7.5);
  doc.text(`${CERTIFICATE_BRAND} \u2022 Educa\u00e7\u00e3o Corporativa`, center, 198, { align: "center" });

  return doc;
};