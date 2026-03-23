
-- Fix overly permissive RLS on known_devices: remove the "Service can manage devices" ALL policy with USING(true)
DROP POLICY IF EXISTS "Service can manage devices" ON public.known_devices;

-- Add proper service-level insert/update policies for edge functions (service_role bypasses RLS anyway)
CREATE POLICY "Authenticated users can insert their own devices"
ON public.known_devices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON public.known_devices FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix overly permissive RLS on webauthn_credentials: remove "Service can manage credentials" ALL policy
DROP POLICY IF EXISTS "Service can manage credentials" ON public.webauthn_credentials;
