import { memo, useMemo } from 'react';
import { Lock, Share2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ShareAchievement from '@/components/share/ShareAchievement';

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
  const displayAchievements = useMemo(
    () => (compact ? achievements.slice(0, 4) : achievements),
    [achievements, compact]
  );

  if (compact) {
    
    return (
      <div className="flex flex-wrap gap-3">
        {displayAchievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <motion.div
              key={achievement.id}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer ${
                unlocked
                  ? 'bg-card/80 border-border/50'
                  : 'bg-muted/30 border-border/30 opacity-50'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: unlocked ? 1 : 0.5, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={unlocked ? { 
                scale: 1.05,
                y: -4,
                boxShadow: "0 12px 24px -8px hsl(var(--primary) / 0.2)",
                borderColor: "hsl(var(--primary) / 0.4)"
              } : {}}
              whileTap={unlocked ? { scale: 0.97 } : {}}
            >
              <motion.div 
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                  unlocked 
                    ? `bg-gradient-to-br ${achievement.gradient} shadow-lg` 
                    : 'bg-muted'
                }`}
                whileHover={unlocked ? { rotate: [0, -5, 5, 0], scale: 1.1 } : {}}
                transition={{ duration: 0.4 }}
              >
                {unlocked ? (
                  <span className="text-xl">{achievement.icon}</span>
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.div>
              <span className={`text-sm font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.name}
              </span>
              
              {/* Glow effect on hover for unlocked */}
              {unlocked && (
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} rounded-2xl opacity-0 blur-xl -z-10`}
                  whileHover={{ opacity: 0.15 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {achievements.map((achievement, index) => {
        const unlocked = isUnlocked(achievement.id);
        
        return (
          <motion.div
            key={achievement.id}
            className={`group relative flex flex-col items-center p-4 rounded-2xl border cursor-pointer overflow-hidden ${
              unlocked
                ? 'bg-card/80 border-border/50'
                : 'bg-muted/30 border-border/30 grayscale'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: unlocked ? 1 : 0.6, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.3, type: "spring", stiffness: 300 }}
            whileHover={unlocked ? { 
              y: -8, 
              scale: 1.05,
              boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.25)",
              borderColor: "hsl(var(--primary) / 0.5)"
            } : {}}
            whileTap={unlocked ? { scale: 0.95 } : {}}
          >
            {/* Background glow on hover */}
            {unlocked && (
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} opacity-0`}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            
            {/* Icon */}
            <motion.div 
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                unlocked 
                  ? `bg-gradient-to-br ${achievement.gradient} shadow-lg` 
                  : 'bg-muted'
              }`}
              whileHover={unlocked ? { 
                scale: 1.15, 
                rotate: [0, -8, 8, -4, 0],
              } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {unlocked ? (
                <>
                  <span className="text-2xl relative z-10">{achievement.icon}</span>
                  {/* Animated sparkle on hover */}
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1, rotate: 15 }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                </>
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground" />
              )}
              
              {/* Glow effect behind icon */}
              {unlocked && (
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${achievement.gradient} rounded-2xl blur-lg -z-10`}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.6, scale: 1.3 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
            
            {/* Name */}
            <motion.span 
              className={`text-sm font-semibold text-center relative z-10 ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}
              whileHover={unlocked ? { scale: 1.02 } : {}}
            >
              {achievement.name}
            </motion.span>

                        {unlocked && (
                          <div className="relative z-20 mt-2">
                            <ShareAchievement
                              title={achievement.name}
                              description={achievement.description}
                              type="achievement"
                              value={achievement.xp_reward}
                              icon={achievement.icon}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Compartilhar conquista ${achievement.name}`}
                                  className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                          </div>
                        )}
            
            {/* Description tooltip on hover */}
            <motion.div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg pointer-events-none z-20 w-48"
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              whileHover={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-center text-muted-foreground">{achievement.description}</p>
              {unlocked && achievement.xp_reward > 0 && (
                <p className="text-xs text-center text-emerald-500 font-semibold mt-1">+{achievement.xp_reward} XP</p>
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default memo(AchievementsGrid);
