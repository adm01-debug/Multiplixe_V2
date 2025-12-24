-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories are readable by authenticated users
CREATE POLICY "Authenticated users can view categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (true);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  level TEXT DEFAULT 'iniciante' CHECK (level IN ('iniciante', 'intermediario', 'avancado')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  instructor_name TEXT,
  instructor_avatar TEXT,
  total_lessons INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Published courses are readable by authenticated users
CREATE POLICY "Authenticated users can view published courses" 
ON public.courses 
FOR SELECT 
TO authenticated
USING (is_published = true);

-- Trigger for automatic timestamp updates on courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_course_progress table
CREATE TABLE public.user_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- Enable RLS for user_course_progress
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view their own progress" 
ON public.user_course_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_course_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_course_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, icon, color) VALUES
('Vendas', 'vendas', 'Técnicas de vendas e negociação', 'TrendingUp', '#10b981'),
('Atendimento', 'atendimento', 'Excelência no atendimento ao cliente', 'Users', '#6366f1'),
('Produtos', 'produtos', 'Conhecimento sobre nossos produtos', 'Package', '#f59e0b'),
('Liderança', 'lideranca', 'Desenvolvimento de líderes', 'Crown', '#ec4899'),
('Tecnologia', 'tecnologia', 'Ferramentas e sistemas', 'Laptop', '#3b82f6'),
('Soft Skills', 'soft-skills', 'Habilidades interpessoais', 'Heart', '#8b5cf6');

-- Insert sample courses
INSERT INTO public.courses (title, slug, description, duration_minutes, level, category_id, instructor_name, total_lessons, is_published, is_featured) VALUES
('Atendimento de Excelência', 'atendimento-excelencia', 'Aprenda as melhores práticas para encantar nossos clientes e criar experiências memoráveis.', 120, 'iniciante', (SELECT id FROM public.categories WHERE slug = 'atendimento'), 'Maria Silva', 8, true, true),
('Técnicas Avançadas de Vendas', 'tecnicas-vendas', 'Domine técnicas de vendas consultivas e aumente seus resultados.', 180, 'avancado', (SELECT id FROM public.categories WHERE slug = 'vendas'), 'João Santos', 12, true, true),
('Conhecendo Nossos Produtos', 'conhecendo-produtos', 'Tour completo pelo nosso catálogo de brindes promocionais.', 90, 'iniciante', (SELECT id FROM public.categories WHERE slug = 'produtos'), 'Ana Costa', 6, true, false),
('Liderança na Prática', 'lideranca-pratica', 'Desenvolva habilidades essenciais para liderar equipes de alta performance.', 240, 'intermediario', (SELECT id FROM public.categories WHERE slug = 'lideranca'), 'Carlos Oliveira', 15, true, true),
('Excel para o Dia a Dia', 'excel-basico', 'Domine as principais funcionalidades do Excel para aumentar sua produtividade.', 150, 'iniciante', (SELECT id FROM public.categories WHERE slug = 'tecnologia'), 'Pedro Lima', 10, true, false),
('Comunicação Assertiva', 'comunicacao-assertiva', 'Aprenda a se comunicar de forma clara e eficiente no ambiente de trabalho.', 60, 'iniciante', (SELECT id FROM public.categories WHERE slug = 'soft-skills'), 'Fernanda Rocha', 4, true, false),
('Negociação Estratégica', 'negociacao-estrategica', 'Técnicas de negociação para fechar mais vendas com melhores margens.', 200, 'avancado', (SELECT id FROM public.categories WHERE slug = 'vendas'), 'João Santos', 14, true, false),
('Gestão do Tempo', 'gestao-tempo', 'Organize suas tarefas e aumente sua produtividade no trabalho.', 45, 'iniciante', (SELECT id FROM public.categories WHERE slug = 'soft-skills'), 'Fernanda Rocha', 3, true, false);