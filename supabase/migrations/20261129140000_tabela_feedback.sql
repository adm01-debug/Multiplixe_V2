-- O componente FeedbackWidget (305 linhas: escolha de tipo -> humor -> mensagem -> sucesso)
-- nunca persistia nada: o envio era um setTimeout de 1s com o comentario
-- "In a real app, you'd save this to a feedback table". Aqui esta a tabela que faltava,
-- com RLS: o aluno grava o proprio feedback e o admin faz a triagem.

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  humor TEXT,
  mensagem TEXT NOT NULL,
  pagina TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  nota_interna TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_tipo_valido CHECK (tipo IN ('bug', 'idea', 'question', 'general')),
  CONSTRAINT feedback_humor_valido CHECK (humor IS NULL OR humor IN ('happy', 'neutral', 'sad')),
  CONSTRAINT feedback_mensagem_nao_vazia CHECK (length(btrim(mensagem)) > 0),
  CONSTRAINT feedback_mensagem_tamanho CHECK (length(mensagem) <= 4000),
  CONSTRAINT feedback_status_valido CHECK (status IN ('novo', 'em_analise', 'resolvido'))
);

COMMENT ON TABLE public.feedback IS 'Feedback enviado pelos alunos pelo botao flutuante (bug, sugestao, duvida, geral).';
COMMENT ON COLUMN public.feedback.humor IS 'Satisfacao declarada no segundo passo do widget: happy, neutral ou sad.';
COMMENT ON COLUMN public.feedback.pagina IS 'Rota onde o aluno estava ao enviar (window.location.pathname).';
COMMENT ON COLUMN public.feedback.nota_interna IS 'Anotacao do admin na triagem; nao e exibida ao aluno.';

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_novos ON public.feedback (created_at DESC) WHERE status = 'novo';

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.feedback;
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aluno envia o proprio feedback" ON public.feedback;
CREATE POLICY "Aluno envia o proprio feedback"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Aluno le o proprio feedback" ON public.feedback;
CREATE POLICY "Aluno le o proprio feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins leem todo o feedback" ON public.feedback;
CREATE POLICY "Admins leem todo o feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins triam o feedback" ON public.feedback;
CREATE POLICY "Admins triam o feedback"
  ON public.feedback FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins excluem feedback" ON public.feedback;
CREATE POLICY "Admins excluem feedback"
  ON public.feedback FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT UPDATE, DELETE ON public.feedback TO authenticated;
REVOKE ALL ON public.feedback FROM anon;