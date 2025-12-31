-- Add 'gestor' role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';

-- Seed permissions for the platform
INSERT INTO public.permissions (name, resource, action, description) VALUES
  -- Course permissions
  ('courses.view', 'courses', 'view', 'Visualizar cursos'),
  ('courses.create', 'courses', 'create', 'Criar cursos'),
  ('courses.edit', 'courses', 'edit', 'Editar cursos'),
  ('courses.delete', 'courses', 'delete', 'Excluir cursos'),
  ('courses.publish', 'courses', 'publish', 'Publicar/despublicar cursos'),
  
  -- Learning paths permissions
  ('learning_paths.view', 'learning_paths', 'view', 'Visualizar trilhas'),
  ('learning_paths.create', 'learning_paths', 'create', 'Criar trilhas'),
  ('learning_paths.edit', 'learning_paths', 'edit', 'Editar trilhas'),
  ('learning_paths.delete', 'learning_paths', 'delete', 'Excluir trilhas'),
  
  -- Users permissions
  ('users.view', 'users', 'view', 'Visualizar usuários'),
  ('users.create', 'users', 'create', 'Criar usuários'),
  ('users.edit', 'users', 'edit', 'Editar usuários'),
  ('users.delete', 'users', 'delete', 'Excluir usuários'),
  ('users.roles', 'users', 'roles', 'Gerenciar papéis de usuários'),
  
  -- Reports permissions
  ('reports.view', 'reports', 'view', 'Visualizar relatórios'),
  ('reports.export', 'reports', 'export', 'Exportar relatórios'),
  
  -- Quizzes permissions
  ('quizzes.view', 'quizzes', 'view', 'Visualizar quizzes'),
  ('quizzes.create', 'quizzes', 'create', 'Criar quizzes'),
  ('quizzes.edit', 'quizzes', 'edit', 'Editar quizzes'),
  ('quizzes.delete', 'quizzes', 'delete', 'Excluir quizzes'),
  
  -- Categories permissions
  ('categories.view', 'categories', 'view', 'Visualizar categorias'),
  ('categories.manage', 'categories', 'manage', 'Gerenciar categorias'),
  
  -- Security permissions
  ('security.view', 'security', 'view', 'Visualizar painel de segurança'),
  ('security.manage', 'security', 'manage', 'Gerenciar configurações de segurança'),
  
  -- Settings permissions
  ('settings.view', 'settings', 'view', 'Visualizar configurações'),
  ('settings.manage', 'settings', 'manage', 'Gerenciar configurações')
ON CONFLICT DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;