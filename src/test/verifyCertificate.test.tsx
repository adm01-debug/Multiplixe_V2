import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const chamadas = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (nome: string, args?: unknown) => chamadas.rpc(nome, args),
    from: () => ({
      select: () => ({
        eq: () => ({ order: async () => ({ data: [], error: null }) }),
      }),
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  },
}));

import { useCertificates } from "@/hooks/useCertificates";
import VerifyCertificate from "@/pages/VerifyCertificate";

const certCurso = {
  user_name: "Ana Souza",
  course_title: "React Avancado",
  issued_at: "2026-01-05T12:00:00Z",
  verification_code: "ABCD1234",
};

const certTrilha = {
  user_name: "Ana Souza",
  path_title: "Trilha DevOps",
  issued_at: "2026-02-10T12:00:00Z",
  verification_code: "LP-12345678",
};

const responder = (curso: unknown[], trilha: unknown[]) =>
  chamadas.rpc.mockImplementation((nome: string) => {
    if (nome === "verify_certificate_by_code") {
      return Promise.resolve({ data: curso, error: null });
    }
    if (nome === "verify_path_certificate_by_code") {
      return Promise.resolve({ data: trilha, error: null });
    }
    return Promise.resolve({ data: [], error: null });
  });

describe("verificacao publica de certificado", () => {
  beforeEach(() => {
    chamadas.rpc.mockReset();
  });

  it("valida certificado de curso pela RPC de curso", async () => {
    responder([certCurso], []);
    const { result } = renderHook(() => useCertificates());

    const cert = await result.current.verifyCertificate("abcd1234");

    expect(chamadas.rpc).toHaveBeenCalledWith("verify_certificate_by_code", {
      p_code: "abcd1234",
    });
    expect(cert?.kind).toBe("curso");
    expect(cert?.course_title).toBe("React Avancado");
  });

  it("cai para a RPC de trilha quando o codigo nao e de curso", async () => {
    responder([], [certTrilha]);
    const { result } = renderHook(() => useCertificates());

    const cert = await result.current.verifyCertificate("LP-12345678");

    expect(chamadas.rpc).toHaveBeenCalledWith("verify_path_certificate_by_code", {
      p_code: "LP-12345678",
    });
    expect(cert?.kind).toBe("trilha");
    expect(cert?.course_title).toBe("Trilha DevOps");
    expect(cert?.verification_code).toBe("LP-12345678");
  });

  it("devolve null quando o codigo nao existe em curso nem trilha", async () => {
    responder([], []);
    const { result } = renderHook(() => useCertificates());

    expect(await result.current.verifyCertificate("XPTO0000")).toBeNull();
  });

  it("aceita o codigo de trilha no campo de busca da tela", async () => {
    responder([], [certTrilha]);
    render(
      <MemoryRouter initialEntries={["/verificar-certificado?code=LP-12345678"]}>
        <VerifyCertificate />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("C\u00f3digo de verifica\u00e7\u00e3o do certificado")).toHaveAttribute(
      "maxlength",
      "16",
    );
    await waitFor(() => expect(screen.getByText(/Trilha Conclu[ií]da/)).toBeInTheDocument());
    expect(screen.getByText("Trilha DevOps")).toBeInTheDocument();
  });
});