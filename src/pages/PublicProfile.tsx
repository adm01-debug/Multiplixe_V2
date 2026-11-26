import { useParams, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, BookOpenCheck, Flame, Lock, Sparkles, ArrowLeft, UserX, Trophy } from 'lucide-react';
import { usePublicProfile } from '@/hooks/usePublicProfile';

const initialsOf = (name?: string | null) => {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, loading, error } = usePublicProfile(id);

  if (loading) {
    return (
      <main id="main-content" className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  const unavailableReason = error ? 'error' : !profile?.available ? profile?.reason ?? 'not_found' : null;

  if (unavailableReason) {
    const copy = {
      private: {
        icon: Lock,
        title: 'Este perfil é privado',
        description: 'O dono deste perfil optou por não compartilhar as conquistas publicamente.',
      },
      not_found: {
        icon: UserX,
        title: 'Perfil não encontrado',
        description: 'O link pode estar incorreto ou a conta não existe mais no Multiplixe.',
      },
      invalid: {
        icon: UserX,
        title: 'Link inválido',
        description: 'Este endereço não corresponde a nenhum perfil.',
      },
      error: {
        icon: UserX,
        title: 'Não foi possível carregar o perfil',
        description: 'Tente novamente em alguns instantes.',
      },
    }[unavailableReason] ?? {
      icon: UserX,
      title: 'Perfil não encontrado',
      description: 'O link pode estar incorreto.',
    };
    const Icon = copy.icon;

    return (
      <main id="main-content" className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="rounded-2xl bg-card/80 border-border/50">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Icon className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">{copy.title}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{copy.description}</p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Ir para o Multiplixe</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const person = profile!.profile!;
  const achievements = profile!.achievements ?? [];
  const courses = profile!.completed_courses ?? [];

  return (
    <main id="main-content" className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Multiplixe</Link>
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-card/80 border border-border/50 p-6 md:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
            {person.avatar_url ? <AvatarImage src={person.avatar_url} alt={person.full_name ?? 'Foto de perfil'} /> : null}
            <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-accent text-white">
              {initialsOf(person.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-display font-bold text-foreground">{person.full_name ?? 'Membro Multiplixe'}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              {person.department ? <Badge variant="secondary" className="rounded-lg">{person.department}</Badge> : null}
              <Badge className="rounded-lg bg-gradient-to-r from-primary to-accent text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" /> Nível {profile!.xp?.current_level ?? 1}
              </Badge>
              <Badge variant="outline" className="rounded-lg">
                <Flame className="h-3 w-3 mr-1 text-orange-500" /> {profile!.streak?.current ?? 0} dias de sequência
              </Badge>
            </div>
            {person.member_since ? (
              <p className="text-sm text-muted-foreground mt-2">Membro desde {formatDate(person.member_since)}</p>
            ) : null}
          </div>
          <div className="text-center sm:text-right">
            <div className="text-3xl font-display font-bold text-foreground">{(profile!.xp?.total_xp ?? 0).toLocaleString('pt-BR')}</div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">XP total</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-card/80 border border-border/50 p-5">
          <Trophy className="h-5 w-5 text-amber-500 mb-2" />
          <div className="text-2xl font-display font-bold text-foreground">{achievements.length}</div>
          <p className="text-sm text-muted-foreground">Conquistas</p>
        </div>
        <div className="rounded-2xl bg-card/80 border border-border/50 p-5">
          <BookOpenCheck className="h-5 w-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-display font-bold text-foreground">{courses.length}</div>
          <p className="text-sm text-muted-foreground">Cursos concluídos</p>
        </div>
        <div className="rounded-2xl bg-card/80 border border-border/50 p-5">
          <Award className="h-5 w-5 text-blue-500 mb-2" />
          <div className="text-2xl font-display font-bold text-foreground">{profile!.certificates_count ?? 0}</div>
          <p className="text-sm text-muted-foreground">Certificados</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-display font-bold text-foreground mb-4">Conquistas</h2>
        {achievements.length === 0 ? (
          <Card className="rounded-2xl bg-card/80 border-border/50">
            <CardContent className="py-10 text-center text-muted-foreground">Nenhuma conquista desbloqueada ainda.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.slug}
                className="rounded-2xl bg-card/80 border border-border/50 p-4 text-center"
                title={achievement.description ?? achievement.name}
              >
                <div className={`mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br ${achievement.gradient} flex items-center justify-center mb-3`}>
                  <span className="text-xl" role="img" aria-label={achievement.name}>{achievement.icon}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">{achievement.name}</p>
                <p className="text-xs text-muted-foreground mt-1">+{achievement.xp_reward} XP</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-display font-bold text-foreground mb-4">Cursos concluídos</h2>
        {courses.length === 0 ? (
          <Card className="rounded-2xl bg-card/80 border-border/50">
            <CardContent className="py-10 text-center text-muted-foreground">Nenhum curso concluído até agora.</CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {courses.map((course) => (
              <li key={course.slug} className="flex items-center justify-between gap-4 rounded-2xl bg-card/80 border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BookOpenCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="font-medium text-foreground">{course.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">{formatDate(course.completed_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default PublicProfile;