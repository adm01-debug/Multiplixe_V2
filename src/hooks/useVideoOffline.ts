import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import {
  DownloadCancelado,
  armazenamentoOffline,
  baixarAula,
  formatoTamanho,
  totalUsadoBytes,
  urlBaixavel,
  type ArmazenamentoOffline,
  type VideoBaixado,
} from '@/lib/videoOffline';

interface AulaOffline {
  id: string;
  titulo: string;
  videoUrl: string | null;
}

export const useVideoOffline = (
  aula: AulaOffline | null,
  armazenamento: ArmazenamentoOffline = armazenamentoOffline,
) => {
  const { t } = useT();
  const [videos, setVideos] = useState<VideoBaixado[]>([]);
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [baixando, setBaixando] = useState(false);
  const [percentual, setPercentual] = useState<number | null>(null);
  const [urlReproducao, setUrlReproducao] = useState<string | null>(null);
  const aborto = useRef<AbortController | null>(null);
  const urlObjeto = useRef<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setVideos(await armazenamento.listarVideos());
    } catch {
      setVideos([]);
    }
  }, [armazenamento]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  useEffect(() => {
    const aoVoltar = () => {
      setOnline(true);
      void recarregar();
    };
    const aoCair = () => setOnline(false);

    window.addEventListener('online', aoVoltar);
    window.addEventListener('offline', aoCair);

    return () => {
      window.removeEventListener('online', aoVoltar);
      window.removeEventListener('offline', aoCair);
    };
  }, [recarregar]);

  const baixado = aula ? videos.find((video) => video.lesson_id === aula.id) ?? null : null;

  useEffect(() => {
    let cancelado = false;

    const limparUrl = () => {
      if (urlObjeto.current) {
        URL.revokeObjectURL(urlObjeto.current);
        urlObjeto.current = null;
      }
    };

    if (!aula || !baixado) {
      limparUrl();
      setUrlReproducao(null);
      return limparUrl;
    }

    void armazenamento.obterVideo(aula.id).then((blob) => {
      if (cancelado || !blob) return;
      limparUrl();
      urlObjeto.current = URL.createObjectURL(blob);
      setUrlReproducao(urlObjeto.current);
    });

    return () => {
      cancelado = true;
      limparUrl();
    };
  }, [aula, baixado, armazenamento]);

  useEffect(() => () => aborto.current?.abort(), []);

  const baixar = useCallback(async () => {
    if (!aula || !urlBaixavel(aula.videoUrl) || baixando) return;

    const controle = new AbortController();
    aborto.current = controle;
    setBaixando(true);
    setPercentual(null);

    try {
      await baixarAula(
        { lessonId: aula.id, titulo: aula.titulo, url: aula.videoUrl as string },
        {
          armazenamento,
          sinal: controle.signal,
          aoProgredir: (_recebido: number, _total: number, valor: number | null) =>
            setPercentual(valor),
        },
      );
      await recarregar();
      toast.success(t('offline.baixado'));
    } catch (erro) {
      if (erro instanceof DownloadCancelado) toast.message(t('offline.cancelado'));
      else toast.error(`${t('offline.erro')} ${(erro as Error).message}`);
    } finally {
      aborto.current = null;
      setBaixando(false);
      setPercentual(null);
    }
  }, [aula, armazenamento, baixando, recarregar, t]);

  const cancelar = useCallback(() => {
    aborto.current?.abort();
  }, []);

  const remover = useCallback(async () => {
    if (!aula) return;

    await armazenamento.removerVideo(aula.id);
    await recarregar();
  }, [aula, armazenamento, recarregar]);

  const limpar = useCallback(async () => {
    await armazenamento.limparVideos();
    await recarregar();
  }, [armazenamento, recarregar]);

  return {
    videos,
    online,
    baixando,
    percentual,
    baixado,
    urlReproducao,
    baixar,
    cancelar,
    remover,
    limpar,
    podeBaixar: urlBaixavel(aula?.videoUrl),
    totalFormatado: formatoTamanho(totalUsadoBytes(videos)),
  };
};