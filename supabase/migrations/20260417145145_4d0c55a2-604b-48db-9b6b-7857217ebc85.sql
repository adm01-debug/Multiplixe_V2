-- ============================================
-- ONDA 1.1 — Proteger certificates (PII)
-- ============================================

-- Remove policy pública que expõe nomes de todos os usuários
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.learning_path_certificates;

-- Função pública de verificação que retorna apenas o necessário
CREATE OR REPLACE FUNCTION public.verify_certificate_by_code(p_code text)
RETURNS TABLE (
  user_name text,
  course_title text,
  issued_at timestamptz,
  verification_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_name, course_title, issued_at, verification_code
  FROM public.certificates
  WHERE verification_code = upper(p_code)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_path_certificate_by_code(p_code text)
RETURNS TABLE (
  user_name text,
  path_title text,
  issued_at timestamptz,
  verification_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_name, path_title, issued_at, verification_code
  FROM public.learning_path_certificates
  WHERE verification_code = upper(p_code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_path_certificate_by_code(text) TO anon, authenticated;

-- ============================================
-- ONDA 1.2 — Proteger gabaritos de quiz
-- ============================================

-- Remove leitura pública de quiz_options (expunha is_correct)
DROP POLICY IF EXISTS "Anyone can view options" ON public.quiz_options;

-- View pública sem o gabarito
CREATE OR REPLACE VIEW public.quiz_options_public
WITH (security_invoker = true)
AS
SELECT id, question_id, option_text, order_index
FROM public.quiz_options;

GRANT SELECT ON public.quiz_options_public TO anon, authenticated;

-- Admins continuam vendo tudo via policy ALL existente; usuários comuns leem via view
CREATE POLICY "Admins can view raw options"
ON public.quiz_options
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para submeter quiz e validar no servidor
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb  -- formato: [{"question_id": "...", "option_id": "..."}]
)
RETURNS TABLE (
  total_questions integer,
  correct_count integer,
  score integer,
  passed boolean,
  passing_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_correct integer;
  v_score integer;
  v_passing integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT passing_score INTO v_passing FROM public.quizzes WHERE id = p_quiz_id;
  IF v_passing IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  SELECT count(*) INTO v_total FROM public.quiz_questions WHERE quiz_id = p_quiz_id;

  SELECT count(*) INTO v_correct
  FROM jsonb_array_elements(p_answers) AS a
  JOIN public.quiz_options o
    ON o.id = (a->>'option_id')::uuid
   AND o.question_id = (a->>'question_id')::uuid
  JOIN public.quiz_questions q
    ON q.id = o.question_id
   AND q.quiz_id = p_quiz_id
  WHERE o.is_correct = true;

  v_score := CASE WHEN v_total = 0 THEN 0 ELSE (v_correct * 100 / v_total) END;

  RETURN QUERY SELECT
    v_total,
    v_correct,
    v_score,
    v_score >= v_passing,
    v_passing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- ============================================
-- ONDA 1.3 — Proteger login_attempts
-- ============================================

DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can update login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can view login attempts for validation" ON public.login_attempts;

-- Resta apenas: "Only admins can view login attempts for audit"
-- Inserts/updates agora só via funções SECURITY DEFINER existentes
-- (record_failed_login, reset_login_attempts, check_login_allowed)

-- Garante que as funções existentes possam ser chamadas anonimamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_failed_login') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.record_failed_login(text, inet) TO anon, authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_login_allowed') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_login_allowed(text) TO anon, authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reset_login_attempts') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.reset_login_attempts(text) TO anon, authenticated';
  END IF;
END $$;