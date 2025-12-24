import { Lock } from 'lucide-react';

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  gradient: string;
}

interface AchievementsGridProps {
  achievements: Achievement[];
  isUnlocked: (id: string) => boolean;
  compact?: boolean;
}

const AchievementsGrid = ({ achievements, isUnlocked, compact = false }: AchievementsGridProps) => {
  if (compact) {
    // Show only first 4 achievements in compact mode
    const displayAchievements = achievements.slice(0, 4);
    
    return (
      <div className="flex flex-wrap gap-3">
        {displayAchievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                unlocked
                  ? 'bg-card/80 border-border/50 hover:border-primary/30 hover:shadow-lg neon-card'
                  : 'bg-muted/30 border-border/30 opacity-50'
              }`}
            >
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                unlocked 
                  ? `bg-gradient-to-br ${achievement.gradient} shadow-lg` 
                  : 'bg-muted'
              }`}>
                {unlocked ? (
                  <span className="text-xl">{achievement.icon}</span>
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {achievements.map((achievement) => {
        const unlocked = isUnlocked(achievement.id);
        
        return (
          <div
            key={achievement.id}
            className={`group relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 ${
              unlocked
                ? 'bg-card/80 border-border/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 neon-card'
                : 'bg-muted/30 border-border/30 opacity-60 grayscale'
            }`}
          >
            {/* Icon */}
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              unlocked 
                ? `bg-gradient-to-br ${achievement.gradient} shadow-lg` 
                : 'bg-muted'
            }`}>
              {unlocked ? (
                <>
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity`} />
                </>
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            {/* Name */}
            <span className={`text-sm font-semibold text-center ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
              {achievement.name}
            </span>
            
            {/* Description tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48">
              <p className="text-xs text-center text-muted-foreground">{achievement.description}</p>
              {unlocked && achievement.xp_reward > 0 && (
                <p className="text-xs text-center text-emerald-500 font-semibold mt-1">+{achievement.xp_reward} XP</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementsGrid;
