import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

const Boom = () => {
  throw new Error('Falha proposital');
};

describe('ErrorBoundary', () => {
  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <p>Conteúdo OK</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Conteúdo OK')).toBeInTheDocument();
  });

  it('exibe mensagem de fallback quando children lançam erro', () => {
    const original = console.error;
    console.error = () => undefined;
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Falha proposital')).toBeInTheDocument();
    console.error = original;
  });

  it('exibe fallback customizado quando fornecido', () => {
    const original = console.error;
    console.error = () => undefined;
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    console.error = original;
  });
});
