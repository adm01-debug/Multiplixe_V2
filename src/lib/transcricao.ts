export interface LinhaTranscricao {
  /** Segundo de inicio do trecho, ou null quando a linha nao tem marcador de tempo. */
  seconds: number | null;
  text: string;
}

export interface TrechoEncontrado {
  indice: number;
  linha: LinhaTranscricao;
}

export const TRANSCRICAO_MAX_LINHAS = 3000;
export const TRANSCRICAO_MAX_CARACTERES_LINHA = 600;

// aceita "1:05", "[1:05]", "01:02:03" e separadores "-", "–", "—" antes do texto
const MARCADOR_TEMPO = /^\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?\s*(?:[-–—]\s*)?/;

export function parseTranscricao(valor: unknown): LinhaTranscricao[] {
  if (typeof valor !== 'string' || valor.trim() === '') return [];

  const linhas: LinhaTranscricao[] = [];
  for (const bruta of valor.split(/\r?\n/)) {
    if (linhas.length >= TRANSCRICAO_MAX_LINHAS) break;

    const texto = bruta.trim();
    if (!texto) continue;

    const marcador = texto.match(MARCADOR_TEMPO);
    if (!marcador) {
      linhas.push({ seconds: null, text: texto.slice(0, TRANSCRICAO_MAX_CARACTERES_LINHA) });
      continue;
    }

    const conteudo = texto.slice(marcador[0].length).trim().slice(0, TRANSCRICAO_MAX_CARACTERES_LINHA);
    // marcador sem texto nao serve para navegar: descarta
    if (!conteudo) continue;

    const seconds = marcador[3]
      ? Number(marcador[1]) * 3600 + Number(marcador[2]) * 60 + Number(marcador[3])
      : Number(marcador[1]) * 60 + Number(marcador[2]);
    linhas.push({ seconds, text: conteudo });
  }

  return linhas;
}

/** Indice do ultimo trecho com tempo menor ou igual ao instante atual (-1 se nenhum). */
export function indiceDaLinhaAtiva(linhas: LinhaTranscricao[], currentSeconds: number): number {
  if (!Number.isFinite(currentSeconds) || currentSeconds < 0) return -1;

  let ativo = -1;
  let melhorSegundo = -1;
  linhas.forEach((linha, indice) => {
    if (linha.seconds === null) return;
    if (linha.seconds <= currentSeconds && linha.seconds >= melhorSegundo) {
      melhorSegundo = linha.seconds;
      ativo = indice;
    }
  });
  return ativo;
}

/** Comparacao sem acento e sem caixa alta para a busca. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filtrarTranscricao(linhas: LinhaTranscricao[], termo: string): TrechoEncontrado[] {
  const alvo = normalizarBusca(termo);
  const encontrados: TrechoEncontrado[] = [];
  linhas.forEach((linha, indice) => {
    if (alvo === '' || normalizarBusca(linha.text).includes(alvo)) {
      encontrados.push({ indice, linha });
    }
  });
  return encontrados;
}
