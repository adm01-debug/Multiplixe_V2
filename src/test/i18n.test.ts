import { describe, it, expect, beforeEach } from "vitest";
import { t, getLocale, setLocale } from "@/lib/i18n";

describe("i18n", () => {
  beforeEach(() => setLocale("pt-BR"));

  it("traduz chaves em pt-BR por padrão", () => {
    expect(t("nav.dashboard")).toBe("Dashboard");
    expect(t("nav.catalog")).toBe("Catálogo");
    expect(t("common.save")).toBe("Salvar");
  });

  it("troca para inglês via setLocale", () => {
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("nav.catalog")).toBe("Catalog");
    expect(t("common.save")).toBe("Save");
  });

  it("retorna o path quando a chave não existe", () => {
    // @ts-expect-error path inválido proposital
    expect(t("nav.inexistente")).toBe("nav.inexistente");
  });

  it("persiste locale em localStorage", () => {
    setLocale("en");
    expect(localStorage.getItem("app.locale")).toBe("en");
    setLocale("pt-BR");
    expect(localStorage.getItem("app.locale")).toBe("pt-BR");
  });
});
