import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import CacheIndicator from '@/components/ui/CacheIndicator';
import { TooltipProvider } from '@/components/ui/tooltip';

const renderIndicator = (ui: React.ReactElement) => render(<TooltipProvider>{ui}</TooltipProvider>);

const setOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
};

describe('CacheIndicator (UI-016)', () => {
  beforeEach(() => {
    setOnline(true);
  });

  afterEach(() => {
    setOnline(true);
  });

  it('mostra "Atualizado" quando os dados estao frescos', () => {
    renderIndicator(<CacheIndicator isStale={false} isFetching={false} showLabel />);
    expect(screen.getByText('Atualizado')).toBeTruthy();
  });

  it('mostra "Cache" quando os dados sao antigos', () => {
    renderIndicator(<CacheIndicator isStale isFetching={false} showLabel />);
    expect(screen.getByText('Cache')).toBeTruthy();
  });

  it('mostra "Atualizando..." durante o refetch', () => {
    renderIndicator(<CacheIndicator isStale={false} isFetching showLabel />);
    expect(screen.getByText('Atualizando...')).toBeTruthy();
  });

  it('avisa que esta offline e nao deixa recarregar', () => {
    const onRefresh = vi.fn();
    renderIndicator(<CacheIndicator isStale isFetching={false} showLabel onRefresh={onRefresh} />);
    setOnline(false);
    expect(screen.getByText('Offline')).toBeTruthy();
    act(() => {
      screen.getByRole('button').click();
    });
    expect(onRefresh).not.toHaveBeenCalled();
  });
});