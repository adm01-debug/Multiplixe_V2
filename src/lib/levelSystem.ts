// Level System Configuration
export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
  gradient: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: "Novato", minXP: 0, maxXP: 100, icon: "🌱", color: "text-emerald-500", gradient: "from-emerald-400 to-emerald-600" },
  { level: 2, name: "Aprendiz", minXP: 100, maxXP: 250, icon: "📚", color: "text-blue-500", gradient: "from-blue-400 to-blue-600" },
  { level: 3, name: "Estudante", minXP: 250, maxXP: 500, icon: "🎯", color: "text-purple-500", gradient: "from-purple-400 to-purple-600" },
  { level: 4, name: "Dedicado", minXP: 500, maxXP: 850, icon: "⚡", color: "text-amber-500", gradient: "from-amber-400 to-amber-600" },
  { level: 5, name: "Experiente", minXP: 850, maxXP: 1300, icon: "🔥", color: "text-orange-500", gradient: "from-orange-400 to-orange-600" },
  { level: 6, name: "Avançado", minXP: 1300, maxXP: 1900, icon: "💎", color: "text-cyan-500", gradient: "from-cyan-400 to-cyan-600" },
  { level: 7, name: "Expert", minXP: 1900, maxXP: 2700, icon: "🏆", color: "text-yellow-500", gradient: "from-yellow-400 to-yellow-600" },
  { level: 8, name: "Mestre", minXP: 2700, maxXP: 3800, icon: "👑", color: "text-rose-500", gradient: "from-rose-400 to-rose-600" },
  { level: 9, name: "Grão-Mestre", minXP: 3800, maxXP: 5200, icon: "🌟", color: "text-pink-500", gradient: "from-pink-400 to-pink-600" },
  { level: 10, name: "Lenda", minXP: 5200, maxXP: Infinity, icon: "🚀", color: "text-primary", gradient: "from-primary to-accent" },
];

export interface UserLevel {
  currentLevel: Level;
  nextLevel: Level | null;
  currentXP: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
}

export function calculateUserLevel(totalXP: number): UserLevel {
  let currentLevel = LEVELS[0];
  let nextLevel: Level | null = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].minXP) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
    }
  }

  const xpInCurrentLevel = totalXP - currentLevel.minXP;
  const xpNeededForNextLevel = nextLevel 
    ? nextLevel.minXP - currentLevel.minXP 
    : 0;
  const progressPercentage = nextLevel 
    ? Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100) 
    : 100;

  return {
    currentLevel,
    nextLevel,
    currentXP: totalXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
  };
}
