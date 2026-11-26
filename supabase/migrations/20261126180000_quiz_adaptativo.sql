-- FUNC-020: quiz adaptativo.
-- Cada questão passa a ter nível de dificuldade. O servidor calcula a nota
-- ponderada (questão difícil vale mais), o bônus de XP por acerto difícil, o
-- acerto por nível e qual deve ser o nível alvo da próxima tentativa do
-- usuário. A tentativa em si continua com a mesma regra de aprovação de antes
-- (percentual simples de acertos), então nada regride para quem já usa o quiz.

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS difficulty_level text NOT NULL DEFAULT 'medio';

ALTER TABLE public.quiz_questions
  DROP CONSTRAINT IF EXISTS quiz_questions_difficulty_level_check;
ALTER TABLE public.quiz_questions
  ADD CONSTRAINT quiz_questions_difficulty_level_check
  CHECK (difficulty_level IN ('facil', 'medio', 'dificil'));

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_difficulty
  ON public.quiz_questions (quiz_id, difficulty_level, order_index);

-- Histórico por nível: nota ponderada, nível alvo da tentativa e acertos por nível.
ALTER TABLE public.user_quiz_attempts
  ADD COLUMN IF NOT EXISTS weighted_score integer;
ALTER TABLE public.user_quiz_attempts
  ADD COLUMN IF NOT EXISTS difficulty_level text;
ALTER TABLE public.user_quiz_attempts
  ADD COLUMN IF NOT EXISTS by_difficulty jsonb;

ALTER TABLE public.user_quiz_attempts
  DROP CONSTRAINT IF EXISTS user_quiz_attempts_difficulty_level_check;
ALTER TABLE public.user_quiz_attempts
  ADD CONSTRAINT user_quiz_attempts_difficulty_level_check
  CHECK (difficulty_level IS NULL OR difficulty_level IN ('facil', 'medio', 'dificil'));

CREATE OR REPLACE FUNCTION public.quiz_difficulty_weight(p_difficulty text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE lower(coalesce(p_difficulty, 'medio'))
           WHEN 'facil' THEN 1.0
           WHEN 'dificil' THEN 2.0
           ELSE 1.5
         END;
$function$;

CREATE OR REPLACE FUNCTION public.quiz_difficulty_xp_bonus(p_difficulty text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE lower(coalesce(p_difficulty, 'medio'))
           WHEN 'facil' THEN 2
           WHEN 'dificil' THEN 10
           ELSE 5
         END;
$function$;

CREATE OR REPLACE FUNCTION public.quiz_recommended_difficulty(p_weighted integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE
           WHEN coalesce(p_weighted, 0) >= 85 THEN 'dificil'
           WHEN coalesce(p_weighted, 0) >= 60 THEN 'medio'
           ELSE 'facil'
         END;
$function$;

REVOKE ALL ON FUNCTION public.quiz_difficulty_weight(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.quiz_difficulty_weight(text) FROM anon;
REVOKE ALL ON FUNCTION public.quiz_difficulty_xp_bonus(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.quiz_difficulty_xp_bonus(text) FROM anon;
REVOKE ALL ON FUNCTION public.quiz_recommended_difficulty(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.quiz_recommended_difficulty(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.quiz_difficulty_weight(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.quiz_difficulty_xp_bonus(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.quiz_recommended_difficulty(integer) TO authenticated, service_role;

-- Mantém a assinatura e a regra de aprovação; acrescenta os campos do modo adaptativo.
-- O retorno ganha colunas novas, então a versão antiga precisa ser removida antes.
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
RETURNS TABLE(total_questions integer, correct_count integer, score integer, passed boolean, passing_score integer, weighted_score integer, xp_bonus integer, by_difficulty jsonb, recommended_difficulty text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total integer;
  v_correct integer;
  v_score integer;
  v_passing integer;
  v_weight_total numeric;
  v_weight_correct numeric;
  v_weighted integer;
  v_bonus integer;
  v_by jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT q.passing_score INTO v_passing FROM public.quizzes q WHERE q.id = p_quiz_id;
  IF v_passing IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  WITH sel AS (
    SELECT q.id AS question_id,
           q.difficulty_level AS d,
           COALESCE(o.is_correct, false) AS ok
    FROM public.quiz_questions q
    LEFT JOIN jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) AS a
      ON (a ->> 'question_id')::uuid = q.id
    LEFT JOIN public.quiz_options o
      ON o.id = (a ->> 'option_id')::uuid
     AND o.question_id = q.id
    WHERE q.quiz_id = p_quiz_id
  ),
  agg AS (
    SELECT d, count(*) AS t, count(*) FILTER (WHERE ok) AS c
    FROM sel
    GROUP BY d
  )
  SELECT
    (SELECT count(*) FROM sel),
    (SELECT count(*) FILTER (WHERE ok) FROM sel),
    (SELECT COALESCE(sum(public.quiz_difficulty_weight(d)), 0) FROM sel),
    (SELECT COALESCE(sum(public.quiz_difficulty_weight(d)) FILTER (WHERE ok), 0) FROM sel),
    (SELECT COALESCE(sum(public.quiz_difficulty_xp_bonus(d)) FILTER (WHERE ok), 0) FROM sel),
    (SELECT COALESCE(
              jsonb_object_agg(d, jsonb_build_object('total', t, 'correct', c)),
              '{}'::jsonb)
     FROM agg)
  INTO v_total, v_correct, v_weight_total, v_weight_correct, v_bonus, v_by;

  v_score := CASE WHEN v_total = 0 THEN 0 ELSE (v_correct * 100 / v_total) END;
  v_weighted := CASE WHEN v_weight_total = 0 THEN 0
                     ELSE round(v_weight_correct * 100 / v_weight_total)::integer END;

  RETURN QUERY SELECT
    v_total,
    v_correct,
    v_score,
    v_score >= v_passing,
    v_passing,
    v_weighted,
    v_bonus,
    COALESCE(v_by, '{}'::jsonb),
    public.quiz_recommended_difficulty(v_weighted);
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- Plano da próxima tentativa: nível alvo pelo desempenho anterior e a ordem das
-- questões (as do nível alvo primeiro). Nunca devolve menos que o total quando o
-- quiz é menor que o limite.
CREATE OR REPLACE FUNCTION public.get_adaptive_quiz_plan(p_quiz_id uuid, p_limit integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_last integer;
  v_target text;
  v_total integer;
  v_limit integer;
  v_ids jsonb;
  v_counts jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT a.weighted_score INTO v_last
  FROM public.user_quiz_attempts a
  WHERE a.user_id = v_uid
    AND a.quiz_id = p_quiz_id
    AND a.weighted_score IS NOT NULL
  ORDER BY a.completed_at DESC
  LIMIT 1;

  v_target := public.quiz_recommended_difficulty(v_last);

  SELECT count(*) INTO v_total FROM public.quiz_questions WHERE quiz_id = p_quiz_id;
  v_limit := GREATEST(LEAST(COALESCE(p_limit, 10), v_total), 1);

  SELECT COALESCE(jsonb_agg(s.id ORDER BY s.ord), '[]'::jsonb) INTO v_ids
  FROM (
    SELECT q.id,
           row_number() OVER (
             ORDER BY CASE
                        WHEN q.difficulty_level = v_target THEN 0
                        WHEN public.quiz_difficulty_weight(q.difficulty_level)
                             < public.quiz_difficulty_weight(v_target) THEN 1
                        ELSE 2
                      END,
                      q.order_index,
                      q.id
           ) AS ord
    FROM public.quiz_questions q
    WHERE q.quiz_id = p_quiz_id
    LIMIT v_limit
  ) s;

  SELECT COALESCE(jsonb_object_agg(c.d, jsonb_build_object('total', c.n)), '{}'::jsonb)
    INTO v_counts
  FROM (
    SELECT difficulty_level AS d, count(*) AS n
    FROM public.quiz_questions
    WHERE quiz_id = p_quiz_id
    GROUP BY 1
  ) c;

  RETURN jsonb_build_object(
    'quiz_id', p_quiz_id,
    'target_difficulty', v_target,
    'question_ids', v_ids,
    'limit', v_limit,
    'total_available', v_total,
    'counts', v_counts
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_adaptive_quiz_plan(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_adaptive_quiz_plan(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_adaptive_quiz_plan(uuid, integer) TO authenticated;