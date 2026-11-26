export interface LessonChapter {
  title: string;
  start_seconds: number;
}

export const CHAPTERS_VAZIO: LessonChapter[] = [];
export const CHAPTER_TITLE_MAX = 80;
export const CHAPTERS_MAX = 50;

const numero = (valor: unknown): number | null => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : null;
  }
  return null;
};

/**
 * Le o JSONB `lessons.chapters` (que pode vir de qualquer cliente) e devolve
 * uma lista limpa: titulo sem espacos, inicio inteiro e nao negativo, sem
 * repeticoes e em ordem de reproducao.
 */
export function parseChapters(valor: unknown): LessonChapter[] {
  if (!Array.isArray(valor)) return CHAPTERS_VAZIO;

  const inicios = new Set<number>();
  const capitulos: LessonChapter[] = [];

  for (const item of valor) {
    if (!item || typeof item !== 'object') continue;
    const bruto = item as { title?: unknown; start_seconds?: unknown };
    const titulo = typeof bruto.title === 'string' ? bruto.title.trim().slice(0, CHAPTER_TITLE_MAX) : '';
    const inicio = numero(bruto.start_seconds);
    if (!titulo || inicio === null || inicio < 0) continue;
    const segundo = Math.floor(inicio);
    if (inicios.has(segundo)) continue;
    inicios.add(segundo);
    capitulos.push({ title: titulo, start_seconds: segundo });
    if (capitulos.length >= CHAPTERS_MAX) break;
  }

  return capitulos.sort((a, b) => a.start_seconds - b.start_seconds);
}

/** m:ss ou h:mm:ss, para exibir no marcador e na lista. */
export function formatChapterTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const mm = horas > 0 ? String(minutos).padStart(2, '0') : String(minutos);
  return `${horas > 0 ? `${horas}:` : ''}${mm}:${String(segundos).padStart(2, '0')}`;
}

/** Capitulo em que o video esta agora (null antes do primeiro). */
export function chapterAt(capitulos: LessonChapter[], seconds: number): LessonChapter | null {
  let atual: LessonChapter | null = null;
  for (const capitulo of capitulos) {
    if (capitulo.start_seconds > seconds) break;
    atual = capitulo;
  }
  return atual;
}

/** Posicao do marcador na barra, em porcentagem (0 a 100). */
export function chapterPosition(chapter: LessonChapter, duration: number): number | null {
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return Math.min(100, Math.max(0, (chapter.start_seconds / duration) * 100));
}
