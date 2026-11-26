import { useMemo, useState } from 'react';
import { useCategoryLeaderboard, CategoryLeaderboardEntry } from '@/hooks/useCategoryLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RankBadge from '@/components/RankBadge';
import { Award, Layers, Loader2, Trophy } from 'lucide-react';

interface CategoryLeaderboardProps {
  limit?: number;
}

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

const activityLabel = (entry: CategoryLeaderboardEntry) => {
  const courses = entry.completed_courses === 1 ? '1 curso' : `${entry.completed_courses} cursos`;
  const lessons = entry.completed_lessons === 1 ? '1 aula' : `${entry.completed_lessons} aulas`;
  return `${courses} · ${lessons}`;
};

const EntryRow = ({ entry }: { entry: CategoryLeaderboardEntry }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${podiumClass(entry.rank)}`}>
    <div className="w-10 flex items-center justify-center">
      <RankBadge rank={entry.rank} size={entry.rank <= 3 ? 'md' : 'sm'} />
    </div>
    <Avatar className="h-9 w-9 border border-primary/30">
      <AvatarImage src={entry.avatar_url || undefined} alt="" />
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground text-xs font-bold">
        {entry.display_name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{entry.display_name}</p>
      <p className="text-xs text-muted-foreground">{activityLabel(entry)}</p>
    </div>
  </div>
);

const CategoryLeaderboard = ({ limit = 3 }: CategoryLeaderboardProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const { groups, loading, error } = useCategoryLeaderboard(undefined, 10);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.categoryId === selected) ?? null,
    [groups, selected]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
        <p className="text-sm text-muted-foreground">Não foi possível carregar o ranking por categoria.</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
        <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h4 className="font-medium text-foreground mb-1">Ainda não há especialistas</h4>
        <p className="text-sm text-muted-foreground">
          Conclua cursos para aparecer como referência na sua área.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Especialistas por Área</h3>
          <p className="text-sm text-muted-foreground">Quem mais concluiu cursos em cada categoria</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            selected === null
              ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas
        </button>
        {groups.map((group) => (
          <button
            key={group.categoryId}
            type="button"
            onClick={() => setSelected(group.categoryId)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              selected === group.categoryId
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: group.categoryColor ?? '#8b5cf6' }}
            />
            {group.categoryName}
          </button>
        ))}
      </div>

      {selectedGroup ? (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Top {Math.min(selectedGroup.entries.length, 10)} em {selectedGroup.categoryName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedGroup.entries.map((entry) => (
              <EntryRow key={entry.user_id} entry={entry} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.categoryId} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: group.categoryColor ?? '#8b5cf6' }}
                    />
                    {group.categoryName}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {group.entries.length} {group.entries.length === 1 ? 'aluno' : 'alunos'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.entries.slice(0, limit).map((entry) => (
                  <EntryRow key={entry.user_id} entry={entry} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryLeaderboard;