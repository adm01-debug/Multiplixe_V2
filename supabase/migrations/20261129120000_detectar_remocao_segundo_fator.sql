-- O segundo fator pode ser removido fora do app: o GoTrue aceita
-- DELETE /auth/v1/factors/{id} com sessão aal1 (medido em 26/11/2026) e
-- mfa_allow_low_aal=false não impede. O RLS não alcança o serviço Auth, então a
-- remoção passava em silêncio: user_mfa_settings.totp_enabled continuava true e a
-- tela seguia dizendo "2FA ativo" sem nenhum fator verificado.
--
-- Esta função compara os dois lados, registra security_alert (aparece no Painel de
-- Segurança, que é realtime) e desliga o carimbo para a tela não mentir.

CREATE OR REPLACE FUNCTION public.reconciliar_segundo_fator()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alertas integer := 0;
BEGIN
  WITH removidos AS (
    SELECT s.user_id, s.updated_at AS marcado_em
      FROM public.user_mfa_settings s
     WHERE s.totp_enabled
       AND NOT EXISTS (
         SELECT 1
           FROM auth.mfa_factors f
          WHERE f.user_id = s.user_id
            AND f.factor_type = 'totp'
            AND f.status = 'verified'
       )
  ),
  desligados AS (
    UPDATE public.user_mfa_settings s
       SET totp_enabled = false,
           updated_at = now()
      FROM removidos r
     WHERE s.user_id = r.user_id
    RETURNING s.user_id, r.marcado_em
  ),
  alertas AS (
    INSERT INTO public.security_alerts (alert_type, severity, title, description, user_id, metadata)
    SELECT 'mfa_removido',
           'high',
           'Segundo fator removido fora do app',
           'A conta tinha 2FA ativo e nenhum fator TOTP verificado no Auth: o fator foi removido por fora da tela, pela API do Auth, que aceita essa remoção só com a senha.',
           d.user_id,
           jsonb_build_object('detectado_em', now(), 'marcado_como_ativo_ate', d.marcado_em)
      FROM desligados d
    RETURNING 1 AS marcador
  )
  SELECT count(*) INTO v_alertas FROM alertas;

  RETURN v_alertas;
END;
$$;

COMMENT ON FUNCTION public.reconciliar_segundo_fator() IS
  'Reconcilia user_mfa_settings com auth.mfa_factors: registra security_alert e desliga totp_enabled quando o fator TOTP foi removido por fora da tela.';

REVOKE ALL ON FUNCTION public.reconciliar_segundo_fator() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconciliar_segundo_fator() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('reconciliar-segundo-fator');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'reconciliar-segundo-fator',
  '*/15 * * * *',
  $$SELECT public.reconciliar_segundo_fator();$$
);