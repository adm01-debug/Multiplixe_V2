-- Create table for quiz performance alerts history
CREATE TABLE public.quiz_performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'low_passing_rate',
  passing_rate INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL,
  passed_attempts INTEGER NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 50,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_performance_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage alerts
CREATE POLICY "Admins can view alerts"
  ON public.quiz_performance_alerts
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert alerts"
  ON public.quiz_performance_alerts
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts"
  ON public.quiz_performance_alerts
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alerts"
  ON public.quiz_performance_alerts
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_quiz_performance_alerts_quiz_id ON public.quiz_performance_alerts(quiz_id);
CREATE INDEX idx_quiz_performance_alerts_created_at ON public.quiz_performance_alerts(created_at DESC);