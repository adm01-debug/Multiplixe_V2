/**
 * Gera uma imagem PNG (Blob) representando a conquista do usuário,
 * desenhada via Canvas API — sem dependências externas.
 */

interface GenerateShareImageParams {
  title: string;
  description: string;
  icon?: string;
  value?: number;
  type: "achievement" | "certificate" | "level" | "streak";
}

const GRADIENTS: Record<GenerateShareImageParams["type"], [string, string]> = {
  achievement: ["#f59e0b", "#f97316"],
  certificate: ["#10b981", "#14b8a6"],
  level: ["#6366f1", "#8b5cf6"],
  streak: ["#f43f5e", "#ec4899"],
};

const WIDTH = 1200;
const HEIGHT = 630;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lines++;
      if (lines >= maxLines - 1) {
        // último: trunca com reticências se ainda sobrar
        const remaining = words.slice(i).join(" ");
        let truncated = remaining;
        while (ctx.measureText(`${truncated}…`).width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated.length < remaining.length ? `${truncated}…` : remaining, x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export async function generateShareImage(
  params: GenerateShareImageParams,
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const [from, to] = GRADIENTS[params.type];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Decorative blurred circles (simulated with radial gradients)
  const circle = ctx.createRadialGradient(WIDTH - 100, 100, 20, WIDTH - 100, 100, 300);
  circle.addColorStop(0, "rgba(255,255,255,0.35)");
  circle.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = circle;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const circle2 = ctx.createRadialGradient(150, HEIGHT - 80, 20, 150, HEIGHT - 80, 280);
  circle2.addColorStop(0, "rgba(255,255,255,0.25)");
  circle2.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = circle2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Brand label
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 28px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Promo Brindes Academy", 80, 70);

  // Icon (emoji)
  ctx.font = "140px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji'";
  ctx.fillText(params.icon || "🏆", 80, 150);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px system-ui, -apple-system, 'Segoe UI', sans-serif";
  const afterTitleY = wrapText(ctx, params.title, 80, 320, WIDTH - 160, 76, 2);

  // Description
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "400 30px system-ui, -apple-system, 'Segoe UI', sans-serif";
  wrapText(ctx, params.description, 80, afterTitleY + 16, WIDTH - 160, 40, 2);

  // XP badge
  if (params.value) {
    const badgeText = `+${params.value} XP`;
    ctx.font = "700 32px system-ui, -apple-system, 'Segoe UI', sans-serif";
    const metrics = ctx.measureText(badgeText);
    const padX = 28;
    const padY = 14;
    const badgeW = metrics.width + padX * 2;
    const badgeH = 32 + padY * 2;
    const bx = 80;
    const by = HEIGHT - badgeH - 70;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    // rounded rect
    const r = 999;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + badgeW, by, bx + badgeW, by + badgeH, Math.min(r, badgeH / 2));
    ctx.arcTo(bx + badgeW, by + badgeH, bx, by + badgeH, Math.min(r, badgeH / 2));
    ctx.arcTo(bx, by + badgeH, bx, by, Math.min(r, badgeH / 2));
    ctx.arcTo(bx, by, bx + badgeW, by, Math.min(r, badgeH / 2));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(badgeText, bx + padX, by + padY);
  }

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type, lastModified: Date.now() });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}
