-- Add cooldown_hours column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN cooldown_hours integer NOT NULL DEFAULT 24;