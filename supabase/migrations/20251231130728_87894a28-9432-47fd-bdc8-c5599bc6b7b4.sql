-- Create table for blocked countries
CREATE TABLE public.blocked_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  country_name text NOT NULL,
  reason text,
  blocked_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.blocked_countries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage blocked countries"
  ON public.blocked_countries
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view blocked countries for validation"
  ON public.blocked_countries
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_blocked_countries_code ON public.blocked_countries(country_code) WHERE is_active = true;