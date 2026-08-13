-- Create table for password reset requests that need approval
CREATE TABLE public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewer_notes text,
  reset_token_sent_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage reset requests"
  ON public.password_reset_requests
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Anyone can insert reset requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_reset_requests_status ON public.password_reset_requests(status) WHERE status = 'pending';
CREATE INDEX idx_reset_requests_user_email ON public.password_reset_requests(user_email);