import { Trophy, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { QuizRanking } from './types';

interface Props {
  rankings: QuizRanking[];
}

const QuizRankings = ({ rankings }: Props) => (
  <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Trophy className="h-5 w-5 text-amber-500" />Ranking por Quiz
    </h3>
    {rankings.length === 0 ? (
      <p className="text-muted-foreground text-center py-8">Nenhuma tentativa de quiz registrada ainda.</p>
    ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {rankings.map((ranking) => (
          <div key={ranking.quizId} className="p-4 rounded-xl bg-muted/30">
            <div className="mb-3">
              <h4 className="font-medium">{ranking.courseTitle}</h4>
              <p className="text-sm text-muted-foreground">{ranking.quizTitle}</p>
            </div>
            <div className="space-y-2">
              {ranking.topUsers.map((user, index) => (
                <div key={user.userId} className={`flex items-center gap-3 p-2 rounded-lg ${
                  index === 0 ? 'bg-amber-500/10 border border-amber-500/20' :
                  index === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                  index === 2 ? 'bg-orange-600/10 border border-orange-600/20' : 'bg-background/50'
                }`}>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold">
                    {index < 3 ? <Medal className={`h-5 w-5 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-orange-600'}`} /> :
                      <span className="text-muted-foreground">{index + 1}</span>}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">{user.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.userName}</p>
                    <p className="text-xs text-muted-foreground">{user.attemptCount} tentativa{user.attemptCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={`text-lg font-bold ${user.bestScore >= 90 ? 'text-green-500' : user.bestScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                    {user.bestScore}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default QuizRankings;
