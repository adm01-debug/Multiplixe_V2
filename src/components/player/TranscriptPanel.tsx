import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n';
import { formatChapterTime } from '@/lib/chapters';
import { filtrarTranscricao, indiceDaLinhaAtiva, parseTranscricao } from '@/lib/transcricao';

interface TranscriptPanelProps {
  transcript: string | null;
  currentSeconds: number;
  onSeek: (seconds: number) => void;
}

/** Transcricao da aula: destaca o trecho atual, permite buscar e pular para o ponto. */
export function TranscriptPanel({ transcript, currentSeconds, onSeek }: TranscriptPanelProps) {
  const { t } = useT();
  const [busca, setBusca] = useState('');
  const refLista = useRef<HTMLOListElement | null>(null);
  const refAtiva = useRef<HTMLLIElement | null>(null);

  const linhas = useMemo(() => parseTranscricao(transcript), [transcript]);
  const ativa = useMemo(() => indiceDaLinhaAtiva(linhas, currentSeconds), [linhas, currentSeconds]);
  const visiveis = useMemo(() => filtrarTranscricao(linhas, busca), [linhas, busca]);

  useEffect(() => {
    if (busca !== '') return;
    const lista = refLista.current;
    const elemento = refAtiva.current;
    if (!lista || !elemento) return;

    // a lista e position:relative, entao offsetTop do item ja e relativo a ela
    const topo = elemento.offsetTop;
    if (topo < lista.scrollTop || topo + elemento.offsetHeight > lista.scrollTop + lista.clientHeight) {
      lista.scrollTop = Math.max(0, topo - lista.clientHeight / 2 + elemento.offsetHeight / 2);
    }
  }, [ativa, busca]);

  if (linhas.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border/50 bg-card/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{t('transcript.title')}</h2>
        <span className="text-xs text-muted-foreground">({linhas.length})</span>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder={t('transcript.searchPlaceholder')}
          aria-label={t('transcript.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {visiveis.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('transcript.searchEmpty')}</p>
      ) : (
        <ol ref={refLista} className="relative max-h-72 space-y-0.5 overflow-y-auto pr-1">
          {visiveis.map(({ indice, linha }) => {
            const ativo = indice === ativa;
            return (
              <li key={`${indice}-${linha.seconds ?? 'sem-tempo'}`} ref={ativo ? refAtiva : undefined}>
                {linha.seconds === null ? (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">{linha.text}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSeek(linha.seconds as number)}
                    aria-current={ativo ? 'true' : undefined}
                    className={`flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-primary/10 ${ativo ? 'bg-primary/10' : ''}`}
                  >
                    <span className={`shrink-0 font-mono text-xs tabular-nums ${ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                      {formatChapterTime(linha.seconds)}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-foreground">{linha.text}</span>
                    {ativo && <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{t('transcript.now')}</span>}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
