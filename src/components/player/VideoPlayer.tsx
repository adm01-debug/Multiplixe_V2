import { useRef, useState, useEffect, useCallback } from "react";
import { SpeedIndicator, SkipIndicator, PlayOverlay, TitleOverlay } from "./VideoOverlays";
import VideoControls, { getSpeedLabel } from "./VideoControls";

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
  autoPlay?: boolean;
}

const VideoPlayer = ({
  src, title, onProgress, onComplete, initialPosition = 0, autoPlay = false,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedIndicatorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0 && initialPosition < video.duration) video.currentTime = initialPosition;
      if (autoPlay) video.play().catch(() => {});
    };
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); onComplete?.(); };

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
        if (videoRef.current) onProgress(videoRef.current.currentTime, videoRef.current.duration);
      }, 5000);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying, onProgress]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
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
    video.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
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
    setShowSkipIndicator({ direction: seconds > 0 ? 'forward' : 'backward', seconds: Math.abs(seconds) });
    setTimeout(() => setShowSkipIndicator(null), 800);
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedIndicator(true);
    if (speedIndicatorTimeout.current) clearTimeout(speedIndicatorTimeout.current);
    speedIndicatorTimeout.current = setTimeout(() => setShowSpeedIndicator(false), 1500);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    document.fullscreenElement
      ? document.exitFullscreen().catch(() => {})
      : containerRef.current.requestFullscreen().catch(() => {});
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    switch (e.key.toLowerCase()) {
      case ' ': case 'k': e.preventDefault(); togglePlay(); break;
      case 'j': e.preventDefault(); handleSkip(-10); break;
      case 'l': e.preventDefault(); handleSkip(10); break;
      case 'arrowleft': e.preventDefault(); handleSkip(-5); break;
      case 'arrowright': e.preventDefault(); handleSkip(5); break;
      case 'arrowup': e.preventDefault(); handleVolumeChange([Math.min(1, volume + 0.1)]); break;
      case 'arrowdown': e.preventDefault(); handleVolumeChange([Math.max(0, volume - 0.1)]); break;
      case 'm': e.preventDefault(); toggleMute(); break;
      case 'f': e.preventDefault(); toggleFullscreen(); break;
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        e.preventDefault();
        if (videoRef.current && duration > 0) videoRef.current.currentTime = duration * (parseInt(e.key) / 10);
        break;
      case ',': { e.preventDefault(); const idx = playbackRates.indexOf(playbackRate); if (idx > 0) handlePlaybackRateChange(playbackRates[idx - 1]); break; }
      case '.': { e.preventDefault(); const idx = playbackRates.indexOf(playbackRate); if (idx < playbackRates.length - 1) handlePlaybackRateChange(playbackRates[idx + 1]); break; }
    }
  }, [togglePlay, toggleMute, toggleFullscreen, handleSkip, handleVolumeChange, handlePlaybackRateChange, volume, duration, playbackRate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const controlsVisible = showControls || !isPlaying;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} src={src} className="w-full aspect-video cursor-pointer" playsInline />

      <SpeedIndicator show={showSpeedIndicator} playbackRate={playbackRate} speedLabel={getSpeedLabel(playbackRate)} />
      <SkipIndicator indicator={showSkipIndicator} />
      <PlayOverlay isPlaying={isPlaying} onTogglePlay={togglePlay} />
      <TitleOverlay title={title} visible={controlsVisible} />

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <VideoControls
        isPlaying={isPlaying} currentTime={currentTime} duration={duration}
        volume={volume} isMuted={isMuted} playbackRate={playbackRate}
        isFullscreen={isFullscreen} visible={controlsVisible}
        onTogglePlay={togglePlay} onSeek={handleSeek} onSkip={handleSkip}
        onVolumeChange={handleVolumeChange} onToggleMute={toggleMute}
        onPlaybackRateChange={handlePlaybackRateChange} onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
};

export default VideoPlayer;
