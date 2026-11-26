export type NivelAutenticacao = 'aal1' | 'aal2' | null | undefined;

/**
 * O Supabase abre a sessão em aal1 e anuncia aal2 como próximo nível quando a
 * conta tem um fator TOTP verificado. Enquanto os dois níveis divergem, o login
 * está incompleto: falta o segundo fator.
 */
export function precisaSegundoFator(
  temUsuario: boolean,
  nivelAtual: NivelAutenticacao,
  proximoNivel: NivelAutenticacao,
): boolean {
  if (!temUsuario) return false;
  return nivelAtual === 'aal1' && proximoNivel === 'aal2';
}

export function codigoTotpValido(codigo: string): boolean {
  return /^\d{6}$/.test(codigo.trim());
}