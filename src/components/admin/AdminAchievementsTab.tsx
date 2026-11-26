import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_GRADIENTS,
  ACHIEVEMENT_ICONS,
  ACHIEVEMENT_REQUIREMENTS,
  buildAchievementPayload,
  draftFromAchievement,
  emptyAchievementDraft,
  labelForRequirement,
  slugifyAchievement,
  type AchievementDraft,
  type AchievementRow,
  type AchievementUpdate,
} from "@/lib/achievementAdmin";

const AdminAchievementsTab = () => {
  const [rows, setRows] = useState<AchievementRow[]>([]);
  const [unlockCounts, setUnlockCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AchievementRow | null>(null);
  const [draft, setDraft] = useState<AchievementDraft>(emptyAchievementDraft());
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AchievementRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [achievementsRes, unlocksRes] = await Promise.all([
      supabase.from("achievements").select("*").order("requirement_value", { ascending: true }),
      supabase.from("user_achievements").select("achievement_id"),
    ]);

    if (achievementsRes.error || unlocksRes.error) {
      toast.error("Erro ao carregar conquistas");
      setLoading(false);
      return;
    }

    setRows((achievementsRes.data ?? []) as AchievementRow[]);
    const counts: Record<string, number> = {};
    for (const unlock of (unlocksRes.data ?? []) as { achievement_id: string }[]) {
      counts[unlock.achievement_id] = (counts[unlock.achievement_id] ?? 0) + 1;
    }
    setUnlockCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyAchievementDraft());
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (row: AchievementRow) => {
    setEditing(row);
    setDraft(draftFromAchievement(row));
    setErrors([]);
    setFormOpen(true);
  };

  const patchDraft = (patch: Partial<AchievementDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    const { payload, errors: validationErrors } = buildAchievementPayload(draft);
    if (!payload) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    const response = editing
      ? await supabase.from("achievements").update(payload as AchievementUpdate).eq("id", editing.id)
      : await supabase.from("achievements").insert(payload);
    setSaving(false);

    if (response.error) {
      const duplicate = response.error.code === "23505";
      setErrors([duplicate ? "Já existe uma conquista com esse identificador (slug)." : "Erro ao salvar conquista."]);
            toast.error(duplicate ? "Identificador de conquista já usado" : "Erro ao salvar conquista");
      return;
    }

    toast.success(editing ? "Conquista atualizada" : "Conquista criada");
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    const { error } = await supabase.from("achievements").delete().eq("id", deleting.id);
    setDeletingBusy(false);

    if (error) {
      toast.error("Erro ao excluir conquista");
      return;
    }

    toast.success("Conquista excluída");
    setDeleting(null);
    await load();
  };

  const categoryLabel = (value: string) =>
    ACHIEVEMENT_CATEGORIES.find((category) => category.value === value)?.label ?? value;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Conquistas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Catálogo de conquistas dos alunos. A concessão automática acontece quando o requisito é atingido.
            </p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova conquista
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground mb-4">
            Concessão automática suportada: {ACHIEVEMENT_REQUIREMENTS.map((item) => item.label).join(", ")}. Requisitos de
            outros tipos ficam salvos, mas nunca desbloqueiam sozinhos.
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma conquista cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conquista</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Requisito</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Desbloqueios</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">
                          {row.icon}
                        </span>
                        <div>
                          <p className="font-medium leading-tight">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{categoryLabel(row.category)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {labelForRequirement(row.requirement_type, row.requirement_value, row.requirement_category)}
                      {row.is_secret && (
                        <Badge variant="outline" className="ml-2">
                          Secreta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{row.xp_reward} XP</TableCell>
                    <TableCell className="text-sm">{unlockCounts[row.id] ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(row)}
                        aria-label={`Editar ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleting(row)}
                        aria-label={`Excluir ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conquista" : "Nova conquista"}</DialogTitle>
            <DialogDescription>O identificador é usado em links e compartilhamento; mantenha único.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="achievement-name">Nome</Label>
              <Input
                id="achievement-name"
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft((prev) => ({
                    ...prev,
                    name,
                    slug: editing ? prev.slug : slugifyAchievement(name),
                  }));
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="achievement-slug">Identificador (slug)</Label>
              <Input
                id="achievement-slug"
                value={draft.slug}
                onChange={(e) => patchDraft({ slug: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="achievement-description">Descrição</Label>
              <Textarea
                id="achievement-description"
                value={draft.description}
                onChange={(e) => patchDraft({ description: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-1">
                {ACHIEVEMENT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={`Ícone ${icon}`}
                    aria-pressed={draft.icon === icon}
                    onClick={() => patchDraft({ icon })}
                    className={cn(
                      "h-9 w-9 rounded-md border text-xl leading-none",
                      draft.icon === icon ? "border-primary bg-primary/10" : "border-border",
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={draft.category} onValueChange={(value) => patchDraft({ category: value })}>
                  <SelectTrigger aria-label="Categoria da conquista">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACHIEVEMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="achievement-xp">XP da recompensa</Label>
                <Input
                  id="achievement-xp"
                  inputMode="numeric"
                  value={draft.xp_reward}
                  onChange={(e) => patchDraft({ xp_reward: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Tipo de requisito</Label>
                <Select value={draft.requirement_type} onValueChange={(value) => patchDraft({ requirement_type: value })}>
                  <SelectTrigger aria-label="Tipo de requisito">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACHIEVEMENT_REQUIREMENTS.map((requirement) => (
                      <SelectItem key={requirement.value} value={requirement.value}>
                        {requirement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="achievement-value">Valor do requisito</Label>
                <Input
                  id="achievement-value"
                  inputMode="numeric"
                  value={draft.requirement_value}
                  onChange={(e) => patchDraft({ requirement_value: e.target.value })}
                />
              </div>
            </div>

                          {draft.requirement_type === "category_courses_completed" && (
                            <div className="space-y-1">
                              <Label htmlFor="achievement-requirement-category">Categoria do requisito</Label>
                              <Input
                                id="achievement-requirement-category"
                                placeholder="Ex.: Vendas"
                                value={draft.requirement_category}
                                onChange={(e) => patchDraft({ requirement_category: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">
                                Conta apenas cursos concluídos cuja categoria tenha exatamente esse nome.
                              </p>
                            </div>
                          )}

                          <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-3">
                            <input
                              id="achievement-secret"
                              type="checkbox"
                              className="mt-0.5 h-4 w-4"
                              checked={draft.is_secret}
                              onChange={(e) => patchDraft({ is_secret: e.target.checked })}
                            />
                            <div>
                              <Label htmlFor="achievement-secret">Conquista secreta</Label>
                              <p className="text-xs text-muted-foreground">
                                Fica oculta no perfil do aluno enquanto não for desbloqueada.
                              </p>
                            </div>
                          </div>

            <div className="space-y-1">
              <Label>Gradiente</Label>
              <div className="flex flex-wrap gap-1">
                {ACHIEVEMENT_GRADIENTS.map((gradient) => (
                  <button
                    key={gradient}
                    type="button"
                    aria-label={`Gradiente ${gradient}`}
                    aria-pressed={draft.gradient === gradient}
                    onClick={() => patchDraft({ gradient })}
                    className={cn(
                      "h-8 w-8 rounded-full bg-gradient-to-br border-2",
                      gradient,
                      draft.gradient === gradient ? "border-foreground" : "border-transparent",
                    )}
                  />
                ))}
              </div>
            </div>

            {errors.length > 0 && (
              <ul role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Salvar alterações" : "Criar conquista"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conquista {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {unlockCounts[deleting?.id ?? ""] ?? 0} aluno(s) já desbloquearam esta conquista. Excluir remove o registro do
                            histórico deles e a conquista sai do perfil. Não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAchievementsTab;