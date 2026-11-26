-- INT-001: Integração com Slack.
-- A entrega continua centralizada no webhook-dispatch (retentativa, assinatura HMAC e log),
-- mas ganha um formato de corpo aceito pelo Slack Incoming Webhook, um evento semanal de
-- ranking para postar no canal e payloads legíveis (título do curso/conquista e nome do usuário).

-- ─────────────────────────── Formato do corpo ───────────────────────────
ALTER TABLE public.webhook_endpoints
  ADD COLUMN IF NOT EXISTS formato TEXT NOT NULL DEFAULT 'generico';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webhook_endpoints_formato') THEN
    ALTER TABLE public.webhook_endpoints
      ADD CONSTRAINT webhook_endpoints_formato CHECK (formato IN ('generico', 'slack'));
  END IF;
END $$;

COMMENT ON COLUMN public.webhook_endpoints.formato IS
  'INT-001: generico (JSON da plataforma) ou slack (text/blocks aceitos pelo Slack Incoming Webhook)';

-- ─────────────────────────── Eventos suportados ───────────────────────────
CREATE OR REPLACE FUNCTION public.webhook_eventos_suportados()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ARRAY[
    'curso.concluido',
    'certificado.emitido',
    'conquista.desbloqueada',
    'ranking.semanal',
    'teste'
  ]::text[];
$$;

GRANT EXECUTE ON FUNCTION public.webhook_eventos_suportados() TO authenticated;

-- ─────────────────────── Payloads legíveis ───────────────────────
CREATE OR REPLACE FUNCTION public.tg_webhook_curso_concluido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.completed_at IS DISTINCT FROM NEW.completed_at)
     AND (TG_OP = 'INSERT' OR OLD.completed_at IS NULL) THEN
    PERFORM public.enfileirar_webhook_interno(
      'curso.concluido',
      jsonb_build_object(
        'evento', 'curso.concluido',
        'ocorrido_em', NEW.completed_at,
        'usuario_id', NEW.user_id,
        'usuario_nome', (SELECT p.full_name FROM public.profiles p WHERE p.user_id = NEW.user_id),
        'curso_id', NEW.course_id,
        'curso_titulo', (SELECT c.title FROM public.courses c WHERE c.id = NEW.course_id),
        'progresso', NEW.progress_percentage
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_webhook_certificado_emitido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enfileirar_webhook_interno(
    'certificado.emitido',
    jsonb_build_object(
      'evento', 'certificado.emitido',
      'ocorrido_em', NEW.issued_at,
      'certificado_id', NEW.id,
      'usuario_id', NEW.user_id,
      'usuario_nome', COALESCE(
        NULLIF(btrim(NEW.user_name), ''),
        (SELECT p.full_name FROM public.profiles p WHERE p.user_id = NEW.user_id)
      ),
      'curso_id', NEW.course_id,
      'curso_titulo', NEW.course_title,
      'codigo_verificacao', NEW.verification_code
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_webhook_conquista_desbloqueada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enfileirar_webhook_interno(
    'conquista.desbloqueada',
    jsonb_build_object(
      'evento', 'conquista.desbloqueada',
      'ocorrido_em', NEW.unlocked_at,
      'usuario_id', NEW.user_id,
      'usuario_nome', (SELECT p.full_name FROM public.profiles p WHERE p.user_id = NEW.user_id),
      'conquista_id', NEW.achievement_id,
      'conquista_nome', (SELECT a.name FROM public.achievements a WHERE a.id = NEW.achievement_id)
    )
  );
  RETURN NEW;
END;
$$;

-- ─────────────── Ranking semanal (uso interno + cron) ───────────────
CREATE OR REPLACE FUNCTION public.enfileirar_ranking_semanal()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio TIMESTAMPTZ := now() - interval '7 days';
  v_fim TIMESTAMPTZ := now();
  v_usuarios JSONB;
  v_cursos JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object('nome', nome, 'xp', xp) ORDER BY xp DESC), '[]'::jsonb)
  INTO v_usuarios
  FROM (
    SELECT COALESCE(NULLIF(btrim(p.full_name), ''), 'Participante') AS nome,
           SUM(h.xp_amount)::INTEGER AS xp
    FROM public.user_xp_history h
    JOIN public.profiles p ON p.user_id = h.user_id
    WHERE h.created_at >= v_inicio AND h.created_at < v_fim
    GROUP BY 1
    HAVING SUM(h.xp_amount) > 0
    ORDER BY xp DESC
    LIMIT 5
  ) t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('titulo', titulo, 'conclusoes', conclusoes) ORDER BY conclusoes DESC), '[]'::jsonb)
  INTO v_cursos
  FROM (
    SELECT c.title AS titulo,
           COUNT(*)::INTEGER AS conclusoes
    FROM public.user_course_progress cp
    JOIN public.courses c ON c.id = cp.course_id
    WHERE cp.progress_percentage = 100
      AND cp.completed_at >= v_inicio
      AND cp.completed_at < v_fim
    GROUP BY 1
    ORDER BY conclusoes DESC
    LIMIT 5
  ) t;

  RETURN public.enfileirar_webhook_interno(
    'ranking.semanal',
    jsonb_build_object(
      'evento', 'ranking.semanal',
      'ocorrido_em', v_fim,
      'periodo_inicio', v_inicio,
      'periodo_fim', v_fim,
      'top_usuarios', v_usuarios,
      'top_cursos', v_cursos
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enfileirar_ranking_semanal() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.enfileirar_ranking_semanal() IS
  'INT-001: enfileira o evento ranking.semanal (top 5 usuários por XP e top 5 cursos) para os endpoints assinantes';

-- ─────────────── Cron: toda segunda-feira às 09:00 ───────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-ranking-webhook') THEN
      PERFORM cron.unschedule('weekly-ranking-webhook');
    END IF;
    PERFORM cron.schedule(
      'weekly-ranking-webhook',
      '0 9 * * 1',
      $cron$SELECT public.enfileirar_ranking_semanal();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;