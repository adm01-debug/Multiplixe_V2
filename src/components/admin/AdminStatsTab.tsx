import { BookOpen, TrendingUp, Trophy, Zap } from 'lucide-react';
import type { AdminCourse } from './AdminCoursesTab';
import type { UserStat } from './AdminUsersTab';

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalXPEarned: number;
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
}

interface Props {
  stats: PlatformStats | null;
  courses: AdminCourse[];
  users: UserStat[];
}

const AdminStatsTab = ({ stats, courses, users }: Props) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Engajamento
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxa de conclusão de aulas</span>
              <span className="font-bold">
                {stats && stats.totalLessons > 0
                  ? Math.round((stats.totalLessonsCompleted / (stats.totalUsers * stats.totalLessons)) * 100) || 0
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Média de XP por usuário</span>
              <span className="font-bold text-emerald-500">
                {stats && stats.totalUsers > 0 ? Math.round(stats.totalXPEarned / stats.totalUsers).toLocaleString() : 0} XP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Aulas por usuário</span>
              <span className="font-bold">
                {stats && stats.totalUsers > 0 ? (stats.totalLessonsCompleted / stats.totalUsers).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" /> Conteúdo
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cursos publicados</span>
              <span className="font-bold">{courses.filter(c => c.is_published).length} / {courses.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cursos em destaque</span>
              <span className="font-bold text-amber-500">{courses.filter(c => c.is_featured).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Média de aulas por curso</span>
              <span className="font-bold">
                {courses.length > 0 ? (courses.reduce((sum, c) => sum + c.total_lessons, 0) / courses.length).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Top 5 Usuários
        </h3>
        <div className="space-y-3">
          {users.slice(0, 5).map((userStat, index) => (
            <div key={userStat.user_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-muted-foreground">#{index + 1}</span>
                <span className="font-medium">{userStat.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-emerald-500">{userStat.total_xp.toLocaleString()} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStatsTab;
