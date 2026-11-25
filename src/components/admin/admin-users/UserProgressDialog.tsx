import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, BookOpen, Flame, Loader2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserStat } from './types';

interface CourseProgressRow {
  course_id: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  courseTitle: string;
}

interface Props {
  user: UserStat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const xpCards = [
  { key: 'xp_from_lessons', label: 'Aulas', icon: BookOpen, color: 'text-blue-500' },
  { key: 'xp_from_courses', label: 'Cursos', icon: Zap, color: 'text-emerald-500' },
  { key: 'xp_from_streaks', label: 'Sequência', icon: Flame, color: 'text-orange-500' },
  { key: 'xp_from_achievements', label: 'Conquistas', icon: Award, color: 'text-purple-500' },
] as const;

const UserProgressDialog = ({ user, open, onOpenChange }: Props) => {
  const [rows, setRows] = useState<CourseProgressRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Sem FK entre user_course_progress e courses, o select aninhado do PostgREST não existe:
        // busca as duas tabelas e junta pelo id do curso.
        const [{ data: progressData }, { data: coursesData }] = await Promise.all([
          supabase
            .from('user_course_progress')
            .select('course_id, progress_percentage, started_at, completed_at, last_accessed_at')
            .eq('user_id', user.user_id),
          supabase.from('courses').select('id, title'),
        ]);
        if (cancelled) return;
        const titles = new Map((coursesData || []).map((c) => [c.id, c.title]));
        setRows(
          (progressData || [])
            .map((row) => ({ ...row, courseTitle: titles.get(row.course_id) || 'Curso removido' }))
            .sort((a, b) => b.progress_percentage - a.progress_percentage),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, user]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
            <span>{user.full_name}</span>
          </DialogTitle>
          <DialogDescription>{user.email || 'Sem e-mail cadastrado'}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Nível {user.current_level}</Badge>
          <Badge variant={user.is_active ? 'default' : 'destructive'}>
            {user.is_active ? 'Ativo' : 'Desativado'}
          </Badge>
          {user.roles.map((role) => (
            <Badge key={role} className="bg-gradient-to-r from-primary to-accent text-white">
              {role === 'admin' ? 'Admin' : role === 'gestor' ? 'Gestor' : 'Aluno'}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {xpCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="rounded-xl border border-border/50 p-3">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <p className="text-lg font-bold mt-1">{user[card.key].toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">Progresso por curso</p>
            <p className="text-xs text-muted-foreground">
              {user.courses_completed} concluído(s) · {user.lessons_completed} aula(s)
            </p>
          </div>

          {loading ? (
            <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Nenhum curso iniciado.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.course_id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{row.courseTitle}</span>
                    <span className="text-muted-foreground shrink-0">{row.progress_percentage}%</span>
                  </div>
                  <Progress value={row.progress_percentage} className="h-2" />
                  {row.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Concluído em {format(new Date(row.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <p>Membro desde {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
          <p>
            Último XP{' '}
            {user.last_xp_earned_at
              ? format(new Date(user.last_xp_earned_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
              : '—'}
          </p>
          {user.deactivated_at && (
            <p className="col-span-2 text-destructive">
              Desativado em {format(new Date(user.deactivated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProgressDialog;