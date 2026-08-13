import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StatCard {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

const LearningStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);

      try {
        // Fetch all data in parallel
        const [
          lessonsResult,
          coursesResult,
          xpResult,
          streakResult,
          achievementsResult,
          certificatesResult,
        ] = await Promise.all([
          supabase
            .from("user_lesson_progress")
            .select("id, watched_seconds")
            .eq("user_id", user.id)
            .eq("is_completed", true),
          supabase
            .from("user_course_progress")
            .select("id")
            .eq("user_id", user.id)
            .not("completed_at", "is", null),
          supabase
            .from("user_xp")
            .select("total_xp, current_level")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("user_streaks")
            .select("current_streak, longest_streak")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("user_achievements")
            .select("id")
            .eq("user_id", user.id),
          supabase
            .from("certificates")
            .select("id")
            .eq("user_id", user.id),
        ]);

        const lessonsCompleted = lessonsResult.data?.length || 0;
        const totalWatchedSeconds = lessonsResult.data?.reduce(
          (acc, curr) => acc + (curr.watched_seconds || 0),
          0
        ) || 0;
        const coursesCompleted = coursesResult.data?.length || 0;
        const totalXP = xpResult.data?.total_xp || 0;
        const currentLevel = xpResult.data?.current_level || 1;
        const currentStreak = streakResult.data?.current_streak || 0;
        const longestStreak = streakResult.data?.longest_streak || 0;
        const achievementsCount = achievementsResult.data?.length || 0;
        const certificatesCount = certificatesResult.data?.length || 0;

        // Format watch time
        const hours = Math.floor(totalWatchedSeconds / 3600);
        const minutes = Math.floor((totalWatchedSeconds % 3600) / 60);
        const watchTimeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const statCards: StatCard[] = [
          {
            id: "lessons",
            label: "Aulas Concluídas",
            value: lessonsCompleted,
            icon: BookOpen,
            gradient: "from-primary to-accent",
          },
          {
            id: "watchtime",
            label: "Tempo de Estudo",
            value: watchTimeFormatted,
            icon: Clock,
            gradient: "from-blue-500 to-cyan-500",
          },
          {
            id: "courses",
            label: "Cursos Finalizados",
            value: coursesCompleted,
            icon: Trophy,
            gradient: "from-amber-500 to-orange-500",
          },
          {
            id: "xp",
            label: "XP Total",
            value: totalXP.toLocaleString(),
            subValue: `Nível ${currentLevel}`,
            icon: Zap,
            gradient: "from-emerald-500 to-teal-500",
          },
          {
            id: "streak",
            label: "Streak Atual",
            value: `${currentStreak} dias`,
            subValue: `Recorde: ${longestStreak}`,
            icon: Flame,
            gradient: "from-rose-500 to-pink-500",
          },
          {
            id: "achievements",
            label: "Conquistas",
            value: achievementsCount,
            icon: Target,
            gradient: "from-purple-500 to-violet-500",
          },
          {
            id: "certificates",
            label: "Certificados",
            value: certificatesCount,
            icon: Calendar,
            gradient: "from-indigo-500 to-blue-500",
          },
          {
            id: "level",
            label: "Nível Atual",
            value: currentLevel,
            icon: TrendingUp,
            gradient: "from-fuchsia-500 to-pink-500",
          },
        ];

        setStats(statCards);
      } catch {
        // Silent fail - stats will show empty/default values
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="w-10 h-10 bg-muted rounded-xl" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 group overflow-hidden">
              <CardContent className="p-4 relative">
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{
                    boxShadow: `0 8px 20px -6px var(--tw-gradient-from)`,
                  }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Value */}
                <motion.div
                  className="text-2xl font-bold text-foreground"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>

                {/* Sub value */}
                {stat.subValue && (
                  <div className="text-xs text-primary mt-1 font-medium">
                    {stat.subValue}
                  </div>
                )}

                {/* Trend indicator */}
                {stat.trend && (
                  <div
                    className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-medium ${
                      stat.trend.direction === "up"
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    <TrendingUp
                      className={`h-3 w-3 ${
                        stat.trend.direction === "down" && "rotate-180"
                      }`}
                    />
                    {stat.trend.value}%
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LearningStats;
