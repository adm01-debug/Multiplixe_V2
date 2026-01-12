import { useState, useEffect, useRef, useCallback } from "react";

interface UseVideoShortcutsOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  seekAmount?: number;
  volumeStep?: number;
}

export const useVideoShortcuts = ({
  videoRef,
  onNextLesson,
  onPrevLesson,
  seekAmount = 10,
  volumeStep = 0.1,
}: UseVideoShortcutsOptions) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;

        case "arrowleft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - seekAmount);
          break;

        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + seekAmount);
          break;

        case "arrowup":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + volumeStep);
          break;

        case "arrowdown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - volumeStep);
          break;

        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          break;

        case "f":
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.parentElement?.requestFullscreen();
          }
          break;

        case "j":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;

        case "l":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
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
          const percent = parseInt(e.key) / 10;
          video.currentTime = video.duration * percent;
          break;

        case "n":
          if (e.shiftKey && onNextLesson) {
            e.preventDefault();
            onNextLesson();
          }
          break;

        case "p":
          if (e.shiftKey && onPrevLesson) {
            e.preventDefault();
            onPrevLesson();
          }
          break;

        case ",":
          e.preventDefault();
          const slowerRate = Math.max(0.25, video.playbackRate - 0.25);
          video.playbackRate = slowerRate;
          break;

        case ".":
          e.preventDefault();
          const fasterRate = Math.min(2, video.playbackRate + 0.25);
          video.playbackRate = fasterRate;
          break;
      }
    },
    [videoRef, onNextLesson, onPrevLesson, seekAmount, volumeStep]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleKeyDown]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.parentElement?.requestFullscreen();
    }
  }, [videoRef]);

  const seek = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    },
    [videoRef]
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = rate;
    },
    [videoRef]
  );

  return {
    isFullscreen,
    togglePlayPause,
    toggleMute,
    toggleFullscreen,
    seek,
    setPlaybackRate,
  };
};
