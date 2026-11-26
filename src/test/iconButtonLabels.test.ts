import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

function listTsx(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listTsx(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

/** Abre a tag que comeca em `start` respeitando chaves dentro de atributos. */
function readOpeningTag(src: string, start: number): string {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return src.slice(start, i + 1);
  }
  return "";
}

function findUnlabeledIconButtons(): string[] {
  const offenders: string[] = [];
  for (const file of listTsx(SRC)) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const re = /<(Button|button)\b/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(src))) {
      const tag = readOpeningTag(src, match.index);
      if (!tag) continue;
      if (!/size="icon"/.test(tag)) continue;
      if (/aria-label|aria-labelledby|title=/.test(tag)) continue;
      const line = src.slice(0, match.index).split("\n").length;
      offenders.push(`${rel}:${line}`);
    }
  }
  return offenders;
}

describe("Botões de ícone têm nome acessível", () => {
  it("nenhum <Button size=\"icon\"> fica sem aria-label", () => {
    expect(findUnlabeledIconButtons()).toEqual([]);
  });
});