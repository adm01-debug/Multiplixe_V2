
-- Add composite indices for frequently queried tables
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_completed 
  ON public.user_lesson_progress (user_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_percentage 
  ON public.user_course_progress (user_id, progress_percentage);

CREATE INDEX IF NOT EXISTS idx_user_xp_history_user_created 
  ON public.user_xp_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lessons_course_order 
  ON public.lessons (course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_courses_published_featured 
  ON public.courses (is_published, is_featured);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications (user_id, is_read, created_at DESC);
