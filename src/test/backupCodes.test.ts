import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  QTD_CODIGOS_BACKUP,
  TAMANHO_CODIGO_BACKUP,
  codigoBackupValido,
  gerarCodigoBackup,
  hashCodigoBackup,
  indiceCodigoBackup,
  normalizarCodigoBackup,
} from '@/lib/backupCodes';

const bytes = (semente: number) => new Uint8Array(TAMANHO_CODIGO_BACKUP).map((_, i) => (semente + i * 7) % 256);

describe('codigos de backup de MFA', () => {
  it('gera 8 caracteres do alfabeto sem ambiguidade, em dois grupos', () => {
    const codigo = gerarCodigoBackup(bytes(3));
    expect(codigo).toMatch(/^[A-NP-Z2-9]{4}-[A-NP-Z2-9]{4}$/);
    expect(normalizarCodigoBackup(codigo)).toHaveLength(TAMANHO_CODIGO_BACKUP);
  });

  it('nao repete codigo para bytes diferentes', () => {
    expect(gerarCodigoBackup(bytes(1))).not.toBe(gerarCodigoBackup(bytes(9)));
  });

  it('normaliza o que o usuario digita', () => {
    expect(normalizarCodigoBackup(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(normalizarCodigoBackup('ABCD EFGH')).toBe('ABCDEFGH');
  });

  it('so aceita codigo com 8 caracteres', () => {
    expect(codigoBackupValido('ABCD-EFGH')).toBe(true);
    expect(codigoBackupValido('abcde fgh')).toBe(true);
    expect(codigoBackupValido('ABCD-EFG')).toBe(false);
    expect(codigoBackupValido('ABCD-EFGHI')).toBe(false);
    expect(codigoBackupValido('')).toBe(false);
  });

  it('o hash e SHA-256 do codigo normalizado, igual nas duas grafias', async () => {
    const esperado = createHash('sha256').update('ABCDEFGH').digest('hex');
    expect(await hashCodigoBackup('ABCD-EFGH')).toBe(esperado);
    expect(await hashCodigoBackup('abcdefgh')).toBe(esperado);
  });

  it('acha o hash na lista e nao confunde codigo errado', async () => {
    const hashes = await Promise.all(['ABCD-EFGH', 'JKLM-NPQR'].map(hashCodigoBackup));
    expect(indiceCodigoBackup(await hashCodigoBackup('jklm-npqr'), hashes)).toBe(1);
    expect(indiceCodigoBackup(await hashCodigoBackup('ABCD-EFGX'), hashes)).toBe(-1);
    expect(hashes).toHaveLength(2);
    expect(QTD_CODIGOS_BACKUP).toBe(10);
  });
});