import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserXP } from '@/hooks/useUserXP';
import { useAchievements } from '@/hooks/useAchievements';
import { useCertificates } from '@/hooks/useCertificates';
import { useWallet } from '@/hooks/useWallet';
import { categoryLabel } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import IconTooltip from '@/components/ui/icon-tooltip';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import LevelProgress from '@/components/LevelProgress';
import { CertificateCard } from '@/components/CertificateCard';

// Lazy load heavy widgets
const AchievementsGrid = lazy(() => import('@/components/AchievementsGrid'));
const XPEvolutionChart = lazy(() => import('@/components/XPEvolutionChart'));
const PerformanceComparisonWidget = lazy(() => import('@/components/analytics/PerformanceComparisonWidget'));
const PersonalImpactWidget = lazy(() => import('@/components/profile/PersonalImpactWidget'));
const ActivityTimeline = lazy(() => import('@/components/activity/ActivityTimeline'));
const ExportProgress = lazy(() => import('@/components/export/ExportProgress'));
import { calculateUserLevel } from '@/lib/levelSystem';
import EmptyState from '@/components/EmptyState';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { ProfileSkeleton, DashboardStatsSkeleton, AchievementsGridSkeleton, CertificateCardSkeleton, ChartSkeleton } from '@/components/skeletons/PageSkeletons';
import { GraduationCap, LogOut, ArrowLeft, Sparkles, Trophy, BookOpen, Target, Flame, TrendingUp, Award, Star, CheckCircle, Clock, BarChart3, Download, Loader2, Globe, Link2, Info, Package } from 'lucide-react';
import { toast } from 'sonner';
import LanguageToggle from '@/components/LanguageToggle';

interface UserStats { totalLessonsCompleted: number; totalCoursesCompleted: number; totalCoursesInProgress: number; totalWatchedMinutes: number; memberSince: string; }
interface Certificate { id: string; user_id: string; course_id: string; verification_code: string; issued_at: string; user_name: string; course_title: string; }

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { userXP, totalXP, loading: loadingXP } = useUserXP();
  const { achievements, isUnlocked, unlockedCount, totalCount } = useAchievements();
  const { getUserCertificates } = useCertificates();
  const { data: carteira, isLoading: carregandoColecao, isError: erroColecao } = useWallet();
  const itensColecao = (carteira?.colecao ?? []).filter((item) => item.category !== 'power_up');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoadingStats(true);
      try {
        const [lessonsRes, coursesRes, profileRes, userCertificates] = await Promise.all([
          supabase.from('user_lesson_progress').select('is_completed, watched_seconds').eq('user_id', user.id),
          supabase.from('user_course_progress').select('progress_percentage').eq('user_id', user.id),
          supabase.from('profiles').select('created_at, avatar_url, is_public').eq('user_id', user.id).maybeSingle(),
          getUserCertificates(user.id),
        ]);
        setStats({
          totalLessonsCompleted: lessonsRes.data?.filter(l => l.is_completed).length || 0,
          totalCoursesCompleted: coursesRes.data?.filter(c => c.progress_percentage === 100).length || 0,
          totalCoursesInProgress: coursesRes.data?.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length || 0,
          totalWatchedMinutes: Math.round((lessonsRes.data?.reduce((acc, l) => acc + (l.watched_seconds || 0), 0) || 0) / 60),
          memberSince: profileRes.data?.created_at || user.created_at,
        });
        setCertificates(userCertificates);
        setAvatarUrl(profileRes.data?.avatar_url ?? null);
        setIsPublic(Boolean(profileRes.data?.is_public));
      } catch { /* Silent fail */ } finally { setLoadingStats(false); }
    };
    fetchStats();
  }, [user, getUserCertificates]);

  const handleSignOut = async () => {
      if (signingOut) return;
      setSigningOut(true);
      try {
        await signOut();
        toast.success('Até logo!');
        navigate('/');
      } finally {
        setSigningOut(false);
      }
    };

  const handleExport = async () => {
      if (exporting) return;
      setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao exportar';
      toast.error(msg);
      } finally {
        setExporting(false);
    }
  };

        const handleTogglePublic = async (next: boolean) => {
          if (!user || savingVisibility) return;
          const previous = isPublic;
          setSavingVisibility(true);
          setIsPublic(next);
          const { error } = await supabase.from('profiles').update({ is_public: next }).eq('user_id', user.id);
          if (error) {
            setIsPublic(previous);
            toast.error('Não foi possível atualizar a visibilidade do perfil');
          } else {
            toast.success(next ? 'Perfil público ativado' : 'Perfil agora é privado');
          }
          setSavingVisibility(false);
        };

        const handleCopyPublicLink = async () => {
          if (!user) return;
          const url = `${window.location.origin}/usuario/${user.id}`;
          try {
            await navigator.clipboard.writeText(url);
            toast.success('Link do perfil copiado');
          } catch {
            toast.error('Não foi possível copiar o link');
          }
        };

  if (loading || loadingXP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-50 glass neon-border"><div className="container mx-auto px-4 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-muted animate-pulse" /><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-muted animate-pulse" /><div className="space-y-2"><div className="h-5 w-32 bg-muted rounded animate-pulse" /><div className="h-3 w-20 bg-muted rounded animate-pulse" /></div></div></div><div className="h-10 w-10 rounded-xl bg-muted animate-pulse" /></div></div></header>
        <main className="container mx-auto px-4 py-8 space-y-12"><div className="rounded-[2rem] bg-card/50 border border-border/50 p-8 md:p-12"><ProfileSkeleton /></div><DashboardStatsSkeleton /><div className="space-y-4"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><ChartSkeleton height={300} /></div><div className="space-y-4"><div className="h-8 w-32 bg-muted rounded animate-pulse" /><AchievementsGridSkeleton count={8} /></div></main>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Colaborador';
  const userEmail = user.email || '';
  const userLevel = calculateUserLevel(totalXP);
  const memberSinceDate = stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }) : '';

  const xpBreakdown = [
    { label: 'Aulas', value: userXP?.xp_from_lessons || 0, icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', color: 'text-blue-500' },
    { label: 'Cursos', value: userXP?.xp_from_courses || 0, icon: Trophy, gradient: 'from-amber-500 to-orange-500', color: 'text-amber-500' },
    { label: 'Conquistas', value: userXP?.xp_from_achievements || 0, icon: Award, gradient: 'from-purple-500 to-pink-500', color: 'text-purple-500' },
    { label: 'Sequências', value: userXP?.xp_from_streaks || 0, icon: Flame, gradient: 'from-rose-500 to-red-500', color: 'text-rose-500' },
  ];

  const statCards = [
      { label: 'Aulas Conclu\u00eddas', value: stats?.totalLessonsCompleted || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', tooltip: 'Total de aulas marcadas como conclu\u00eddas' },
      { label: 'Cursos Conclu\u00eddos', value: stats?.totalCoursesCompleted || 0, icon: Trophy, gradient: 'from-amber-500 to-orange-500', tooltip: 'Cursos com 100% das aulas conclu\u00eddas' },
      { label: 'Em Progresso', value: stats?.totalCoursesInProgress || 0, icon: TrendingUp, gradient: 'from-blue-500 to-cyan-500', tooltip: 'Cursos come\u00e7ados e ainda n\u00e3o finalizados' },
      { label: 'Minutos Assistidos', value: stats?.totalWatchedMinutes || 0, icon: Clock, gradient: 'from-purple-500 to-pink-500', tooltip: 'Tempo total de v\u00eddeo assistido nas aulas' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 glass neon-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" aria-label="Voltar ao painel" onClick={() => navigate('/dashboard')} className="rounded-xl hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Button>
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" /><div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button"><GraduationCap className="h-6 w-6 text-white" /></div></div>
                <div><h1 className="font-display font-bold text-xl text-foreground tracking-tight">MULTIPLI<span className="text-gradient neon-text">XE</span></h1><p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p></div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="rounded-xl">
                              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Exportar dados
              </Button>
                            <Button variant="outline" size="icon" onClick={handleSignOut} disabled={signingOut} className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive h-11 w-11" aria-label="Sair">
                              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        <ProfileHeader userName={userName} userEmail={userEmail} totalXP={totalXP} levelIcon={userLevel.currentLevel.icon} levelNumber={userLevel.currentLevel.level} memberSinceDate={memberSinceDate} avatarUrl={avatarUrl} onAvatarChange={setAvatarUrl} />

        <section className="mb-12">
          <div className="rounded-2xl bg-card/80 border border-border/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 self-start">
              <Globe className="h-6 w-6 text-violet-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-foreground">Perfil público</h3>
              <p className="text-sm text-muted-foreground">
                Mostra seu nome, nível, XP, sequência, conquistas e cursos concluídos em um link que qualquer pessoa pode abrir. E-mail nunca é exibido.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isPublic && (
                <Button variant="outline" size="sm" onClick={handleCopyPublicLink} className="rounded-xl" disabled={savingVisibility}>
                  <Link2 className="h-4 w-4 mr-2" /> Copiar link
                </Button>
              )}
              <div className="flex items-center gap-2">
                {savingVisibility && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch checked={isPublic} onCheckedChange={handleTogglePublic} disabled={savingVisibility} aria-label="Ativar perfil público" />
              </div>
            </div>
          </div>
        </section>
        <section className="mb-12"><LevelProgress totalXP={totalXP} /></section>
        <Suspense fallback={null}><PersonalImpactWidget /></Suspense>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6"><div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"><BarChart3 className="h-6 w-6 text-emerald-500" /></div><div><h3 className="text-2xl font-display font-bold text-foreground">Distribuição de XP</h3><p className="text-sm text-muted-foreground">Como você ganhou seus pontos</p></div></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {xpBreakdown.map((item) => { const IC = item.icon; const pct = totalXP > 0 ? Math.round((item.value / totalXP) * 100) : 0; return (
              <div key={item.label} className="group relative p-6 rounded-2xl bg-card/80 border border-border/50 neon-card hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4"><div className={`p-2 rounded-xl bg-gradient-to-br ${item.gradient}`}><IC className="h-5 w-5 text-white" /></div><span className="text-sm font-medium text-muted-foreground">{item.label}</span></div>
                <div className="mb-3"><span className={`text-2xl font-display font-bold ${item.color}`}>{item.value}</span><span className="text-muted-foreground ml-1">XP</span></div>
                <div className="space-y-1"><Progress value={pct} className="h-2" /><span className="text-xs text-muted-foreground">{pct}% do total</span></div>
              </div>
            ); })}
          </div>
        </section>

        <section className="mb-12"><Suspense fallback={<ChartSkeleton height={300} />}><XPEvolutionChart /></Suspense></section>

        <section className="mb-12"><Suspense fallback={<ChartSkeleton height={320} />}><PerformanceComparisonWidget /></Suspense></section>

                <section className="mb-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"><Target className="h-6 w-6 text-blue-500" /></div><div><h3 className="text-2xl font-display font-bold text-foreground">Estatísticas</h3><p className="text-sm text-muted-foreground">Seu progresso de aprendizado</p></div></div><Suspense fallback={null}><ExportProgress /></Suspense></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => { const IC = stat.icon; return (
              <div key={stat.label} className="group relative p-6 rounded-2xl bg-card/80 border border-border/50 neon-card hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}><IC className="h-6 w-6 text-white" /></div>
                            <div className="text-3xl font-display font-bold text-foreground mb-1">{stat.value}</div>
                            <div className="flex items-center gap-1"><p className="text-sm text-muted-foreground">{stat.label}</p>
                              <IconTooltip label={stat.tooltip}>
                                <span className="text-muted-foreground/50 hover:text-primary transition-colors" aria-label={stat.tooltip}><Info className="h-3.5 w-3.5" /></span>
                              </IconTooltip>
                            </div>
              </div>
            ); })}
          </div>
        </section>

        <section className="mb-12">
                  <div className="flex items-center gap-4 mb-6"><div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"><Clock className="h-6 w-6 text-primary" /></div><div><h3 className="text-2xl font-display font-bold text-foreground">Atividade Recente</h3><p className="text-sm text-muted-foreground">Aulas, cursos e conquistas dos seus últimos passos</p></div></div>
                  <div className="rounded-2xl bg-card/80 border border-border/50 neon-card p-6">
                    <Suspense fallback={<div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="flex gap-4 animate-pulse"><div className="w-10 h-10 rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 w-32 bg-muted rounded" /><div className="h-3 w-48 bg-muted rounded" /></div></div>))}</div>}>
                      <ActivityTimeline limit={8} />
                    </Suspense>
                  </div>
                </section>

                <section className="mb-12">
          <div className="flex items-center gap-4 mb-6"><div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20"><Award className="h-6 w-6 text-amber-500" /></div><div><h3 className="text-2xl font-display font-bold text-foreground">Certificados</h3><p className="text-sm text-muted-foreground">{certificates.length > 0 ? `${certificates.length} certificado${certificates.length !== 1 ? 's' : ''} emitido${certificates.length !== 1 ? 's' : ''}` : 'Complete cursos para receber certificados'}</p></div></div>
          {certificates.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{certificates.map((cert) => <CertificateCard key={cert.id} certificate={cert} />)}</div> : <div className="rounded-2xl border border-border/50 bg-card/50 neon-card"><EmptyState type="certificates" actionLabel="Explorar cursos" onAction={() => navigate('/catalogo')} /></div>}
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/10 to-fuchsia-500/10 border border-sky-500/20"><Package className="h-6 w-6 text-sky-500" /></div><div><h3 className="text-2xl font-display font-bold text-foreground">Minha coleção</h3><p className="text-sm text-muted-foreground">{carregandoColecao ? 'Carregando seus itens...' : erroColecao ? 'Não foi possível carregar seus itens agora' : itensColecao.length > 0 ? `${itensColecao.length} ${itensColecao.length !== 1 ? 'itens' : 'item'} de avatar, tema ou cosmético` : 'Itens de avatar, tema e cosmético comprados na loja'}</p></div></div>
            <Button variant="outline" size="sm" asChild><Link to="/loja">Abrir loja</Link></Button>
          </div>
          {carregandoColecao || erroColecao ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[76px] rounded-2xl border border-border/50 bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : itensColecao.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {itensColecao.map((item) => (
                <div key={item.item_id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/50 neon-card p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">{item.icon || '🎁'}</div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel(item.category)}{item.quantidade > 1 ? ` · ${item.quantidade}x` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card/50 neon-card p-6 text-sm text-muted-foreground">
              Você ainda não tem itens. Ganhe moedas estudando e troque na loja de recompensas.
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"><Trophy className="h-6 w-6 text-amber-500" /></div><div><h3 className="text-2xl font-display font-bold text-foreground">Conquistas</h3><p className="text-sm text-muted-foreground">{unlockedCount} de {totalCount} desbloqueadas</p></div></div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20"><Star className="h-4 w-4 text-amber-500" /><span className="text-sm font-semibold text-amber-500">{Math.round((unlockedCount / totalCount) * 100) || 0}%</span></div>
          </div>
          <Suspense fallback={<AchievementsGridSkeleton count={8} />}>
            <AchievementsGrid achievements={achievements} isUnlocked={isUnlocked} />
          </Suspense>
        </section>
      </main>
    </div>
  );
};

export default Profile;
