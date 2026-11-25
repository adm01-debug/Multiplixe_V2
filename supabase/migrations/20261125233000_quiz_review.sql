-- FUNC-021: revisão de quiz após a conclusão.
-- O cliente lê as opções por public.quiz_options_public (sem is_correct), então o
-- gabarito só pode ser montado no servidor. Esta função devolve a revisão de uma
-- tentativa do próprio usuário (gabarito + explicações + resposta escolhida),
-- nunca antes de existir a tentativa registrada.
CREATE OR REPLACE FUNCTION public.get_quiz_review(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attempt record;
  v_questions jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, quiz_id, answers, score, total_questions, passed
    INTO v_attempt
  FROM public.user_quiz_attempts
  WHERE id = p_attempt_id
    AND user_id = auth.uid();

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  SELECT jsonb_agg(
           jsonb_build_object(
             'id', q.id,
             'question_text', q.question_text,
             'explanation', q.explanation,
             'order_index', q.order_index,
             'selected_option_id', v_attempt.answers ->> q.id::text,
             'options', COALESCE(
               (
                 SELECT jsonb_agg(
                          jsonb_build_object(
                            'id', o.id,
                            'option_text', o.option_text,
                            'is_correct', o.is_correct,
                            'order_index', o.order_index
                          ) ORDER BY o.order_index
                        )
                 FROM public.quiz_options o
                 WHERE o.question_id = q.id
               ),
               '[]'::jsonb
             )
           ) ORDER BY q.order_index
         )
    INTO v_questions
  FROM public.quiz_questions q
  WHERE q.quiz_id = v_attempt.quiz_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'quiz_id', v_attempt.quiz_id,
    'score', v_attempt.score,
    'total_questions', v_attempt.total_questions,
    'passed', v_attempt.passed,
    'questions', COALESCE(v_questions, '[]'::jsonb)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_quiz_review(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_quiz_review(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_review(uuid) TO authenticated;