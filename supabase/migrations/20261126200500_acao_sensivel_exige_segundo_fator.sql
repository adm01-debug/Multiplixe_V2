-- Antes desta migration, quem tinha a senha desligava o 2FA chamando a API direto:
-- as policies de user_mfa_settings deixavam o dono em `aal1` (so senha) apagar ou zerar
-- `totp_enabled`, e o gate do login nao impede chamada de API. O mesmo valia para as
-- policies de papel de admin, que aceitavam um admin com MFA em `aal1`.
--
-- Regra: quando a conta tem TOTP ativo, escrita em user_mfa_settings e escrita de papel
-- exigem `aal2` no JWT. Conta sem MFA ativo continua igual (aal2 e o maximo possivel).
-- O consumo de codigo de backup precisa funcionar em `aal1` (e a recuperacao de quem
-- perdeu o autenticador), entao ele sai da escrita direta e vira RPC controlada.

CREATE OR REPLACE FUNCTION public.segundo_fator_verificado()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      OR NOT EXISTS (
           SELECT 1
             FROM public.user_mfa_settings s
            WHERE s.user_id = auth.uid()
              AND s.totp_enabled
         );
$$;

COMMENT ON FUNCTION public.segundo_fator_verificado() IS
  'true quando a sessao passou pelo segundo fator ou quando a conta nao tem TOTP ativo';

REVOKE EXECUTE ON FUNCTION public.segundo_fator_verificado() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.segundo_fator_verificado() FROM anon;
GRANT EXECUTE ON FUNCTION public.segundo_fator_verificado() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consumir_codigo_backup(p_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_codes text[];
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'sem sessao' USING ERRCODE = '42501';
  END IF;

  SELECT s.backup_codes INTO v_codes
    FROM public.user_mfa_settings s
   WHERE s.user_id = v_user;

  IF v_codes IS NULL OR NOT (p_hash = ANY (v_codes)) THEN
    RETURN false;
  END IF;

  UPDATE public.user_mfa_settings
     SET backup_codes = array_remove(v_codes, p_hash),
         last_mfa_at = now(),
         updated_at = now()
   WHERE user_id = v_user;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.consumir_codigo_backup(text) IS
  'consome um codigo de backup (hash) do proprio usuario e carimba last_mfa_at';

REVOKE EXECUTE ON FUNCTION public.consumir_codigo_backup(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consumir_codigo_backup(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.consumir_codigo_backup(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can insert own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can insert their own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can update own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can update their own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can delete their own MFA settings" ON public.user_mfa_settings;

CREATE POLICY "MFA: dono insere com segundo fator"
  ON public.user_mfa_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.segundo_fator_verificado());

CREATE POLICY "MFA: dono atualiza com segundo fator"
  ON public.user_mfa_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.segundo_fator_verificado())
  WITH CHECK (auth.uid() = user_id AND public.segundo_fator_verificado());

CREATE POLICY "MFA: dono remove com segundo fator"
  ON public.user_mfa_settings FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.segundo_fator_verificado());

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.segundo_fator_verificado());

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.segundo_fator_verificado());

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.segundo_fator_verificado())
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.segundo_fator_verificado());

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.segundo_fator_verificado())
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.segundo_fator_verificado());