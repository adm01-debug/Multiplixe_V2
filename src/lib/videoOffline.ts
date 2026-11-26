/**
 * Cache local de aulas em vídeo (IndexedDB) e fila de progresso pendente.
 * O armazenamento é injetável para permitir teste sem IndexedDB.
 */

export interface VideoBaixado {
  lesson_id: string;
  titulo: string;
  url: string;
  tamanho_bytes: number;
  baixado_em: string;
}

export interface RegistroProgresso {
  user_id: string;
  lesson_id: string;
  course_id: string;
  last_position_seconds: number;
  watched_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface ProgressoPendente {
  lesson_id: string;
  registro: RegistroProgresso;
  criado_em: string;
}

export interface ArmazenamentoOffline {
  salvarVideo: (registro: VideoBaixado, blob: Blob) => Promise<void>;
  obterVideo: (lessonId: string) => Promise<Blob | null>;
  listarVideos: () => Promise<VideoBaixado[]>;
  removerVideo: (lessonId: string) => Promise<void>;
  limparVideos: () => Promise<void>;
  guardarProgresso: (registro: RegistroProgresso) => Promise<void>;
  listarProgresso: () => Promise<ProgressoPendente[]>;
  removerProgresso: (lessonId: string) => Promise<void>;
}

/** Limite de uso do aparelho: acima disso o download é recusado com aviso. */
export const LIMITE_BYTES = 400 * 1024 * 1024;

const NOME_BANCO = 'multiplixe-offline';
const VERSAO_BANCO = 1;
const LOJA_VIDEOS = 'videos';
const LOJA_PROGRESSO = 'progresso';

const promessa = <T>(requisicao: IDBRequest<T>) =>
  new Promise<T>((resolver, rejeitar) => {
    requisicao.onsuccess = () => resolver(requisicao.result);
    requisicao.onerror = () => rejeitar(requisicao.error);
  });

const abrirBanco = (): Promise<IDBDatabase> =>
  new Promise((resolver, rejeitar) => {
    const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;
      if (!banco.objectStoreNames.contains(LOJA_VIDEOS)) {
        banco.createObjectStore(LOJA_VIDEOS, { keyPath: 'lesson_id' });
      }
      if (!banco.objectStoreNames.contains(LOJA_PROGRESSO)) {
        banco.createObjectStore(LOJA_PROGRESSO, { keyPath: 'lesson_id' });
      }
    };
    requisicao.onsuccess = () => resolver(requisicao.result);
    requisicao.onerror = () => rejeitar(requisicao.error);
  });

const comLoja = async <T>(
  loja: string,
  modo: IDBTransactionMode,
  acao: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const banco = await abrirBanco();
  try {
    const transacao = banco.transaction(loja, modo);
    const resultado = await acao(transacao.objectStore(loja));
    await new Promise<void>((resolver, rejeitar) => {
      transacao.oncomplete = () => resolver();
      transacao.onerror = () => rejeitar(transacao.error);
      transacao.onabort = () => rejeitar(transacao.error);
    });
    return resultado;
  } finally {
    banco.close();
  }
};

export const criarArmazenamentoIndexedDB = (): ArmazenamentoOffline => ({
  salvarVideo: (registro, blob) =>
    comLoja(LOJA_VIDEOS, 'readwrite', async (store) => {
      await promessa(store.put({ ...registro, blob }));
    }),
  obterVideo: async (lessonId) => {
    const bruto = await comLoja(LOJA_VIDEOS, 'readonly', (store) =>
      promessa(store.get(lessonId)),
    );
    return bruto && bruto.blob instanceof Blob ? bruto.blob : null;
  },
  listarVideos: async () => {
    const brutos = await comLoja(LOJA_VIDEOS, 'readonly', (store) =>
      promessa(store.getAll()),
    );

    return (brutos as Array<VideoBaixado & { blob?: unknown }>).map(
      ({ blob: _blob, ...registro }) => registro,
    );
  },
  removerVideo: (lessonId) =>
    comLoja(LOJA_VIDEOS, 'readwrite', async (store) => {
      await promessa(store.delete(lessonId));
    }),
  limparVideos: () =>
    comLoja(LOJA_VIDEOS, 'readwrite', async (store) => {
      await promessa(store.clear());
    }),
  guardarProgresso: (registro) =>
    comLoja(LOJA_PROGRESSO, 'readwrite', async (store) => {
      await promessa(
        store.put({
          lesson_id: registro.lesson_id,
          registro,
          criado_em: new Date().toISOString(),
        }),
      );
    }),
  listarProgresso: async () =>
    ((await comLoja(LOJA_PROGRESSO, 'readonly', (store) => promessa(store.getAll()))) ??
      []) as ProgressoPendente[],
  removerProgresso: (lessonId) =>
    comLoja(LOJA_PROGRESSO, 'readwrite', async (store) => {
      await promessa(store.delete(lessonId));
    }),
});

