import { useEffect, useCallback } from 'react';

interface UseVideoKeyboardProps {
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  handleSkip: (seconds: number) => void;
  handleVolumeChange: (value: number[]) => void;
  handlePlaybackRateChange: (rate: number) => void;
  volume: number;
  duration: number;
  playbackRate: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const useVideoKeyboard = ({
  togglePlay, toggleMute, toggleFullscreen, handleSkip,
  handleVolumeChange, handlePlaybackRateChange, volume, duration, playbackRate, videoRef
}: UseVideoKeyboardProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "j": e.preventDefault(); handleSkip(-10); break;
        case "l": e.preventDefault(); handleSkip(10); break;
        case "arrowleft": e.preventDefault(); handleSkip(-5); break;
        case "arrowright": e.preventDefault(); handleSkip(5); break;
        case "arrowup": e.preventDefault(); handleVolumeChange([Math.min(1, volume + 0.1)]); break;
        case "arrowdown": e.preventDefault(); handleVolumeChange([Math.max(0, volume - 0.1)]); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "0": case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8": case "9":
          e.preventDefault();
          if (videoRef.current && duration > 0) videoRef.current.currentTime = duration * (parseInt(e.key) / 10);
          break;
        case ",": {
          e.preventDefault();
          const idx = playbackRates.indexOf(playbackRate);
          if (idx > 0) handlePlaybackRateChange(playbackRates[idx - 1]);
          break;
        }
        case ".": {
          e.preventDefault();
          const idx = playbackRates.indexOf(playbackRate);
          if (idx < playbackRates.length - 1) handlePlaybackRateChange(playbackRates[idx + 1]);
          break;
        }
      }
    },
    [togglePlay, toggleMute, toggleFullscreen, handleSkip, handleVolumeChange, handlePlaybackRateChange, volume, duration, playbackRate, videoRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
