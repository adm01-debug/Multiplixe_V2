const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TAMANHO_CODIGO_BACKUP = 8;
export const QTD_CODIGOS_BACKUP = 10;

/** Cada byte sorteado vira uma letra/digito do alfabeto sem caracteres ambiguos (I, O, 0, 1). */
export function gerarCodigoBackup(bytes: Uint8Array): string {
  const bruto = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
  return `${bruto.slice(0, 4)}-${bruto.slice(4, 8)}`;
}

/** O usuario digita com ou sem hifen, em maiusculas ou minusculas. */
export function normalizarCodigoBackup(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function codigoBackupValido(valor: string): boolean {
  return normalizarCodigoBackup(valor).length === TAMANHO_CODIGO_BACKUP;
}

/**
 * SHA-256 do codigo normalizado. O banco guarda so o hash: o codigo em texto puro
 * aparece uma unica vez, na hora de gerar.
 */
export async function hashCodigoBackup(valor: string): Promise<string> {
  const dados = new TextEncoder().encode(normalizarCodigoBackup(valor));
  const digest = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function indiceCodigoBackup(hash: string, hashes: readonly string[]): number {
  return hashes.indexOf(hash);
}