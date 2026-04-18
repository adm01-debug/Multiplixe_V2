import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard, LeaderboardPeriod } from '@/hooks/useLeaderboard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RankBadge from '@/components/RankBadge';
import DepartmentLeaderboard from '@/components/leaderboard/DepartmentLeaderboard';
import EmptyState from '@/components/EmptyState';
import { LeaderboardSkeleton } from '@/components/skeletons/PageSkeletons';
import { ArrowLeft, Trophy, Star, TrendingUp, Users, Calendar, CalendarDays, Infinity, Building2 } from 'lucide-react';
import { calculateUserLevel } from '@/lib/levelSystem';

const periodOptions: { value: LeaderboardPeriod; label: string; icon: typeof Calendar }[] = [
  { value: 'week', label: 'Esta Semana', icon: Calendar },
  { value: 'month', label: 'Este Mês', icon: CalendarDays },
  { value: 'all', label: 'Geral', icon: Infinity },
];

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const { leaderboard, userRank, loading } = useLeaderboard(50, period);

  const getRankBgClass = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
      default:
        return 'bg-card/50 border-border/50';
    }
  }, []);

  const getPeriodLabel = useCallback(() => {
    switch (period) {
      case 'week':
        return 'desta semana';
      case 'month':
        return 'deste mês';
      default:
        return 'de todos os tempos';
    }
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold neon-text">Ranking</h1>
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <LeaderboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold neon-text">Ranking</h1>
                <p className="text-sm text-muted-foreground">Top jogadores {getPeriodLabel()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8 space-y-8">
        {/* Tabs: Individual vs Teams */}
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="individual" className="gap-2">
              <Users className="h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Building2 className="h-4 w-4" />
              Por Departamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-8">
            {/* Period Filter */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-muted/50 rounded-2xl neon-border w-fit">
              {periodOptions.map((option) => {
                const IconComponent = option.icon;
                const isActive = period === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg neon-button' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <IconComponent className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* User's Rank Card */}
            {userRank && userRank.rank > 0 && period === 'all' && (
              <div className="neon-card p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/50">
                      <TrendingUp className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sua posição geral</p>
                      <p className="text-3xl font-bold neon-text">#{userRank.rank}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>de {userRank.total_users} jogadores</span>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Top 50 Jogadores</h2>
              </div>

          {leaderboard.length === 0 ? (
            <EmptyState
              type="leaderboard"
              title={`Ranking ${getPeriodLabel()} vazio`}
              description="Complete lições para aparecer no ranking! Seja um dos primeiros a conquistar o topo."
              actionLabel="Começar a estudar"
              onAction={() => navigate('/catalogo')}
            />
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => {
                const levelData = calculateUserLevel(entry.total_xp);
                const isCurrentUser = user?.id === entry.user_id;

                return (
                  <div
                    key={entry.user_id}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                      ${getRankBgClass(entry.rank)}
                      ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      hover:scale-[1.01]
                    `}
                  >
                    {/* Rank Badge */}
                    <div className="w-14 flex items-center justify-center">
                      <RankBadge rank={entry.rank} size={entry.rank <= 3 ? 'md' : 'sm'} />
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold">
                        {entry.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Level */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {entry.display_name}
                        {isCurrentUser && <span className="text-xs ml-2 text-muted-foreground">(você)</span>}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          Nível {entry.current_level}
                        </span>
                        <span>{levelData.currentLevel.name}</span>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="font-bold text-lg neon-text">{entry.total_xp.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <DepartmentLeaderboard limit={20} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Leaderboard;
