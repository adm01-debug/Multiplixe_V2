/** Mostra o multiplicador de XP com ate duas casas, sem zeros sobrando: 1.995 -> "2", 1.5 -> "1.5". */
export const formatarMultiplicador = (valor: number) => {
  if (!Number.isFinite(valor)) return '1';
  const arredondado = Math.round(valor * 100) / 100;
  return String(arredondado);
};