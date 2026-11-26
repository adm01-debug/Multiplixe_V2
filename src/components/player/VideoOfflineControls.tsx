import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { formatoTamanho, type VideoBaixado } from '@/lib/videoOffline';
import { CheckCircle2, CloudOff, Download, HardDriveDownload, Loader2, Trash2, X } from 'lucide-react';

interface VideoOfflineControlsProps {
  online: boolean;
  baixando: boolean;
  percentual: number | null;
  baixado: VideoBaixado | null;
  podeBaixar: boolean;
  aoBaixar: () => void;
  aoCancelar: () => void;
  aoRemover: () => void;
  totalBaixadas: number;
  tamanhoTotal: string;
  aoLimparTudo: () => void;
}

export const VideoOfflineControls = ({
  online,
  baixando,
  percentual,
  baixado,
  podeBaixar,
  aoBaixar,
  aoCancelar,
  aoRemover,
  totalBaixadas,
  tamanhoTotal,
  aoLimparTudo,
}: VideoOfflineControlsProps) => {
  const { t } = useT();

  if (!podeBaixar) return null;

  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/50 p-4"
      aria-live="polite"
    >
      {baixando ? (
        <>
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            {t('offline.baixando')}
            {percentual !== null && <span className="font-semibold">{percentual}%</span>}
          </p>
          <Button variant="outline" size="sm" onClick={aoCancelar} className="gap-2">
            <X className="h-4 w-4" aria-hidden="true" />
            {t('offline.cancelar')}
          </Button>
        </>
      ) : baixado ? (
        <>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">{t('offline.disponivel')}</span>
            <span className="text-xs text-muted-foreground">{formatoTamanho(baixado.tamanho_bytes)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={aoRemover} className="gap-2 text-muted-foreground">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('offline.remover')}
          </Button>
        </>
      ) : !online ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CloudOff className="h-4 w-4" aria-hidden="true" />
          {t('offline.semConexao')}
        </p>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-foreground">{t('offline.titulo')}</p>
            <p className="text-xs text-muted-foreground">{t('offline.dica')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={aoBaixar} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('offline.baixar')}
          </Button>
        </>
      )}
      {totalBaixadas > 0 && (
        <p className="flex w-full flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <HardDriveDownload className="h-3.5 w-3.5" aria-hidden="true" />
          {t('offline.armazenado')}: {totalBaixadas} · {tamanhoTotal}
          <button
            type="button"
            onClick={aoLimparTudo}
            className="ml-auto underline underline-offset-4 hover:text-foreground"
          >
            {t('offline.limpar')}
          </button>
        </p>
      )}
    </div>
  );
};

export default VideoOfflineControls;