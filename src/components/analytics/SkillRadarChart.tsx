import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target, Loader2 } from 'lucide-react';

interface SkillData {
  skill: string;
  value: number;
  fullMark: number;
}

interface CategoryProgress {
  category_name: string;
  courses_completed: number;
  total_courses: number;
  avg_quiz_score: number;
}

const SkillRadarChart = () => {
  const { user } = useAuth();
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!user) return;

      try {
        // Get user's course progress grouped by category
        const { data: progressData, error: progressError } = await supabase
          .from('user_course_progress')
          .select(`
            progress_percentage,
            completed_at,
            courses!inner (
              id,
              title,
              categories!inner (
                id,
                name
              )
            )
          `)
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        // Get quiz performance by category
        const { data: quizData, error: quizError } = await supabase
          .from('user_quiz_attempts')
          .select(`
            score,
            passed,
            quizzes!inner (
              id,
              courses!inner (
                categories!inner (
                  id,
                  name
                )
              )
            )
          `)
          .eq('user_id', user.id);

        // Process data by category
        const categoryStats: Record<string, { completed: number; total: number; quizScores: number[] }> = {};

        // Process course progress
        (progressData || []).forEach((progress: any) => {
          const categoryName = progress.courses?.categories?.name || 'Outros';
          if (!categoryStats[categoryName]) {
            categoryStats[categoryName] = { completed: 0, total: 0, quizScores: [] };
          }
          categoryStats[categoryName].total += 1;
          if (progress.completed_at) {
            categoryStats[categoryName].completed += 1;
          }
        });

        // Process quiz scores
        (quizData || []).forEach((attempt: any) => {
          const categoryName = attempt.quizzes?.courses?.categories?.name || 'Outros';
          if (!categoryStats[categoryName]) {
            categoryStats[categoryName] = { completed: 0, total: 0, quizScores: [] };
          }
          categoryStats[categoryName].quizScores.push(attempt.score);
        });

        // Convert to radar chart format
        const skills: SkillData[] = Object.entries(categoryStats)
          .slice(0, 8) // Max 8 skills for clean visualization
          .map(([name, stats]) => {
            // Calculate skill level based on completion rate and quiz performance
            const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 50 : 0;
            const avgQuizScore = stats.quizScores.length > 0 
              ? (stats.quizScores.reduce((a, b) => a + b, 0) / stats.quizScores.length) * 0.5
              : 0;
            
            return {
              skill: name.length > 12 ? name.substring(0, 12) + '...' : name,
              value: Math.round(completionRate + avgQuizScore),
              fullMark: 100,
            };
          });

        // If no real data, show placeholder skills
        if (skills.length === 0) {
          setSkillData([
            { skill: 'Vendas', value: 0, fullMark: 100 },
            { skill: 'Marketing', value: 0, fullMark: 100 },
            { skill: 'Atendimento', value: 0, fullMark: 100 },
            { skill: 'Liderança', value: 0, fullMark: 100 },
            { skill: 'Tecnologia', value: 0, fullMark: 100 },
            { skill: 'Comunicação', value: 0, fullMark: 100 },
          ]);
        } else {
          setSkillData(skills);
        }
      } catch (error) {
        console.error('Error fetching skill data:', error);
        // Fallback data
        setSkillData([
          { skill: 'Vendas', value: 0, fullMark: 100 },
          { skill: 'Marketing', value: 0, fullMark: 100 },
          { skill: 'Atendimento', value: 0, fullMark: 100 },
          { skill: 'Liderança', value: 0, fullMark: 100 },
          { skill: 'Tecnologia', value: 0, fullMark: 100 },
          { skill: 'Comunicação', value: 0, fullMark: 100 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillData();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <Target className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">Radar de Habilidades</h3>
            <p className="text-sm text-muted-foreground">Suas competências por área</p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const hasData = skillData.some(s => s.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 dark:border-cyan-500/40 dark:shadow-[0_0_20px_hsl(190_100%_50%/0.2)]">
            <Target className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">Radar de Habilidades</h3>
            <p className="text-sm text-muted-foreground">Suas competências por área</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">Comece a aprender!</p>
          <p className="text-sm text-muted-foreground/70">
            Complete cursos para ver suas habilidades aqui
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.5}
              />
              <PolarAngleAxis 
                dataKey="skill" 
                tick={{ 
                  fill: 'hsl(var(--muted-foreground))', 
                  fontSize: 11,
                  fontWeight: 500 
                }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Habilidades"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
                formatter={(value: number) => [`${value}%`, 'Domínio']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex flex-wrap gap-3 justify-center">
          {skillData.slice(0, 4).map((skill, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: skill.value > 50 
                    ? 'hsl(var(--primary))' 
                    : skill.value > 25 
                      ? 'hsl(45, 100%, 51%)' 
                      : 'hsl(var(--muted-foreground))' 
                }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {skill.skill}: {skill.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SkillRadarChart;
