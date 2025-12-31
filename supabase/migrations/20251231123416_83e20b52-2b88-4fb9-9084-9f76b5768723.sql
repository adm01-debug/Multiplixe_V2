-- Create known_devices table for new device detection
CREATE TABLE public.known_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_name TEXT NOT NULL,
  is_trusted BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_known_devices_user_id ON public.known_devices(user_id);
CREATE INDEX idx_known_devices_fingerprint ON public.known_devices(device_fingerprint);

-- Enable RLS
ALTER TABLE public.known_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view their own devices"
ON public.known_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete their own devices"
ON public.known_devices
FOR DELETE
USING (auth.uid() = user_id);

-- System/service can insert devices (via edge function with service role)
CREATE POLICY "Service can manage devices"
ON public.known_devices
FOR ALL
USING (true)
WITH CHECK (true);