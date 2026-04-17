CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MFA settings"
ON public.user_mfa_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA settings"
ON public.user_mfa_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings"
ON public.user_mfa_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MFA settings"
ON public.user_mfa_settings FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_mfa_settings_updated_at
BEFORE UPDATE ON public.user_mfa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();