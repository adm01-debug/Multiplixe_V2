import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Gauge, PictureInPicture2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chapterPosition, formatChapterTime, type LessonChapter } from '@/lib/chapters';
import { t } from '@/lib/i18n';

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const getSpeedLabel = (rate: number) => {
  if (rate < 1) return 'Lento';
  if (rate === 1) return 'Normal';
  if (rate <= 1.5) return 'Rápido';
  return 'Turbo';
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  visible: boolean;
  chapters: LessonChapter[];
    isPiPSupported: boolean;
    isPiPActive: boolean;
  onTogglePlay: () => void;
  onSeek: (value: number[]) => void;
  onSkip: (seconds: number) => void;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
    onTogglePiP: () => void;
}

const VideoControls = ({
  isPlaying, currentTime, duration, volume, isMuted, playbackRate,
  isFullscreen, visible, chapters, onTogglePlay, onSeek, onSkip,
  onVolumeChange, onToggleMute, onPlaybackRateChange, onToggleFullscreen,
    isPiPSupported, isPiPActive, onTogglePiP,
}: VideoControlsProps) => {
  const btnBase = "flex items-center justify-center rounded-lg transition-all duration-150 text-white/90 hover:text-white hover:bg-white/20 active:scale-95";

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mb-4 group/progress">
        {chapters.length > 0 && duration > 0 && (
          <div className="relative mb-1 h-3" aria-hidden="false">
            {chapters.map((capitulo) => {
              const posicao = chapterPosition(capitulo, duration);
              if (posicao === null) return null;
              return (
                <button
                  key={capitulo.start_seconds}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSeek([capitulo.start_seconds]); }}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 ring-1 ring-black/50 transition-colors hover:bg-primary focus-visible:bg-primary focus-visible:outline-none"
                  style={{ left: `${posicao}%` }}
                  title={`${formatChapterTime(capitulo.start_seconds)} · ${capitulo.title}`}
                  aria-label={`${t('chapters.jumpTo')} ${capitulo.title} (${formatChapterTime(capitulo.start_seconds)})`}
                />
              );
            })}
          </div>
        )}
        <Slider data-gesto-ignorar="true" value={[currentTime]} max={duration || 100} step={0.1} onValueChange={onSeek} className="cursor-pointer" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePlay(); }} className={`${btnBase} h-10 w-10`} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
            {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
          </button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSkip(-10); }} className={`${btnBase} h-10 w-10 hidden sm:flex`} aria-label="Voltar 10 segundos">
            <SkipBack className="h-4 w-4" />
          </button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSkip(10); }} className={`${btnBase} h-10 w-10 hidden sm:flex`} aria-label="Avançar 10 segundos">
            <SkipForward className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 group/volume">
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMute(); }} className={`${btnBase} h-10 w-10`} aria-label={isMuted ? "Ativar som" : "Silenciar"}>
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
              <Slider data-gesto-ignorar="true" value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={onVolumeChange} />
            </div>
          </div>

          <span className="text-white text-sm font-medium ml-2 hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`${btnBase} text-xs font-semibold h-10 px-3 ${playbackRate !== 1 ? 'bg-primary/30 border border-primary/50' : ''}`}
                  >
                    <Gauge className="h-4 w-4 mr-1" />
                    {playbackRate}x
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-card/95 backdrop-blur-xl">
                <p>Velocidade: <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">,</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">.</kbd></p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-xl p-1">
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border/50 mb-1">
                Velocidade <span className="text-primary">(teclas , e .)</span>
              </div>
              {playbackRates.map((rate) => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => onPlaybackRateChange(rate)}
                  className={`rounded-lg flex items-center justify-between ${
                    playbackRate === rate ? 'bg-primary/20 text-primary' : ''
                  }`}
                >
                  <span>{rate}x</span>
                  <span className="text-xs text-muted-foreground ml-4">{getSpeedLabel(rate)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isPiPSupported && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePiP(); }}
              className={`${btnBase} h-10 w-10 ${isPiPActive ? 'bg-primary/30' : ''}`}
              aria-label={isPiPActive ? "Sair do picture-in-picture" : "Assistir em picture-in-picture"}
              aria-pressed={isPiPActive}
              title="Picture-in-picture (p)"
            >
              <PictureInPicture2 className="h-5 w-5" />
            </button>
          )}

          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFullscreen(); }} className={`${btnBase} h-10 w-10`} aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export { getSpeedLabel, formatTime };
export default VideoControls;
