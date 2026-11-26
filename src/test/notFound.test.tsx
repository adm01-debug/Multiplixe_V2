import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "@/pages/NotFound";

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderNotFound = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/pagina-que-nao-existe"]}>
        <LocationDisplay />
        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path="/catalogo" element={<div>Catalogo</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("pagina 404 (SEO-005)", () => {
  it("explica o erro, oferece atalhos e pede para nao ser indexada", async () => {
    renderNotFound();

    expect(screen.getByRole("heading", { level: 1, name: "Não encontramos esta página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir para o início/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Meu dashboard/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "catálogo de cursos" })).toHaveAttribute("href", "/catalogo");

    await waitFor(() => {
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
      expect(document.title).toContain("Página não encontrada");
    });
  });

  it("leva a busca para o catalogo com o termo digitado", async () => {
    renderNotFound();

    fireEvent.change(screen.getByLabelText("Buscar cursos"), { target: { value: "vendas" } });
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/catalogo?q=vendas"),
    );
  });
});