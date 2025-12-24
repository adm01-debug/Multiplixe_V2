-- Create certificates table to store issued certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  verification_code text NOT NULL UNIQUE,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  user_name text NOT NULL,
  course_title text NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own certificates (when completing a course)
CREATE POLICY "Users can insert their own certificates"
ON public.certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Public verification policy (anyone can verify a certificate by code)
CREATE POLICY "Anyone can verify certificates"
ON public.certificates
FOR SELECT
USING (true);

-- Create function to generate certificate
CREATE OR REPLACE FUNCTION public.issue_certificate(
  p_user_id uuid,
  p_course_id uuid,
  p_user_name text,
  p_course_title text
)
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_certificate public.certificates;
  v_verification_code text;
BEGIN
  -- Generate unique verification code
  v_verification_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  
  -- Check if certificate already exists
  SELECT * INTO v_certificate
  FROM public.certificates
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF v_certificate IS NOT NULL THEN
    RETURN v_certificate;
  END IF;
  
  -- Insert new certificate
  INSERT INTO public.certificates (user_id, course_id, verification_code, user_name, course_title)
  VALUES (p_user_id, p_course_id, v_verification_code, p_user_name, p_course_title)
  RETURNING * INTO v_certificate;
  
  RETURN v_certificate;
END;
$$;