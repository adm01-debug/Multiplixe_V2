-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Lessons are readable by authenticated users
CREATE POLICY "Authenticated users can view lessons" 
ON public.lessons 
FOR SELECT 
TO authenticated
USING (true);

-- Trigger for automatic timestamp updates on lessons
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_lesson_progress table
CREATE TABLE public.user_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- Enable RLS for user_lesson_progress
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own lesson progress
CREATE POLICY "Users can view their own lesson progress" 
ON public.user_lesson_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress" 
ON public.user_lesson_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" 
ON public.user_lesson_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_user_lesson_progress_updated_at
BEFORE UPDATE ON public.user_lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample lessons for existing courses
INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Introdução ao Curso',
  'Conheça os objetivos e estrutura deste curso.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  120,
  1
FROM public.courses WHERE slug = 'atendimento-excelencia';

INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Princípios do Bom Atendimento',
  'Aprenda os fundamentos que fazem a diferença no atendimento.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  480,
  2
FROM public.courses WHERE slug = 'atendimento-excelencia';

INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Comunicação Eficaz com Clientes',
  'Técnicas de comunicação para criar conexões genuínas.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  600,
  3
FROM public.courses WHERE slug = 'atendimento-excelencia';

INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Lidando com Situações Difíceis',
  'Como manter a calma e resolver conflitos.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  720,
  4
FROM public.courses WHERE slug = 'atendimento-excelencia';

INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Introdução às Técnicas de Vendas',
  'Fundamentos para vender mais e melhor.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  300,
  1
FROM public.courses WHERE slug = 'tecnicas-vendas';

INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Entendendo o Cliente',
  'Como identificar as necessidades do cliente.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  540,
  2
FROM public.courses WHERE slug = 'tecnicas-vendas';

INSERT INTO public.lessons (course_id, title, description, video_url, duration_seconds, order_index) 
SELECT 
  id,
  'Fechamento de Vendas',
  'Técnicas avançadas para fechar negócios.',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  660,
  3
FROM public.courses WHERE slug = 'tecnicas-vendas';