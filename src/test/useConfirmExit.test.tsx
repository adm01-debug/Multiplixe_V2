import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirmExit } from '@/hooks/useConfirmExit';

describe('useConfirmExit', () => {
  it('navega direto quando não há progresso a proteger', () => {
    const { result } = renderHook(() => useConfirmExit({ enabled: false }));
    const navigate = vi.fn();

    act(() => result.current.confirmNavigation(navigate));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.showDialog).toBe(false);
  });

  it('pede confirmação antes de navegar quando há progresso', () => {
    const { result } = renderHook(() => useConfirmExit({ enabled: true }));
    const navigate = vi.fn();

    act(() => result.current.confirmNavigation(navigate));

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.showDialog).toBe(true);

    act(() => result.current.handleConfirm());
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(result.current.showDialog).toBe(false);
  });

  it('cancela a navegação sem executar a ação', () => {
    const { result } = renderHook(() => useConfirmExit({ enabled: true }));
    const navigate = vi.fn();

    act(() => result.current.confirmNavigation(navigate));
    act(() => result.current.handleCancel());

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.showDialog).toBe(false);
  });

  it('registra beforeunload apenas quando habilitado', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useConfirmExit({ enabled: true, message: 'Sair?' }));
    expect(add.mock.calls.some(([event]) => event === 'beforeunload')).toBe(true);

    unmount();
    expect(remove.mock.calls.some(([event]) => event === 'beforeunload')).toBe(true);

    add.mockClear();
    renderHook(() => useConfirmExit({ enabled: false }));
    expect(add.mock.calls.some(([event]) => event === 'beforeunload')).toBe(false);

    add.mockRestore();
    remove.mockRestore();
  });

  it('expõe a mensagem configurada', () => {
    const { result } = renderHook(() => useConfirmExit({ message: 'Perde o progresso' }));
    expect(result.current.message).toBe('Perde o progresso');
  });
});