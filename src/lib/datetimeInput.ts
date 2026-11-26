/**
 * Formata um instante para o value de um input `datetime-local`, que o navegador interpreta como
 * hora local. Usar toISOString direto entregava a hora UTC e o formulario salvava a janela
 * deslocada quando o admin editava o registro.
 *
 * @param offsetMinutos deslocamento em minutos como o de `Date#getTimezoneOffset` (UTC-3 = 180).
 */
export const paraInputLocal = (
  valor: string | Date,
  offsetMinutos: number = new Date().getTimezoneOffset(),
) => {
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  const local = new Date(data.getTime() - offsetMinutos * 60000);
  return local.toISOString().slice(0, 16);
};