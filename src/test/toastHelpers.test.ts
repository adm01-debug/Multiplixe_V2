import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { toastSuccess, toastError, toastInfo, toastWarning } from '@/lib/toastHelpers';

describe('toastHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toastSuccess chama toast.success com duração padrão de 4000', () => {
    toastSuccess('Salvo!');
    expect(toast.success).toHaveBeenCalledWith('Salvo!', expect.objectContaining({ duration: 4000 }));
  });

  it('toastError chama toast.error com duração padrão de 6000', () => {
    toastError('Falhou', { description: 'detalhe' });
    expect(toast.error).toHaveBeenCalledWith(
      'Falhou',
      expect.objectContaining({ description: 'detalhe', duration: 6000 })
    );
  });

  it('toastInfo chama toast.info', () => {
    toastInfo('Info');
    expect(toast.info).toHaveBeenCalledWith('Info', expect.objectContaining({ duration: 4000 }));
  });

  it('toastWarning chama toast.warning com duração padrão de 5000', () => {
    toastWarning('Atenção');
    expect(toast.warning).toHaveBeenCalledWith('Atenção', expect.objectContaining({ duration: 5000 }));
  });

  it('respeita duração customizada', () => {
    toastSuccess('Custom', { duration: 1234 });
    expect(toast.success).toHaveBeenCalledWith('Custom', expect.objectContaining({ duration: 1234 }));
  });

  it('passa action quando fornecido', () => {
    const action = { label: 'Desfazer', onClick: () => undefined };
    toastSuccess('OK', { action });
    expect(toast.success).toHaveBeenCalledWith('OK', expect.objectContaining({ action }));
  });
});
