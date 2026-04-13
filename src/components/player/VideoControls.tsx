import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Gauge,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  onTogglePlay: () => void;
  onSeek: (value: number[]) => void;
  onSkip: (seconds: number) => void;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
}

const VideoControls = ({
  isPlaying, currentTime, duration, volume, isMuted, playbackRate,
  isFullscreen, visible, onTogglePlay, onSeek, onSkip,
  onVolumeChange, onToggleMute, onPlaybackRateChange, onToggleFullscreen,
}: VideoControlsProps) => {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mb-4 group/progress">
        <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={onSeek} className="cursor-pointer" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" onClick={onTogglePlay} className="text-white hover:bg-white/20 h-10 w-10">
            {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onSkip(-10)} className="text-white hover:bg-white/20 h-10 w-10 hidden sm:flex">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onSkip(10)} className="text-white hover:bg-white/20 h-10 w-10 hidden sm:flex">
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 group/volume">
            <Button variant="ghost" size="icon" onClick={onToggleMute} className="text-white hover:bg-white/20 h-10 w-10">
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
              <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={onVolumeChange} />
            </div>
          </div>

          <span className="text-white text-sm font-medium ml-2 hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white hover:bg-white/20 text-xs font-semibold h-10 px-3 rounded-lg transition-all ${
                      playbackRate !== 1 ? 'bg-primary/30 border border-primary/50' : ''
                    }`}
                  >
                    <Gauge className="h-4 w-4 mr-1" />
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
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
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-card/95 backdrop-blur-xl">
              <p>Velocidade: <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">,</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">.</kbd></p>
            </TooltipContent>
          </Tooltip>

          <Button variant="ghost" size="icon" onClick={onToggleFullscreen} className="text-white hover:bg-white/20 h-10 w-10">
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { getSpeedLabel, formatTime };
export default VideoControls;
