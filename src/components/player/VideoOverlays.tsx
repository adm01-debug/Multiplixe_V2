import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipBack, SkipForward, Gauge } from 'lucide-react';

interface SpeedIndicatorProps {
  show: boolean;
  playbackRate: number;
  speedLabel: string;
}

export const SpeedIndicator = ({ show, playbackRate, speedLabel }: SpeedIndicatorProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
      >
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl px-6 py-4 flex flex-col items-center gap-2 border border-white/10">
          <Gauge className="w-8 h-8 text-primary" />
          <span className="text-white font-bold text-2xl">{playbackRate}x</span>
          <span className="text-white/60 text-sm">{speedLabel}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface SkipIndicatorProps {
  indicator: { direction: 'forward' | 'backward'; seconds: number } | null;
}

export const SkipIndicator = ({ indicator }: SkipIndicatorProps) => (
  <AnimatePresence>
    {indicator && (
      <motion.div
        initial={{ opacity: 0, x: indicator.direction === 'forward' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-20 ${
          indicator.direction === 'forward' ? 'right-1/4' : 'left-1/4'
        }`}
      >
        <div className="bg-black/70 backdrop-blur-xl rounded-full p-4 flex items-center gap-2">
          {indicator.direction === 'forward' ? (
            <SkipForward className="w-6 h-6 text-white" />
          ) : (
            <SkipBack className="w-6 h-6 text-white" />
          )}
          <span className="text-white font-bold">{indicator.seconds}s</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface PlayOverlayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const PlayOverlay = ({ isPlaying, onTogglePlay }: PlayOverlayProps) => {
  if (isPlaying) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePlay(); }}
    >
      <div className="relative group/play pointer-events-none select-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-50 group-hover/play:opacity-75 transition-opacity scale-110" />
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
          <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

interface TitleOverlayProps {
  title: string;
  visible: boolean;
}

export const TitleOverlay = ({ title, visible }: TitleOverlayProps) => (
  <div
    className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 md:p-6 transition-opacity duration-300 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}
  >
    <h3 className="text-white font-display font-semibold text-lg md:text-xl truncate drop-shadow-lg">
      {title}
    </h3>
  </div>
);
