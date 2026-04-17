
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_completed ON public.user_lesson_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_pct ON public.user_course_progress(user_id, progress_percentage);
CREATE INDEX IF NOT EXISTS idx_user_xp_history_user_created ON public.user_xp_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_playbook_views_playbook_viewed ON public.playbook_views(playbook_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_assessment_results_user_assessment_completed ON public.user_assessment_results(user_id, assessment_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON public.lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON public.quiz_options(question_id);
