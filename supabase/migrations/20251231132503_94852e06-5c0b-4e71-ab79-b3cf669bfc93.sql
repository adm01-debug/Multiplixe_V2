-- Create table to track login attempts
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on email for efficient lookups
CREATE UNIQUE INDEX idx_login_attempts_email ON public.login_attempts (email);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check/update login attempts (needed for auth flow)
CREATE POLICY "Anyone can view login attempts for validation"
  ON public.login_attempts
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update login attempts"
  ON public.login_attempts
  FOR UPDATE
  USING (true);

-- Function to check if login is allowed and get lockout info
CREATE OR REPLACE FUNCTION public.check_login_allowed(p_email TEXT)
RETURNS TABLE (
  is_allowed BOOLEAN,
  remaining_seconds INTEGER,
  attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_remaining_seconds INTEGER;
BEGIN
  -- Get current attempt record
  SELECT * INTO v_attempt
  FROM login_attempts
  WHERE email = LOWER(p_email);
  
  -- No record found, login is allowed
  IF v_attempt IS NULL THEN
    RETURN QUERY SELECT true, 0, 0;
    RETURN;
  END IF;
  
  -- Check if currently locked
  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_attempt.locked_until - now()))::INTEGER;
    RETURN QUERY SELECT false, v_remaining_seconds, v_attempt.attempt_count;
    RETURN;
  END IF;
  
  -- Not locked, return current attempt count
  RETURN QUERY SELECT true, 0, v_attempt.attempt_count;
END;
$$;

-- Function to record a failed login attempt with exponential backoff
CREATE OR REPLACE FUNCTION public.record_failed_login(p_email TEXT, p_ip_address INET DEFAULT NULL)
RETURNS TABLE (
  is_locked BOOLEAN,
  lockout_seconds INTEGER,
  total_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_new_count INTEGER;
  v_lockout_seconds INTEGER;
  v_locked_until TIMESTAMP WITH TIME ZONE;
  v_max_attempts INTEGER := 5;
BEGIN
  -- Get or create attempt record
  SELECT * INTO v_attempt
  FROM login_attempts
  WHERE email = LOWER(p_email);
  
  IF v_attempt IS NULL THEN
    -- First failed attempt
    INSERT INTO login_attempts (email, ip_address, attempt_count, last_attempt_at)
    VALUES (LOWER(p_email), p_ip_address, 1, now());
    
    RETURN QUERY SELECT false, 0, 1;
    RETURN;
  END IF;
  
  -- Check if lock has expired (reset counter if more than 30 min since last attempt)
  IF v_attempt.last_attempt_at < now() - INTERVAL '30 minutes' THEN
    UPDATE login_attempts
    SET attempt_count = 1, last_attempt_at = now(), locked_until = NULL, ip_address = p_ip_address
    WHERE email = LOWER(p_email);
    
    RETURN QUERY SELECT false, 0, 1;
    RETURN;
  END IF;
  
  -- Increment attempt count
  v_new_count := v_attempt.attempt_count + 1;
  
  -- Calculate lockout if exceeded max attempts
  IF v_new_count >= v_max_attempts THEN
    -- Exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min (max)
    v_lockout_seconds := LEAST(60 * POWER(2, v_new_count - v_max_attempts), 1920);
    v_locked_until := now() + (v_lockout_seconds || ' seconds')::INTERVAL;
    
    UPDATE login_attempts
    SET 
      attempt_count = v_new_count,
      last_attempt_at = now(),
      locked_until = v_locked_until,
      ip_address = p_ip_address
    WHERE email = LOWER(p_email);
    
    RETURN QUERY SELECT true, v_lockout_seconds, v_new_count;
    RETURN;
  END IF;
  
  -- Not locked yet, just update count
  UPDATE login_attempts
  SET 
    attempt_count = v_new_count,
    last_attempt_at = now(),
    ip_address = p_ip_address
  WHERE email = LOWER(p_email);
  
  RETURN QUERY SELECT false, 0, v_new_count;
END;
$$;

-- Function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_attempts WHERE email = LOWER(p_email);
END;
$$;