export type PeriodFilter = 7 | 30 | 90;

export interface QuizOption {
  id: string;
  title: string;
  courseTitle: string;
  categoryId: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CourseQuizStat {
  courseId: string;
  courseTitle: string;
  quizTitle: string;
  quizId: string;
  totalAttempts: number;
  passedAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  passingRate: number;
}

export interface DailyStats {
  date: string;
  displayDate: string;
  attempts: number;
  passed: number;
  passingRate: number;
  averageScore: number;
}

export interface QuizRanking {
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  topUsers: {
    userId: string;
    userName: string;
    avatarUrl: string | null;
    bestScore: number;
    attemptCount: number;
  }[];
}

export interface QuizCourseJoin {
  id: string;
  title: string;
  category_id: string | null;
}

export interface QuizWithCourse {
  id: string;
  title: string;
  course_id: string | null;
  courses: QuizCourseJoin | null;
}

export interface PerformanceAlert {
  id: string;
  quiz_id: string;
  alert_type: string;
  passing_rate: number;
  total_attempts: number;
  passed_attempts: number;
  threshold: number;
  is_resolved: boolean;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  quizTitle?: string;
  courseTitle?: string;
}

export interface OverallStats {
  totalAttempts: number;
  totalPassed: number;
  averageScore: number;
  overallPassingRate: number;
}
