-- Create table for geo-blocking configuration
CREATE TABLE public.geo_blocking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'blacklist' CHECK (mode IN ('whitelist', 'blacklist')),
  is_enabled boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.geo_blocking_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage geo blocking config"
  ON public.geo_blocking_config
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view geo blocking config"
  ON public.geo_blocking_config
  FOR SELECT
  USING (true);

-- Insert default config
INSERT INTO public.geo_blocking_config (mode, is_enabled) VALUES ('whitelist', false);

-- Rename blocked_countries to geo_countries for clarity (supports both modes)
ALTER TABLE public.blocked_countries RENAME TO geo_countries;

-- Add column to clarify purpose
ALTER TABLE public.geo_countries ADD COLUMN list_type text DEFAULT 'allowed' CHECK (list_type IN ('allowed', 'blocked'));