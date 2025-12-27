-- Create learning_paths table
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  estimated_hours INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'iniciante',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  xp_reward INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning_path_courses junction table
CREATE TABLE public.learning_path_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(learning_path_id, course_id)
);

-- Create user_learning_path_progress table
CREATE TABLE public.user_learning_path_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_path_id)
);

-- Create learning_path_certificates table
CREATE TABLE public.learning_path_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL,
  path_title TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_path_id)
);

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_certificates ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_paths
CREATE POLICY "Anyone can view published learning paths" 
ON public.learning_paths FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all learning paths" 
ON public.learning_paths FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert learning paths" 
ON public.learning_paths FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update learning paths" 
ON public.learning_paths FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete learning paths" 
ON public.learning_paths FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for learning_path_courses
CREATE POLICY "Anyone can view learning path courses" 
ON public.learning_path_courses FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage learning path courses" 
ON public.learning_path_courses FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_learning_path_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_learning_path_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_learning_path_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_learning_path_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for learning_path_certificates
CREATE POLICY "Anyone can verify certificates" 
ON public.learning_path_certificates FOR SELECT 
USING (true);

CREATE POLICY "Users can view their own certificates" 
ON public.learning_path_certificates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates" 
ON public.learning_path_certificates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_learning_paths_updated_at
BEFORE UPDATE ON public.learning_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_learning_path_progress_updated_at
BEFORE UPDATE ON public.user_learning_path_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to issue learning path certificate
CREATE OR REPLACE FUNCTION public.issue_learning_path_certificate(
  p_user_id uuid, 
  p_learning_path_id uuid, 
  p_user_name text, 
  p_path_title text
)
RETURNS learning_path_certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_certificate public.learning_path_certificates;
  v_verification_code text;
BEGIN
  -- Generate unique verification code
  v_verification_code := 'LP-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  
  -- Check if certificate already exists
  SELECT * INTO v_certificate
  FROM public.learning_path_certificates
  WHERE user_id = p_user_id AND learning_path_id = p_learning_path_id;
  
  IF v_certificate IS NOT NULL THEN
    RETURN v_certificate;
  END IF;
  
  -- Insert new certificate
  INSERT INTO public.learning_path_certificates (user_id, learning_path_id, verification_code, user_name, path_title)
  VALUES (p_user_id, p_learning_path_id, v_verification_code, p_user_name, p_path_title)
  RETURNING * INTO v_certificate;
  
  RETURN v_certificate;
END;
$$;