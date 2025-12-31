-- Create table to store WebAuthn credentials
CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT,
  device_name TEXT,
  transports TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_webauthn_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential_id ON public.webauthn_credentials(credential_id);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view their own passkeys"
ON public.webauthn_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can register their own passkeys"
ON public.webauthn_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own passkeys"
ON public.webauthn_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own credentials (for counter updates)
CREATE POLICY "Users can update their own passkeys"
ON public.webauthn_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can manage all credentials (for authentication flow)
CREATE POLICY "Service can manage credentials"
ON public.webauthn_credentials
FOR ALL
USING (true)
WITH CHECK (true);