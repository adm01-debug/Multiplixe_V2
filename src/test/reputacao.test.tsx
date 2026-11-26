import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { nivelDaReputacao } from "@/lib/reputacao";
import { ReputacaoCard } from "@/components/profile/ReputacaoCard";
import type { DetalheReputacao } from "@/hooks/useReputacao";

const detalhe = (valores: Partial<DetalheReputacao> = {}): DetalheReputacao => ({
  total: 0,
  votos_recebidos: 0,
  votos_negativos: 0,
  respostas: 0,
  respostas_aceitas: 0,
  ...valores,
});

describe("nivelDaReputacao", () => {
  it("comeca no nivel 1 sem pontos", () => {
    expect(nivelDaReputacao(0)).toMatchObject({ nivel: 1, minimo: 0, proximo_minimo: 25, faltam: 25, progresso: 0 });
  });

  it("calcula o progresso dentro da faixa", () => {
    expect(nivelDaReputacao(24)).toMatchObject({ nivel: 1, faltam: 1, progresso: 96 });
    expect(nivelDaReputacao(99)).toMatchObject({ nivel: 2, faltam: 1, progresso: 99 });
  });

  it("sobe de nivel exatamente na fronteira", () => {
    expect(nivelDaReputacao(25)).toMatchObject({ nivel: 2, faltam: 75, progresso: 0 });
    expect(nivelDaReputacao(100)).toMatchObject({ nivel: 3, faltam: 200, progresso: 0 });
    expect(nivelDaReputacao(299)).toMatchObject({ nivel: 3, faltam: 1, progresso: 100 });
  });

  it("para no nivel maximo sem estourar o progresso", () => {
    expect(nivelDaReputacao(300)).toMatchObject({ nivel: 4, faltam: 0, progresso: 100, proximo_minimo: null });
    expect(nivelDaReputacao(99999)).toMatchObject({ nivel: 4, faltam: 0, progresso: 100 });
  });

  it("trata valores invalidos como zero", () => {
    expect(nivelDaReputacao(-40)).toMatchObject({ nivel: 1, progresso: 0, faltam: 25 });
    expect(nivelDaReputacao(Number.NaN)).toMatchObject({ nivel: 1, progresso: 0 });
    expect(nivelDaReputacao(Number.POSITIVE_INFINITY)).toMatchObject({ nivel: 1, progresso: 0 });
    expect(nivelDaReputacao(12.9)).toMatchObject({ nivel: 1, faltam: 13 });
  });
});

describe("ReputacaoCard", () => {
  it("mostra total, nivel e quanto falta para subir", () => {
    render(<ReputacaoCard detalhe={detalhe({ total: 42, votos_recebidos: 5, respostas: 3, respostas_aceitas: 2, votos_negativos: 1 })} />);

    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.queryByText("42 pontos")).toBeNull();
    expect(screen.getByText(/2 - Colaborador/)).toBeTruthy();
    expect(screen.getByText(/Faltam 58 pontos/)).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByLabelText(/Progresso para o pr/)).toBeTruthy();
  });

  it("no zero ainda orienta como ganhar reputacao", () => {
    render(<ReputacaoCard detalhe={detalhe()} />);

    expect(screen.getByText(/Iniciante/)).toBeTruthy();
    expect(screen.getByText(/Faltam 25 pontos/)).toBeTruthy();
    expect(screen.getByText(/Como ganhar reputa/)).toBeTruthy();
  });

  it("avisa quando o nivel maximo foi alcancado", () => {
    render(<ReputacaoCard detalhe={detalhe({ total: 300 })} />);
    expect(screen.getByText(/n\u00edvel m\u00e1ximo/)).toBeTruthy();
  });

  it("mostra esqueleto enquanto carrega", () => {
    const { container } = render(<ReputacaoCard detalhe={null} carregando />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText(/Iniciante/)).toBeNull();
  });

  it("permite tentar de novo quando a consulta falha", () => {
    const recarregar = vi.fn();
    render(<ReputacaoCard detalhe={null} erro="falhou" recarregar={recarregar} />);

    fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
    expect(recarregar).toHaveBeenCalledTimes(1);
  });
});
