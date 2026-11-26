import { ListVideo } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { chapterAt, formatChapterTime, type LessonChapter } from '@/lib/chapters';

interface ChaptersPanelProps {
  chapters: LessonChapter[];
  currentSeconds: number;
  onSeek: (seconds: number) => void;
}

/** Lista de capitulos do video; clicar pula para o trecho. */
export function ChaptersPanel({ chapters, currentSeconds, onSeek }: ChaptersPanelProps) {
  const { t } = useT();

  if (chapters.length === 0) return null;

  const atual = chapterAt(chapters, currentSeconds);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ListVideo className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{t('chapters.title')}</h2>
        <span className="text-xs text-muted-foreground">({chapters.length})</span>
      </div>

      <ol className="grid gap-1 sm:grid-cols-2">
        {chapters.map((capitulo) => {
          const ativo = atual?.start_seconds === capitulo.start_seconds;
          return (
            <li key={capitulo.start_seconds}>
              <button
                type="button"
                onClick={() => onSeek(capitulo.start_seconds)}
                aria-current={ativo ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary/10 ${ativo ? 'bg-primary/10' : ''}`}
              >
                <span className={`shrink-0 font-mono text-xs tabular-nums ${ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                  {formatChapterTime(capitulo.start_seconds)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{capitulo.title}</span>
                {ativo && <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{t('chapters.now')}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ChaptersPanel;
