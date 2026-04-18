import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const confettiSpy = vi.fn();
// shapeFromText helper usado em fireAchievement
(confettiSpy as unknown as { shapeFromText: (opts: { text: string; scalar: number }) => unknown }).shapeFromText =
  vi.fn(({ text }) => ({ shape: text }));

vi.mock('canvas-confetti', () => ({
  default: confettiSpy,
}));

import { useConfetti } from '@/hooks/useConfetti';

describe('useConfetti', () => {
  beforeEach(() => {
    confettiSpy.mockClear();
  });

  it('fireLessonComplete dispara confetti com particleCount 80', async () => {
    const { result } = renderHook(() => useConfetti());
    await act(async () => {
      await result.current.fireLessonComplete();
    });
    expect(confettiSpy).toHaveBeenCalledWith(
      expect.objectContaining({ particleCount: 80, spread: 60 })
    );
  });

  it('fireXP dispara confetti com cores verdes', async () => {
    const { result } = renderHook(() => useConfetti());
    await act(async () => {
      await result.current.fireXP();
    });
    expect(confettiSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 40,
        colors: expect.arrayContaining(['#10B981']),
      })
    );
  });

  it('fireAchievement dispara confetti com shapes customizadas', async () => {
    const { result } = renderHook(() => useConfetti());
    await act(async () => {
      await result.current.fireAchievement();
    });
    expect(confettiSpy).toHaveBeenCalled();
    // Pelo menos uma chamada deve incluir shapes
    const calls = confettiSpy.mock.calls;
    const hasShapesCall = calls.some(
      ([opts]) => opts && Array.isArray((opts as { shapes?: unknown[] }).shapes)
    );
    expect(hasShapesCall).toBe(true);
  });

  it('fireConfetti("lesson") delega para fireLessonComplete', async () => {
    const { result } = renderHook(() => useConfetti());
    await act(async () => {
      result.current.fireConfetti('lesson');
      // aguardar microtasks do dynamic import mockado
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(confettiSpy).toHaveBeenCalled();
  });
});
