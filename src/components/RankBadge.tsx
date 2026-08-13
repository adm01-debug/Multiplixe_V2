import { Crown, Medal } from 'lucide-react';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

const RankBadge = ({ rank, size = 'md' }: RankBadgeProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32
  };

  if (rank === 1) {
    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Outer glow rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 animate-pulse opacity-40 blur-md" />
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 opacity-30 animate-spin-slow" style={{ animationDuration: '8s' }} />
        
        {/* Sparkle effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
          <div className="w-1 h-1 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
        </div>
        <div className="absolute top-1 right-0">
          <div className="w-0.5 h-0.5 bg-yellow-100 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-1 left-1">
          <div className="w-0.5 h-0.5 bg-amber-200 rounded-full animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
        </div>
        
        {/* Main badge */}
        <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/50 border-2 border-yellow-200/50">
          {/* Inner shine */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-100/40 to-transparent" />
          
          {/* Rotating highlight */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
              style={{ 
                transform: 'skewX(-20deg) translateX(-100%)',
                animation: 'shimmer 3s infinite'
              }}
            />
          </div>
          
          <Crown className="text-yellow-900 drop-shadow-sm relative z-10" size={iconSizes[size]} strokeWidth={2.5} />
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full animate-float opacity-80" style={{ animationDelay: '0.2s' }} />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 via-slate-300 to-gray-400 animate-pulse opacity-30 blur-md" />
        
        {/* Main badge */}
        <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-slate-300 to-gray-500 flex items-center justify-center shadow-lg shadow-slate-400/40 border-2 border-gray-100/50">
          {/* Inner shine */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/50 to-transparent" />
          
          {/* Shine sweep */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ 
                transform: 'skewX(-20deg)',
                animation: 'shimmer 4s infinite 1s'
              }}
            />
          </div>
          
          <Medal className="text-gray-700 drop-shadow-sm relative z-10" size={iconSizes[size]} strokeWidth={2.5} />
        </div>
        
        {/* Subtle particle */}
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-gradient-to-br from-gray-100 to-slate-200 rounded-full animate-float opacity-70" style={{ animationDelay: '0.3s' }} />
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 animate-pulse opacity-25 blur-md" />
        
        {/* Main badge */}
        <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-amber-300/50">
          {/* Inner shine */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-200/40 to-transparent" />
          
          {/* Shine sweep */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              style={{ 
                transform: 'skewX(-20deg)',
                animation: 'shimmer 5s infinite 2s'
              }}
            />
          </div>
          
          <Medal className="text-amber-900 drop-shadow-sm relative z-10" size={iconSizes[size]} strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  // Default rank badge for positions 4+
  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-muted/50 border border-border/50`}>
      <span className="text-muted-foreground font-bold text-sm">#{rank}</span>
    </div>
  );
};

export default RankBadge;
