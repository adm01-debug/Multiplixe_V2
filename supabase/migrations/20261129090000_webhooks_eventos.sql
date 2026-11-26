-- INT-004: Webhooks para eventos de negócio.
-- Endpoints configurados no admin, fila de entregas com assinatura HMAC-SHA256,
-- retentativa com backoff e log de tentativas.

-- ─────────────────────────────── Eventos suportados ───────────────────────────────
CREATE OR REPLACE FUNCTION public.webhook_eventos_suportados()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ARRAY['curso.concluido', 'certificado.emitido', 'conquista.desbloqueada', 'teste']::text[];
$$;

GRANT EXECUTE ON FUNCTION public.webhook_eventos_suportados() TO authenticated;

-- ─────────────────────────────── Endpoints ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  eventos TEXT[] NOT NULL DEFAULT '{}'::text[],
  secret TEXT NOT NULL DEFAULT encode(
    sha256((gen_random_uuid()::text || clock_timestamp()::text)::bytea),
    'hex'
  ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  descricao TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_endpoints_nome_nao_vazio CHECK (length(btrim(nome)) > 0),
  CONSTRAINT webhook_endpoints_url_https CHECK (url ~* '^https://[^[:space:]]+$'),
  CONSTRAINT webhook_endpoints_eventos_validos CHECK (
    cardinality(eventos) > 0 AND eventos <@ public.webhook_eventos_suportados()
  )
);

COMMENT ON TABLE public.webhook_endpoints IS 'INT-004: destinos HTTP que recebem eventos da plataforma';
COMMENT ON COLUMN public.webhook_endpoints.secret IS 'Chave usada para assinar o corpo (HMAC-SHA256) enviado no header X-Multiplixe-Signature';

-- ─────────────────────────────── Fila de entregas ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente',
  tentativas INTEGER NOT NULL DEFAULT 0,
  proxima_tentativa TIMESTAMPTZ NOT NULL DEFAULT now(),
  resposta_status INTEGER,
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entregue_em TIMESTAMPTZ,
  CONSTRAINT webhook_deliveries_status CHECK (status IN ('pendente', 'entregue', 'falhou')),
  CONSTRAINT webhook_deliveries_tentativas CHECK (tentativas >= 0)
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_fila
  ON public.webhook_deliveries (proxima_tentativa)
  WHERE status = 'pendente';

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint
  ON public.webhook_deliveries (endpoint_id, created_at DESC);

-- ─────────────────────────────── Trigger updated_at ───────────────────────────────
DROP TRIGGER IF EXISTS trg_webhook_endpoints_updated_at ON public.webhook_endpoints;
CREATE TRIGGER trg_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────── RLS ───────────────────────────────
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem endpoints de webhook" ON public.webhook_endpoints;
CREATE POLICY "Admins leem endpoints de webhook"
  ON public.webhook_endpoints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins criam endpoints de webhook" ON public.webhook_endpoints;
CREATE POLICY "Admins criam endpoints de webhook"
  ON public.webhook_endpoints FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins editam endpoints de webhook" ON public.webhook_endpoints;
CREATE POLICY "Admins editam endpoints de webhook"
  ON public.webhook_endpoints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins excluem endpoints de webhook" ON public.webhook_endpoints;
CREATE POLICY "Admins excluem endpoints de webhook"
  ON public.webhook_endpoints FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins leem entregas de webhook" ON public.webhook_deliveries;
CREATE POLICY "Admins leem entregas de webhook"
  ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins limpam entregas de webhook" ON public.webhook_deliveries;
CREATE POLICY "Admins limpam entregas de webhook"
  ON public.webhook_deliveries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT SELECT, DELETE ON public.webhook_deliveries TO authenticated;
REVOKE ALL ON public.webhook_endpoints FROM anon;
REVOKE ALL ON public.webhook_deliveries FROM anon;

-- ─────────────────────────────── Enfileiramento ───────────────────────────────
-- Uso interno (triggers). Sem checagem de papel: quem chama já é o dono da transação.
CREATE OR REPLACE FUNCTION public.enfileirar_webhook_interno(
  p_evento TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_endpoint_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  IF NOT (p_evento = ANY (public.webhook_eventos_suportados())) THEN
    RAISE EXCEPTION 'evento de webhook desconhecido: %', p_evento USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.webhook_deliveries (endpoint_id, evento, payload)
  SELECT e.id, p_evento, COALESCE(p_payload, '{}'::jsonb)
  FROM public.webhook_endpoints e
  WHERE e.is_active
    AND p_evento = ANY (e.eventos)
    AND (p_endpoint_id IS NULL OR e.id = p_endpoint_id);

  GET DIAGNOSTICS v_total = ROW_COUNT;

  -- Dispara a entrega imediatamente; se o pg_net falhar, o cron de 1 min assume.
  IF v_total > 0 THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://ywsblgsikhiscvpmopkp.supabase.co/functions/v1/webhook-dispatch',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 2000
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.enfileirar_webhook_interno(text, jsonb, uuid) FROM PUBLIC, anon, authenticated;

-- RPC usada pelo admin (inclusive botão "Testar"): exige papel admin.
CREATE OR REPLACE FUNCTION public.enfileirar_webhook(
  p_evento TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_endpoint_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'apenas administradores podem disparar webhooks' USING ERRCODE = '42501';
  END IF;

  RETURN public.enfileirar_webhook_interno(p_evento, p_payload, p_endpoint_id);
END;
$$;

REVOKE ALL ON FUNCTION public.enfileirar_webhook(text, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enfileirar_webhook(text, jsonb, uuid) TO authenticated;

-- ─────────────────────────────── Triggers de negócio ───────────────────────────────
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
        'curso_id', NEW.course_id,
        'progresso', NEW.progress_percentage
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_curso_concluido ON public.user_course_progress;
CREATE TRIGGER trg_webhook_curso_concluido
  AFTER INSERT OR UPDATE OF completed_at ON public.user_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_curso_concluido();

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
      'curso_id', NEW.course_id,
      'curso_titulo', NEW.course_title,
      'codigo_verificacao', NEW.verification_code
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_certificado_emitido ON public.certificates;
CREATE TRIGGER trg_webhook_certificado_emitido
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_certificado_emitido();

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
      'conquista_id', NEW.achievement_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_conquista_desbloqueada ON public.user_achievements;
CREATE TRIGGER trg_webhook_conquista_desbloqueada
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_conquista_desbloqueada();

-- ─────────────────────────────── Agendamento ───────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'webhook-dispatch') THEN
    PERFORM cron.unschedule('webhook-dispatch');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'webhook-dispatch',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ywsblgsikhiscvpmopkp.supabase.co/functions/v1/webhook-dispatch',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
  $cron$
);