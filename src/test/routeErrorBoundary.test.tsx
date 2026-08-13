import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

vi.mock('@/lib/telemetry', () => ({
  trackRenderError: vi.fn(),
  trackTelemetry: vi.fn(),
}));

const Boom = () => {
  throw new Error('Erro de rota');
};

const renderWithRouter = (ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={['/teste']}>{ui}</MemoryRouter>);

describe('RouteErrorBoundary', () => {
  let originalError: typeof console.error;

  beforeEach(() => {
    originalError = console.error;
    console.error = () => undefined;
  });

  it('renderiza children quando não há erro', () => {
    renderWithRouter(
      <RouteErrorBoundary routeName="Teste">
        <p>Conteúdo da rota</p>
      </RouteErrorBoundary>
    );
    expect(screen.getByText('Conteúdo da rota')).toBeInTheDocument();
    console.error = originalError;
  });

  it('exibe fallback com nome da rota quando filho lança erro', () => {
    renderWithRouter(
      <RouteErrorBoundary routeName="Catálogo">
        <Boom />
      </RouteErrorBoundary>
    );
    expect(screen.getByText(/Erro em Catálogo/i)).toBeInTheDocument();
    expect(screen.getByText('Erro de rota')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
    console.error = originalError;
  });

  it('após 3 tentativas exibe botão "Recarregar página"', () => {
    renderWithRouter(
      <RouteErrorBoundary routeName="Teste">
        <Boom />
      </RouteErrorBoundary>
    );

    for (let i = 0; i < 3; i++) {
      const retry = screen.queryByRole('button', { name: /Tentar novamente/i });
      if (retry) fireEvent.click(retry);
    }

    expect(screen.getByRole('button', { name: /Recarregar página/i })).toBeInTheDocument();
    console.error = originalError;
  });
});
