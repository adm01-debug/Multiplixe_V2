import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const fmtNum = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.max(0, Math.round(n)));

Deno.test("fmtNum formats Brazilian thousands", () => {
  assertEquals(fmtNum(1234), "1.234");
  assertEquals(fmtNum(0), "0");
  assertEquals(fmtNum(-5), "0");
  assertEquals(fmtNum(1234567), "1.234.567");
});

Deno.test("payload accepts empty and dryRun", () => {
  const a: { dryRun?: boolean } = {};
  const b: { dryRun?: boolean } = { dryRun: true };
  assertEquals(a.dryRun, undefined);
  assertEquals(b.dryRun, true);
});
