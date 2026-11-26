/** Mostra o multiplicador de XP com ate duas casas, sem zeros sobrando: 1.995 -> "2", 1.5 -> "1.5". */
export const formatarMultiplicador = (valor: number) => {
  if (!Number.isFinite(valor)) return '1';
  const texto = String(valor);
  // O deslocamento por string evita o erro binario de valor * 100 (2.175 * 100 = 217.49999...),
  // assim o selo arredonda igual ao round() numeric do banco: 2.175 -> 2.18.
  const deslocado = texto.includes('e') || texto.includes('E') ? valor * 100 : Number(`${texto}e2`);
  const arredondado = Number(`${Math.round(deslocado)}e-2`);
  return String(Number.isFinite(arredondado) ? arredondado : Math.round(valor * 100) / 100);
};