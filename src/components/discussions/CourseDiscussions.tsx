import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDiscussions, Discussion, DiscussionReply } from '@/hooks/useDiscussions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Plus,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CourseDiscussionsProps {
  courseId: string;
  lessonId?: string;
}

const DiscussionCard = ({
  discussion,
  onVote,
  onReply,
  fetchReplies,
  markAsAnswer,
  currentUserId,
}: {
  discussion: Discussion;
  onVote: (type: 'discussion' | 'reply', id: string, voteType: 'up' | 'down') => void;
  onReply: (discussionId: string, content: string) => Promise<any>;
  fetchReplies: (discussionId: string) => Promise<DiscussionReply[]>;
  markAsAnswer: (replyId: string, discussionId: string) => void;
  currentUserId?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleExpand = async () => {
    if (!expanded) {
      setLoadingReplies(true);
      const fetchedReplies = await fetchReplies(discussion.id);
      setReplies(fetchedReplies);
      setLoadingReplies(false);
    }
    setExpanded(!expanded);
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;
    setSubmitting(true);
    const result = await onReply(discussion.id, newReply);
    if (result) {
      setNewReply('');
      const fetchedReplies = await fetchReplies(discussion.id);
      setReplies(fetchedReplies);
    }
    setSubmitting(false);
  };

  const isOwner = currentUserId === discussion.user_id;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50 hover:bg-card/80 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={discussion.user_avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {discussion.user_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">{discussion.user_name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true, locale: ptBR })}
              </span>
              {discussion.is_resolved && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Resolvido
                </Badge>
              )}
            </div>

            <h4 className="font-semibold text-foreground mb-2">{discussion.title}</h4>
            <p className="text-sm text-muted-foreground">{discussion.content}</p>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:text-emerald-500"
                  onClick={() => onVote('discussion', discussion.id, 'up')}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[2ch] text-center">{discussion.upvotes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:text-rose-500"
                  onClick={() => onVote('discussion', discussion.id, 'down')}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleExpand}
              >
                <MessageCircle className="h-4 w-4" />
                {discussion.replies_count || 0} respostas
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/50 bg-muted/30">
          {loadingReplies ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {replies.length > 0 && (
                <div className="divide-y divide-border/30">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 pl-16 ${reply.is_answer ? 'bg-emerald-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarImage src={reply.user_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {reply.user_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm">{reply.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                            {reply.is_answer && (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Melhor resposta
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-foreground">{reply.content}</p>

                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 hover:text-emerald-500"
                                onClick={() => onVote('reply', reply.id, 'up')}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <span className="text-xs font-medium">{reply.upvotes}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 hover:text-rose-500"
                                onClick={() => onVote('reply', reply.id, 'down')}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {isOwner && !reply.is_answer && !discussion.is_resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                                onClick={() => markAsAnswer(reply.id, discussion.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Marcar como resposta
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 pl-16 flex gap-2">
                <Input aria-label="Escrever resposta"
                  placeholder="Escreva sua resposta..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitReply()}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim() || submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CourseDiscussions = ({ courseId, lessonId }: CourseDiscussionsProps) => {
  const { user } = useAuth();
  const {
    discussions,
    loading,
    createDiscussion,
    fetchReplies,
    createReply,
    markAsAnswer,
    vote,
  } = useDiscussions(courseId, lessonId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    const result = await createDiscussion(newTitle, newContent);
    if (result) {
      setNewTitle('');
      setNewContent('');
      setIsDialogOpen(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">Fórum de Discussão</h3>
            <p className="text-sm text-muted-foreground">
              {discussions.length} {discussions.length === 1 ? 'pergunta' : 'perguntas'}
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fazer uma Pergunta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="discussion-title" className="text-sm font-medium">Título</label>
                <Input id="discussion-title"
                  placeholder="Resuma sua dúvida em uma frase..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Detalhes</label>
                <Textarea
                  placeholder="Descreva sua dúvida com mais detalhes..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateDiscussion}
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Pergunta'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {discussions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium text-foreground mb-1">Nenhuma pergunta ainda</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Seja o primeiro a fazer uma pergunta!
          </p>
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Fazer Pergunta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              onVote={vote}
              onReply={createReply}
              fetchReplies={fetchReplies}
              markAsAnswer={markAsAnswer}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseDiscussions;
