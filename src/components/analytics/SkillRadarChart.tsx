import { motion, AnimatePresence } from 'framer-motion';
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
import { Target, Loader2, TrendingUp, Award, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SkillData {
  skill: string;
  value: number;
  fullMark: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface CategoryProgress {
  category_name: string;
  courses_completed: number;
  total_courses: number;
  avg_quiz_score: number;
}

const getSkillLevel = (value: number): { label: string; color: string } => {
  if (value >= 80) return { label: 'Expert', color: 'text-emerald-500' };
  if (value >= 60) return { label: 'Avançado', color: 'text-blue-500' };
  if (value >= 40) return { label: 'Intermediário', color: 'text-amber-500' };
  if (value >= 20) return { label: 'Iniciante', color: 'text-orange-500' };
  return { label: 'Novato', color: 'text-muted-foreground' };
};

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
      } catch {
        // Fallback data on error
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

  // Calculate overall stats
  const hasData = skillData.some(s => s.value > 0);
  const avgSkill = skillData.length > 0 
    ? Math.round(skillData.reduce((acc, s) => acc + s.value, 0) / skillData.length)
    : 0;
  const topSkill = skillData.length > 0 
    ? skillData.reduce((a, b) => a.value > b.value ? a : b)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 p-6 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      <div className="relative">
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
          
          {hasData && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Zap className="h-3 w-3 mr-1" />
                {avgSkill}% média
              </Badge>
            </div>
          )}
        </div>

        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center px-4">
            <motion.div 
              className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="h-8 w-8 text-muted-foreground/50" />
            </motion.div>
            <p className="text-muted-foreground font-medium mb-1">Comece a aprender!</p>
            <p className="text-sm text-muted-foreground/70">
              Complete cursos para ver suas habilidades aqui
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                <defs>
                  <linearGradient id="skillGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <PolarGrid 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.3}
                  gridType="polygon"
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
                  axisLine={false}
                />
                <Radar
                  name="Habilidades"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="url(#skillGradient)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: 'hsl(var(--primary))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'hsl(var(--primary))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2
                  }}
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

        {/* Top skill highlight */}
        {topSkill && topSkill.value > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sua especialidade</p>
                  <p className="font-bold text-foreground">{topSkill.skill}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${getSkillLevel(topSkill.value).color}`}>
                  {getSkillLevel(topSkill.value).label}
                </p>
                <p className="text-2xl font-bold text-primary">{topSkill.value}%</p>
              </div>
            </div>
            <Progress value={topSkill.value} className="mt-3 h-2" />
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {skillData.slice(0, 4).map((skill, index) => {
              const level = getSkillLevel(skill.value);
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground truncate max-w-full">
                    {skill.skill}
                  </span>
                  <span className="text-lg font-bold text-foreground">{skill.value}%</span>
                  <span className={`text-[10px] font-medium ${level.color}`}>
                    {level.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SkillRadarChart;
