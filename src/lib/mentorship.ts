/**
 * Regras do sistema de mentoria no cliente. Espelha os limites validados no
 * banco: profiles.mentor_topics/mentor_bio e mentorship_requests.topic/message.
 */

export type MentorshipStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export const MENTOR_MAX_TEMAS = 8;
export const MENTOR_TEMA_MAX_CARACTERES = 40;
export const MENTOR_BIO_MAX_CARACTERES = 1000;
export const PEDIDO_ASSUNTO_MIN = 3;
export const PEDIDO_ASSUNTO_MAX = 120;
export const PEDIDO_MENSAGEM_MIN = 10;
export const PEDIDO_MENSAGEM_MAX = 2000;

export const TEMAS_SUGERIDOS = [
  'Excel e planilhas',
  'Atendimento ao cliente',
  'Metas e indicadores',
  'Vendas',
  'Conhecimento de produtos',
  'Logística e estoque',
  'Liderança de equipe',
  'Sistemas internos',
];

const STATUS_ROTULO: Record<MentorshipStatus, string> = {
  pending: 'Aguardando resposta',
  accepted: 'Aceita',
  declined: 'Recusada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export const rotuloStatus = (status: MentorshipStatus): string => STATUS_ROTULO[status] ?? status;

const semAcento = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** "Excel, Metas; Excel" -> ["Excel", "Metas"] (sem repetir, com o limite do banco). */
export function parseTemas(entrada: string): string[] {
  const vistos = new Set<string>();
  const temas: string[] = [];

  for (const bruto of entrada.split(/[,;\n]/)) {
    const tema = bruto.trim().replace(/\s+/g, ' ').slice(0, MENTOR_TEMA_MAX_CARACTERES).trim();
    if (!tema) continue;
    const chave = semAcento(tema);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    temas.push(tema);
    if (temas.length === MENTOR_MAX_TEMAS) break;
  }

  return temas;
}

export const temasParaTexto = (temas: string[]): string => temas.join(', ');

export const iniciaisDe = (nome: string): string =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join('') || '?';

export function validarPedido(assunto: string, mensagem: string): string | null {
  const a = assunto.trim();
  const m = mensagem.trim();

  if (a.length < PEDIDO_ASSUNTO_MIN) return 'Escreva o assunto que você quer tratar (mínimo 3 letras).';
  if (a.length > PEDIDO_ASSUNTO_MAX) return `O assunto pode ter no máximo ${PEDIDO_ASSUNTO_MAX} caracteres.`;
  if (m.length < PEDIDO_MENSAGEM_MIN) return 'Conte em uma frase o que você precisa (mínimo 10 caracteres).';
  if (m.length > PEDIDO_MENSAGEM_MAX) return `A mensagem pode ter no máximo ${PEDIDO_MENSAGEM_MAX} caracteres.`;

  return null;
}

export function validarPerfilMentor(temas: string[], bio: string): string | null {
  if (temas.length === 0) return 'Escolha pelo menos um assunto em que você aceita ajudar.';
  if (temas.length > MENTOR_MAX_TEMAS) return `Escolha no máximo ${MENTOR_MAX_TEMAS} assuntos.`;
  if (bio.trim().length > MENTOR_BIO_MAX_CARACTERES) {
    return `A apresentação pode ter no máximo ${MENTOR_BIO_MAX_CARACTERES} caracteres.`;
  }
  return null;
}

/** Traduz os erros que o banco devolve ao criar um pedido de mentoria. */
export function mensagemErroPedido(codigo: string | undefined, mensagem: string): string {
  if (codigo === '23505') return 'Você já tem um pedido pendente com este mentor.';
  if (codigo === '42501') return 'Este colega não está aceitando mentoria agora. Escolha outro mentor.';
  return mensagem;
}