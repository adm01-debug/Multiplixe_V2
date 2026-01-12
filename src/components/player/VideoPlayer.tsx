import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Gauge,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
  autoPlay?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const getSpeedLabel = (rate: number) => {
  if (rate < 1) return "Lento";
  if (rate === 1) return "Normal";
  if (rate <= 1.5) return "Rápido";
  return "Turbo";
};

const VideoPlayer = ({
  src,
  title,
  onProgress,
  onComplete,
  initialPosition = 0,
  autoPlay = false,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [showSkipIndicator, setShowSkipIndicator] = useState<{ direction: 'forward' | 'backward'; seconds: number } | null>(null);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const speedIndicatorTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0 && initialPosition < video.duration) {
        video.currentTime = initialPosition;
      }
      if (autoPlay) {
        video.play().catch(() => {/* Autoplay blocked - user interaction required */});
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [initialPosition, autoPlay, onComplete]);

  useEffect(() => {
    if (isPlaying && onProgress) {
      progressInterval.current = setInterval(() => {
        if (videoRef.current) {
          onProgress(videoRef.current.currentTime, videoRef.current.duration);
        }
      }, 5000);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, onProgress]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {/* Play blocked */});
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!video.muted);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    
    // Show skip indicator
    setShowSkipIndicator({ direction: seconds > 0 ? 'forward' : 'backward', seconds: Math.abs(seconds) });
    setTimeout(() => setShowSkipIndicator(null), 800);
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    
    // Show speed indicator
    setShowSpeedIndicator(true);
    if (speedIndicatorTimeout.current) {
      clearTimeout(speedIndicatorTimeout.current);
    }
    speedIndicatorTimeout.current = setTimeout(() => {
      setShowSpeedIndicator(false);
    }, 1500);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {/* Exit fullscreen failed */});
    } else {
      containerRef.current.requestFullscreen().catch(() => {/* Fullscreen not supported */});
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "j":
          e.preventDefault();
          handleSkip(-10);
          break;
        case "l":
          e.preventDefault();
          handleSkip(10);
          break;
        case "arrowleft":
          e.preventDefault();
          handleSkip(-5);
          break;
        case "arrowright":
          e.preventDefault();
          handleSkip(5);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          if (videoRef.current && duration > 0) {
            const percent = parseInt(e.key) / 10;
            videoRef.current.currentTime = duration * percent;
          }
          break;
        case ",":
          e.preventDefault();
          const slowerRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
          const currentSlowerIndex = slowerRates.indexOf(playbackRate);
          if (currentSlowerIndex > 0) {
            handlePlaybackRateChange(slowerRates[currentSlowerIndex - 1]);
          }
          break;
        case ".":
          e.preventDefault();
          const fasterRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
          const currentFasterIndex = fasterRates.indexOf(playbackRate);
          if (currentFasterIndex < fasterRates.length - 1) {
            handlePlaybackRateChange(fasterRates[currentFasterIndex + 1]);
          }
          break;
      }
    },
    [togglePlay, toggleMute, toggleFullscreen, handleSkip, handleVolumeChange, handlePlaybackRateChange, volume, duration, playbackRate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Speed indicator overlay */}
      <AnimatePresence>
        {showSpeedIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl px-6 py-4 flex flex-col items-center gap-2 border border-white/10">
              <Gauge className="w-8 h-8 text-primary" />
              <span className="text-white font-bold text-2xl">{playbackRate}x</span>
              <span className="text-white/60 text-sm">{getSpeedLabel(playbackRate)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip indicator overlay */}
      <AnimatePresence>
        {showSkipIndicator && (
          <motion.div
            initial={{ opacity: 0, x: showSkipIndicator.direction === 'forward' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-20 ${
              showSkipIndicator.direction === 'forward' ? 'right-1/4' : 'left-1/4'
            }`}
          >
            <div className="bg-black/70 backdrop-blur-xl rounded-full p-4 flex items-center gap-2">
              {showSkipIndicator.direction === 'forward' ? (
                <SkipForward className="w-6 h-6 text-white" />
              ) : (
                <SkipBack className="w-6 h-6 text-white" />
              )}
              <span className="text-white font-bold">{showSkipIndicator.seconds}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play button overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
          onClick={togglePlay}
        >
          <div className="relative group/play">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-50 group-hover/play:opacity-75 transition-opacity scale-110" />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      )}

      {/* Title overlay */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 md:p-6 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <h3 className="text-white font-display font-semibold text-lg md:text-xl truncate drop-shadow-lg">
          {title}
        </h3>
      </div>

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="mb-4 group/progress">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </Button>

            {/* Skip buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(-10)}
              className="text-white hover:bg-white/20 h-10 w-10 hidden sm:flex"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(10)}
              className="text-white hover:bg-white/20 h-10 w-10 hidden sm:flex"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/volume">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-10 w-10"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-sm font-medium ml-2 hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Playback speed */}
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
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`rounded-lg flex items-center justify-between ${
                          playbackRate === rate ? "bg-primary/20 text-primary" : ""
                        }`}
                      >
                        <span>{rate}x</span>
                        <span className="text-xs text-muted-foreground ml-4">
                          {getSpeedLabel(rate)}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-card/95 backdrop-blur-xl">
                <p>Velocidade: <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">,</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">.</kbd></p>
              </TooltipContent>
            </Tooltip>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-10 w-10"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
