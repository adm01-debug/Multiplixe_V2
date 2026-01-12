import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Flame, Trophy, Check, Zap, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface WeeklyGoal {
  id: string;
  type: "lessons" | "minutes" | "xp" | "streak";
  target: number;
  current: number;
  xpReward: number;
  label: string;
  icon: React.ElementType;
  gradient: string;
  completed: boolean;
}

const WeeklyGoalTracker = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekProgress, setWeekProgress] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      setLoading(true);

      try {
        // Get start of the week (Monday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(today.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        // Fetch lessons completed this week
        const { data: lessonsData } = await supabase
          .from("user_lesson_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .gte("completed_at", weekStart.toISOString());

        // Fetch XP earned this week
        const { data: xpData } = await supabase
          .from("user_xp_history")
          .select("xp_amount")
          .eq("user_id", user.id)
          .gte("created_at", weekStart.toISOString());

        // Fetch current streak
        const { data: streakData } = await supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", user.id)
          .single();

        const lessonsCompleted = lessonsData?.length || 0;
        const xpEarned = xpData?.reduce((acc, curr) => acc + curr.xp_amount, 0) || 0;
        const currentStreak = streakData?.current_streak || 0;

        // Define weekly goals
        const weeklyGoals: WeeklyGoal[] = [
          {
            id: "lessons",
            type: "lessons",
            target: 10,
            current: lessonsCompleted,
            xpReward: 100,
            label: "Complete 10 aulas",
            icon: Target,
            gradient: "from-primary to-accent",
            completed: lessonsCompleted >= 10,
          },
          {
            id: "xp",
            type: "xp",
            target: 500,
            current: xpEarned,
            xpReward: 150,
            label: "Ganhe 500 XP",
            icon: Zap,
            gradient: "from-amber-500 to-orange-500",
            completed: xpEarned >= 500,
          },
          {
            id: "streak",
            type: "streak",
            target: 7,
            current: currentStreak,
            xpReward: 200,
            label: "Mantenha 7 dias de streak",
            icon: Flame,
            gradient: "from-rose-500 to-pink-500",
            completed: currentStreak >= 7,
          },
        ];

        setGoals(weeklyGoals);

        // Calculate overall week progress
        const totalProgress =
          weeklyGoals.reduce((acc, goal) => {
            const goalProgress = Math.min((goal.current / goal.target) * 100, 100);
            return acc + goalProgress;
          }, 0) / weeklyGoals.length;

        setWeekProgress(Math.round(totalProgress));
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  const handleClaimReward = async (goal: WeeklyGoal) => {
    if (!user || !goal.completed) return;

    // Check if already claimed (stored in localStorage for simplicity)
    const claimedKey = `weekly_goal_claimed_${goal.id}_${getWeekNumber()}`;
    if (localStorage.getItem(claimedKey)) {
      toast.info("Você já resgatou esta recompensa!");
      return;
    }

    try {
      // Add XP
      await supabase.rpc("add_user_xp", {
        p_user_id: user.id,
        p_amount: goal.xpReward,
        p_source: `weekly_goal_${goal.type}`,
      });

      localStorage.setItem(claimedKey, "true");

      // Celebrate!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#8B5CF6", "#EC4899", "#10B981"],
      });

      toast.success(`+${goal.xpReward} XP! Meta semanal concluída!`);

      // Update goals state
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id ? { ...g, claimed: true } : g
        )
      );
    } catch {
      toast.error("Erro ao resgatar recompensa");
    }
  };

  const getWeekNumber = () => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const isClaimable = (goal: WeeklyGoal) => {
    const claimedKey = `weekly_goal_claimed_${goal.id}_${getWeekNumber()}`;
    return goal.completed && !localStorage.getItem(claimedKey);
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 border-b border-border/50">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Metas da Semana</h3>
              <p className="text-sm text-muted-foreground">
                {weekProgress}% concluído
              </p>
            </div>
          </div>

          <Badge
            className={`${
              weekProgress >= 100
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-primary/20 text-primary border-primary/30"
            }`}
          >
            {goals.filter((g) => g.completed).length}/{goals.length} metas
          </Badge>
        </div>

        {/* Overall progress */}
        <div className="mt-4">
          <Progress value={weekProgress} className="h-2" />
        </div>
      </div>

      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const claimable = isClaimable(goal);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 transition-colors ${
                  goal.completed ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${goal.gradient}`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{goal.label}</span>
                      {goal.completed && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                          <Check className="h-3 w-3" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {goal.current}/{goal.target}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3" />
                        +{goal.xpReward} XP
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5 mt-2" />
                  </div>

                  {/* Claim button */}
                  <AnimatePresence>
                    {claimable && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          size="sm"
                          className="gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                          onClick={() => handleClaimReward(goal)}
                        >
                          <Zap className="h-4 w-4" />
                          Resgatar
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyGoalTracker;
