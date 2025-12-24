-- Update default passing score to 90%
ALTER TABLE public.quizzes ALTER COLUMN passing_score SET DEFAULT 90;

-- Update all existing quizzes to 90% passing score
UPDATE public.quizzes SET passing_score = 90 WHERE passing_score < 90;