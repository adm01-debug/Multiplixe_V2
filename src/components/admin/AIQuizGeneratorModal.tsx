import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneratedQuestion {
  question_text: string;
  explanation: string;
  options: { option_text: string; is_correct: boolean }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (questions: GeneratedQuestion[]) => void;
}

const AIQuizGeneratorModal = ({ open, onOpenChange, onAccept }: Props) => {
  const [content, setContent] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<GeneratedQuestion[]>([]);

  const handleGenerate = async () => {
    if (content.trim().length < 100) {
      toast.error("Conteúdo precisa de pelo menos 100 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-quiz-generator", {
        body: { content, count },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const questions = (data?.questions ?? []) as GeneratedQuestion[];
      if (questions.length === 0) throw new Error("IA não retornou questões");
      setPreview(questions);
      toast.success(`${questions.length} questões geradas!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    onAccept(preview);
    setPreview([]);
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Gerar quiz com IA
          </DialogTitle>
        </DialogHeader>

        {preview.length === 0 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-content">Conteúdo de referência</Label>
              <Textarea
                id="ai-content"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole aqui transcrição da aula, resumo do curso ou conteúdo relevante (mín. 100 caracteres)"
              />
              <p className="text-xs text-muted-foreground mt-1">{content.length} caracteres</p>
            </div>
            <div>
              <Label htmlFor="ai-count">Número de questões (1-10)</Label>
              <Input
                id="ai-count"
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
              />
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {preview.map((q, i) => (
              <li key={i} className="rounded-xl border border-border bg-card/50 p-3">
                <p className="font-medium text-sm mb-2">{i + 1}. {q.question_text}</p>
                <ul className="space-y-1 mb-2">
                  {q.options.map((o, oi) => (
                    <li key={oi} className="flex items-center gap-2 text-xs">
                      {o.is_correct && <Badge variant="default" className="text-[10px]">Correta</Badge>}
                      <span className={o.is_correct ? "text-foreground" : "text-muted-foreground"}>{o.option_text}</span>
                    </li>
                  ))}
                </ul>
                {q.explanation && <p className="text-xs text-muted-foreground italic">{q.explanation}</p>}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          {preview.length === 0 ? (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><Sparkles className="h-4 w-4 mr-2" /> Gerar</>}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPreview([])}>Refazer</Button>
              <Button onClick={handleAccept}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar ao quiz
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIQuizGeneratorModal;
