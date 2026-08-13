import { Link } from 'react-router-dom';
import PrefetchLink, { usePrefetchQuery } from '@/components/PrefetchLink';
import NotificationBell from '@/components/NotificationBell';
import CacheIndicator from '@/components/ui/CacheIndicator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GraduationCap, Trophy, LogOut, Sparkles, Zap, ShieldAlert, Route } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import { useT } from '@/lib/i18n';

interface Props {
  userName: string;
  totalXP: number;
  isAdmin: boolean;
  coursesStale: boolean;
  coursesFetching: boolean;
  onRefreshCourses: () => void;
  onSignOut: () => void;
}

const DashboardHeader = ({ userName, totalXP, isAdmin, coursesStale, coursesFetching, onRefreshCourses, onSignOut }: Props) => {
  const { prefetchCatalog, prefetchLearningPaths, prefetchLeaderboard } = usePrefetchQuery();
  const { t } = useT();

  return (
    <header className="sticky top-0 z-50 glass neon-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:opacity-70 dark:group-hover:opacity-100" />
              <div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center pulse-glow">
                <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                MULTIPLI<span className="text-gradient neon-text">XE</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-2xl neon-border">
            <PrefetchLink to="/dashboard" prefetch="intent" className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg neon-button">
              {t('nav.dashboard')}
            </PrefetchLink>
            <PrefetchLink to="/catalogo" prefetch="intent" onPrefetchData={prefetchCatalog} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors">
              {t('nav.catalog')}
            </PrefetchLink>
            <PrefetchLink to="/ranking" prefetch="intent" onPrefetchData={prefetchLeaderboard} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />{t('nav.ranking')}
            </PrefetchLink>
            <PrefetchLink to="/trilhas" prefetch="intent" onPrefetchData={prefetchLearningPaths} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors flex items-center gap-1.5">
              <Route className="h-4 w-4" />{t('nav.paths')}
            </PrefetchLink>
            {isAdmin && (
              <PrefetchLink to="/admin" prefetch="intent" className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />Admin
              </PrefetchLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><div><NotificationBell /></div></TooltipTrigger><TooltipContent><p>Notificações</p></TooltipContent></Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl dark:border-emerald-500/40 dark:shadow-[0_0_20px_hsl(150_100%_45%/0.2)]">
                    <Zap className="h-4 w-4 text-emerald-500 neon-icon" />
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalXP} XP</span>
                    <CacheIndicator isStale={coursesStale} isFetching={coursesFetching} onRefresh={onRefreshCourses} />
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Seus pontos de experiência totais</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/perfil" className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl neon-border hover:bg-muted transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm neon-button">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{userName}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Ver meu perfil</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onSignOut} className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 h-11 w-11 neon-border">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Sair da conta</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
