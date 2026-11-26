import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LazyImage from "@/components/LazyImage";

describe("LazyImage acessibilidade", () => {
  it("expõe o texto alternativo na imagem carregada", () => {
    render(<LazyImage src="/foto.jpg" alt="Curso de vendas" eager />);
    expect(screen.getByAltText("Curso de vendas")).toBeInTheDocument();
  });

  it("marca o placeholder de carregamento como decorativo", () => {
    const { container } = render(<LazyImage src="/foto.jpg" alt="Curso de vendas" eager />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("mantém o texto alternativo quando a imagem falha", () => {
    render(<LazyImage src="/quebrada.jpg" alt="Curso de vendas" eager />);
    fireEvent.error(screen.getByAltText("Curso de vendas"));
    const fallback = screen.getByRole("img", { name: "Curso de vendas" });
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByAltText("Curso de vendas")).not.toBeInTheDocument();
  });

  it("não insere a imagem no DOM antes de entrar na viewport", () => {
    render(<LazyImage src="/foto.jpg" alt="Curso de vendas" />);
    expect(screen.queryByAltText("Curso de vendas")).not.toBeInTheDocument();
  });
});