/** Implementação em memória: usada em teste e como fallback sem IndexedDB. */
export const criarArmazenamentoMemoria = (): ArmazenamentoOffline => {
  const videos = new Map<string, VideoBaixado & { blob: Blob }>();
  const progresso = new Map<string, ProgressoPendente>();

  return {
    salvarVideo: async (registro, blob) => {
      videos.set(registro.lesson_id, { ...registro, blob });
    },
    obterVideo: async (lessonId) => videos.get(lessonId)?.blob ?? null,
    listarVideos: async () =>
      [...videos.values()].map(({ blob: _blob, ...registro }) => registro),
    removerVideo: async (lessonId) => {
      videos.delete(lessonId);
    },
    limparVideos: async () => {
      videos.clear();
    },
    guardarProgresso: async (registro) => {
      progresso.set(registro.lesson_id, {
        lesson_id: registro.lesson_id,
        registro,
        criado_em: new Date().toISOString(),
      });
    },
    listarProgresso: async () =>
      [...progresso.values()].sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
    removerProgresso: async (lessonId) => {
      progresso.delete(lessonId);
    },
  };
};

const armazenamentoPadrao = (): ArmazenamentoOffline => {
  try {
    if (typeof indexedDB !== 'undefined') return criarArmazenamentoIndexedDB();
  } catch {
    /* navegador sem IndexedDB (modo privado antigo) */
  }

  return criarArmazenamentoMemoria();
};

export const armazenamentoOffline: ArmazenamentoOffline = armazenamentoPadrao();

export const formatoTamanho = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
};

export const calcularPercentual = (recebido: number, total: number) => {
  if (!Number.isFinite(total) || total <= 0) return null;

  return Math.min(100, Math.max(0, Math.round((recebido / total) * 100)));
};

/** Só dá para baixar vídeo hospedado em http(s); blob e data já são locais. */
export const urlBaixavel = (url: string | null | undefined) => {
  if (!url) return false;

  return /^https?:\/\//i.test(url);
};

export const espacoDisponivel = (usadoBytes: number, novoBytes: number) =>
  usadoBytes + novoBytes <= LIMITE_BYTES;

export class DownloadCancelado extends Error {
  constructor() {
    super('Download cancelado.');
    this.name = 'DownloadCancelado';
  }
}

interface OpcoesDownload {
  aoProgredir?: (recebido: number, total: number, percentual: number | null) => void;
  sinal?: AbortSignal;
  buscar?: typeof fetch;
}

export const baixarBlob = async (url: string, opcoes: OpcoesDownload = {}) => {
  const buscar = opcoes.buscar ?? fetch;
  const resposta = await buscar(url, { signal: opcoes.sinal, cache: 'force-cache' });
  if (!resposta.ok) throw new Error(`Falha ao baixar o vídeo (HTTP ${resposta.status}).`);

  const total = Number(resposta.headers.get('content-length') ?? 0);
  if (!resposta.body) {
    const blob = await resposta.blob();
    opcoes.aoProgredir?.(blob.size, blob.size, 100);
    return blob;
  }

  const leitor = resposta.body.getReader();
  const partes: BlobPart[] = [];
  let recebido = 0;

  for (;;) {
    if (opcoes.sinal?.aborted) {
      await leitor.cancel();
      throw new DownloadCancelado();
    }
    const { done, value } = await leitor.read();
    if (done) break;
    if (value) {
      partes.push(value);
      recebido += value.byteLength;
      opcoes.aoProgredir?.(recebido, total, calcularPercentual(recebido, total));
    }
  }

  return new Blob(partes, { type: resposta.headers.get('content-type') ?? 'video/mp4' });
};

export const baixarAula = async (
  { lessonId, titulo, url }: { lessonId: string; titulo: string; url: string },
  {
    armazenamento = armazenamentoOffline,
    aoProgredir,
    sinal,
    buscar,
    agora = () => new Date(),
  }: OpcoesDownload & { armazenamento?: ArmazenamentoOffline; agora?: () => Date } = {},
) => {
  const jaBaixados = await armazenamento.listarVideos();
  const usado = jaBaixados
    .filter((video) => video.lesson_id !== lessonId)
    .reduce((soma, video) => soma + video.tamanho_bytes, 0);

  const blob = await baixarBlob(url, {
    ...(aoProgredir ? { aoProgredir } : {}),
    ...(sinal ? { sinal } : {}),
    ...(buscar ? { buscar } : {}),
  });

  if (!espacoDisponivel(usado, blob.size)) {
    throw new Error(
      `Sem espaço no aparelho: o limite de ${formatoTamanho(LIMITE_BYTES)} para aulas offline já foi usado. Remova uma aula baixada para liberar.`,
    );
  }

  const registro: VideoBaixado = {
    lesson_id: lessonId,
    titulo,
    url,
    tamanho_bytes: blob.size,
    baixado_em: agora().toISOString(),
  };

  await armazenamento.salvarVideo(registro, blob);

  return registro;
};

export const sincronizarProgresso = async (
  enviar: (registro: RegistroProgresso) => Promise<boolean>,
  armazenamento: ArmazenamentoOffline = armazenamentoOffline,
) => {
  const pendentes = await armazenamento.listarProgresso();
  let enviados = 0;

  for (const pendente of pendentes) {
    const ok = await enviar(pendente.registro);
    if (!ok) break;
    await armazenamento.removerProgresso(pendente.lesson_id);
    enviados += 1;
  }

  return { enviados, restantes: pendentes.length - enviados };
};

export const totalUsadoBytes = (videos: VideoBaixado[]) =>
  videos.reduce((soma, video) => soma + video.tamanho_bytes, 0);