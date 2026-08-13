import { describe, it, expect, beforeEach } from "vitest";
import { t, setLocale, getLocale } from "@/lib/i18n";

describe("i18n locale espanhol", () => {
  beforeEach(() => setLocale("pt-BR"));

  it("traduz nav para espanhol", () => {
    setLocale("es");
    expect(getLocale()).toBe("es");
    expect(t("nav.dashboard")).toBe("Panel");
    expect(t("nav.paths")).toBe("Rutas");
    expect(t("nav.assessments")).toBe("Evaluaciones");
  });

  it("traduz common para espanhol", () => {
    setLocale("es");
    expect(t("common.save")).toBe("Guardar");
    expect(t("common.delete")).toBe("Eliminar");
    expect(t("common.loading")).toBe("Cargando...");
  });

  it("traduz dashboard para espanhol", () => {
    setLocale("es");
    expect(t("dashboard.welcome")).toBe("Bienvenido");
    expect(t("dashboard.recommendedForYou")).toBe("Recomendado para ti");
  });

  it("alterna entre pt-BR, en e es", () => {
    setLocale("pt-BR");
    expect(t("common.cancel")).toBe("Cancelar");
    setLocale("en");
    expect(t("common.cancel")).toBe("Cancel");
    setLocale("es");
    expect(t("common.cancel")).toBe("Cancelar");
  });
});
