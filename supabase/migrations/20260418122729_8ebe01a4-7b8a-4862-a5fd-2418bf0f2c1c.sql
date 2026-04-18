-- Índices para acelerar filtros e ordenações mais quentes
CREATE INDEX IF NOT EXISTS idx_playbooks_published_created
  ON public.playbooks (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_videos_published_created
  ON public.training_videos (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_paths_published_created
  ON public.learning_paths (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path
  ON public.learning_path_courses (learning_path_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user
  ON public.user_course_progress (user_id, last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_playbook_views_playbook_user
  ON public.playbook_views (playbook_id, user_id, viewed_at DESC);