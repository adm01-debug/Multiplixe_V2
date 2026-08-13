import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Send, Pencil, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  usePlaybookComments,
  useAddPlaybookComment,
  useDeletePlaybookComment,
  useUpdatePlaybookComment,
} from "@/hooks/usePlaybookComments";

interface Props {
  playbookId: string;
}

const PlaybookComments = ({ playbookId }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { data: comments = [], isLoading } = usePlaybookComments(playbookId);
  const add = useAddPlaybookComment(playbookId);
  const remove = useDeletePlaybookComment(playbookId);
  const update = useUpdatePlaybookComment(playbookId);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await add.mutateAsync(content);
    setContent("");
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setEditContent(current);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await update.mutateAsync({ id: editingId, content: editContent });
    setEditingId(null);
  };

  return (
    <section aria-labelledby="comments-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="comments-heading" className="text-2xl font-bold mb-4">
        Comentários ({comments.length})
      </h2>

      {user && (
        <div className="mb-6 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compartilhe sua experiência ou dúvida..."
            maxLength={2000}
            rows={3}
            aria-label="Novo comentário"
            data-comment-input
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/2000</span>
            <Button onClick={handleSubmit} disabled={add.isPending || !content.trim()} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Seja o primeiro a comentar.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const canDelete = user?.id === c.user_id || isAdmin;
            const canEdit = user?.id === c.user_id;
            const wasEdited = c.updated_at && c.updated_at !== c.created_at;
            const isEditing = editingId === c.id;
            return (
              <li key={c.id} className="flex gap-3 p-4 rounded-xl border border-border bg-card/50">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={c.author_avatar ?? undefined} alt="" />
                  <AvatarFallback>{(c.author_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.author_name ?? "Usuário"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                      {wasEdited && (
                        <span className="text-[10px] text-muted-foreground italic">(editado)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEdit(c.id, c.content)}
                          aria-label="Editar comentário"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => remove.mutate(c.id)}
                          aria-label="Excluir comentário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        aria-label="Editar comentário"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={saveEdit} disabled={update.isPending || !editContent.trim()}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PlaybookComments;
