import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Trophy,
  Award,
  Zap,
  Clock,
  Play,
  type LucideIcon,
} from "lucide-react";

interface Activity {
  id: string;
  type: "lesson" | "course" | "achievement" | "xp" | "streak";
  title: string;
  description: string;
  timestamp: string;
  xp?: number;
  icon: LucideIcon;
  gradient: string;
}

interface ActivityTimelineProps {
  limit?: number;
}

const ActivityTimeline = ({ limit = 10 }: ActivityTimelineProps) => {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-timeline", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const activities: Activity[] = [];

      // Fetch lesson completions
      const { data: lessons } = await supabase
        .from("user_lesson_progress")
        .select(`
          id,
          completed_at,
          lessons(title, course_id, courses(title))
        `)
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (lessons) {
        lessons.forEach((l: { id: string; completed_at: string | null; lessons: { title: string } | null }) => {
          if (l.completed_at && l.lessons) {
            activities.push({
              id: `lesson-${l.id}`,
              type: "lesson",
              title: "Aula concluída",
              description: l.lessons.title,
              timestamp: l.completed_at,
              xp: 25,
              icon: Play,
              gradient: "from-blue-500 to-cyan-500",
            });
          }
        });
      }

      // Fetch course completions
      const { data: courses } = await supabase
        .from("user_course_progress")
        .select(`
          id,
          completed_at,
          courses(title)
        `)
        .eq("user_id", user.id)
        .eq("progress_percentage", 100)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (courses) {
        courses.forEach((c: { id: string; completed_at: string | null; courses: { title: string } | null }) => {
          if (c.completed_at && c.courses) {
            activities.push({
              id: `course-${c.id}`,
              type: "course",
              title: "Curso concluído",
              description: c.courses.title,
              timestamp: c.completed_at,
              xp: 100,
              icon: Trophy,
              gradient: "from-amber-500 to-orange-500",
            });
          }
        });
      }

      // Fetch achievements
      const { data: achievements } = await supabase
        .from("user_achievements")
        .select(`
          id,
          unlocked_at,
          achievements(name, xp_reward)
        `)
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false })
        .limit(limit);

      if (achievements) {
        achievements.forEach((a: { id: string; unlocked_at: string; achievements: { name: string; xp_reward: number } | null }) => {
          if (a.achievements) {
            activities.push({
              id: `achievement-${a.id}`,
              type: "achievement",
              title: "Conquista desbloqueada",
              description: a.achievements.name,
              timestamp: a.unlocked_at,
              xp: a.achievements.xp_reward,
              icon: Award,
              gradient: "from-purple-500 to-pink-500",
            });
          }
        });
      }

      // Sort by timestamp
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Nenhuma atividade ainda</p>
        <p className="text-sm">Comece a estudar para ver seu histórico!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-border to-transparent" />

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const IconComponent = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 pl-2"
            >
              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${activity.gradient} flex items-center justify-center shadow-lg`}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{activity.title}</span>
                  {activity.xp && (
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      +{activity.xp} XP
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
