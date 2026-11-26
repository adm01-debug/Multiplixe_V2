import { useState } from 'react';
import { useLeague, LeagueRefreshResult } from '@/hooks/useLeague';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RankBadge from '@/components/RankBadge';
import {
  changeLabel,
  formatLeagueReset,
  formatLeagueWeek,
  leagueMeta,
  nextLeague,
  xpToGoal,
  zoneLabel,
  zoneOf,
} from '@/lib/leagues';
import { ArrowDown, ArrowUp, Crown, Loader2, RefreshCw, Shield, Trophy, Zap } from 'lucide-react';

const podiumClass = (rank: number) => {
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
};

const LeaguePanel = () => {
  const { league, loading, error, refetch, recalc } = useLeague();
  const { isAdmin } = useAdminRole();
  const [recalcing, setRecalcing] = useState(false);
  const [recalcResult, setRecalcResult] = useState<LeagueRefreshResult | null>(null);
  const [recalcError, setRecalcError] = useState<string | null>(null);

  const handleRecalc = async () => {
    setRecalcing(true);
    setRecalcError(null);
    const { error: recalcFail, result } = await recalc();
    setRecalcing(false);
    if (recalcFail) {
      setRecalcError(recalcFail);
      setRecalcResult(null);
      return;
    }
    setRecalcResult(result ?? null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        Carregando sua liga...
      </div>
    );
  }

  if (error || !league) {
    return (
      <Card className="neon-card">
        <CardContent className="py-10 text-center space-y-4">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{error || 'Nao foi possivel carregar sua liga'}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const meta = leagueMeta(league.liga);
  const zona = zoneOf(league.posicao, league.total_jogadores, league.zona_promocao, league.zona_rebaixamento, league.minimo_jogadores);
  const proxima = nextLeague(league.liga);
  const semana = formatLeagueWeek(league.semana_inicio, league.semana_fim);
  const virada = formatLeagueReset(league.atualiza_em);
  const aviso = changeLabel(league.ultima_mudanca?.tipo);
  const progresso = xpToGoal(league.xp_semana);
  const poucosJogadores = league.total_jogadores < league.minimo_jogadores;

  return (
    <div className="space-y-8">
      <Card className={`neon-card ring-1 ${meta.ring}`}>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border text-3xl ${meta.badge}`} aria-hidden="true">
                {meta.emoji}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sua liga nesta semana</p>
                <h2 className="text-2xl font-bold neon-text">{meta.label}</h2>
                <p className="text-xs text-muted-foreground">
                  {semana && `Semana de ${semana}`}
                  {virada && ` · ${virada}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Sua posicao</p>
              <p className="text-3xl font-bold neon-text">#{league.posicao}</p>
              <p className="text-xs text-muted-foreground">de {league.total_jogadores} na liga</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                XP desta semana
              </div>
              <p className="text-2xl font-bold neon-text mt-1">{league.xp_semana.toLocaleString('pt-BR')}</p>
              <div className="h-2 mt-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progresso}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progresso}% da meta semanal de 1.000 XP</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Zona atual
              </div>
              <p className={`text-lg font-semibold mt-1 ${zona === 'promocao' ? 'text-emerald-400' : zona === 'rebaixamento' ? 'text-red-400' : ''}`}>
                {zoneLabel(zona)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Top {league.zona_promocao} sobem, ultimos {league.zona_rebaixamento} caiam
              </p>
              {poucosJogadores && (
                <p className="text-xs text-amber-400 mt-1">
                  A liga precisa de {league.minimo_jogadores} jogadores para valer promocao
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-4 w-4" />
                Proxima liga
              </div>
              <p className="text-lg font-semibold mt-1">
                {proxima ? `${leagueMeta(proxima).emoji} ${leagueMeta(proxima).label}` : 'Voce esta no topo'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {proxima ? `Fique entre os ${league.zona_promocao} primeiros para subir` : 'Nao ha liga acima de Diamante'}
              </p>
            </div>
          </div>

          {aviso && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/30 text-sm">
              {league.ultima_mudanca?.tipo === 'promovido' ? (
                <ArrowUp className="h-4 w-4 text-emerald-400" />
              ) : league.ultima_mudanca?.tipo === 'rebaixado' ? (
                <ArrowDown className="h-4 w-4 text-red-400" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{aviso}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Ranking da {meta.label}</h2>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRecalc} disabled={recalcing}>
                {recalcing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Recalcular ligas agora
              </Button>
            </div>
          )}
        </div>

        {recalcError && <p className="text-sm text-red-400">Falha ao recalcular: {recalcError}</p>}
        {recalcResult && (
          <p className="text-sm text-muted-foreground">
            Semana {recalcResult.semana}: {recalcResult.processados} jogadores avaliados, {recalcResult.promovidos} promovidos,{' '}
            {recalcResult.rebaixados} rebaixados e {recalcResult.novos_participantes} novos participantes.
          </p>
        )}

        {league.ranking.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Ainda nao ha jogadores na {meta.label}. Ganhe XP nesta semana para aparecer no ranking da sua liga.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {league.ranking.map((entry) => {
              const entryZona = zoneOf(
                entry.posicao,
                league.total_jogadores,
                league.zona_promocao,
                league.zona_rebaixamento,
                league.minimo_jogadores,
              );

              return (
                <div key={entry.user_id}>
                  {entry.posicao === league.zona_promocao + 1 && league.total_jogadores > league.zona_promocao && (
                    <div className="flex items-center gap-2 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      Fim da zona de promocao
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                      ${podiumClass(entry.posicao)}
                      ${entry.eu ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      hover:scale-[1.01]
                    `}
                  >
                    <div className="w-14 flex items-center justify-center">
                      <RankBadge rank={entry.posicao} size={entry.posicao <= 3 ? 'md' : 'sm'} />
                    </div>

                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold">
                        {entry.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${entry.eu ? 'text-primary' : ''}`}>
                        {entry.nome}
                        {entry.eu && <span className="text-xs ml-2 text-muted-foreground">(voce)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{zoneLabel(entryZona)}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg neon-text">{entry.xp_semana.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-muted-foreground">XP na semana</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaguePanel;