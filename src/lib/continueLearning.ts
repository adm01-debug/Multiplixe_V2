// Pure logic for "Continue Learning" recommendation prioritization.
// P1: Last in-progress course (0 < progress < 100), most recent first.
// P2: Next course from an active learning path (no in-progress course).
// P3: A favorited course with no progress (final fallback).

export interface ContinueCourseData {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  total_lessons: number | null;
  instructor_name: string | null;
  description?: string | null;
  level?: string | null;
  is_featured?: boolean | null;
  categories?: { name: string; color: string | null } | null;
}

export interface ContinueProgressInput {
  course_id: string;
  progress_percentage: number | null;
  last_accessed_at?: string | null;
  courses: ContinueCourseData | null;
}

export type ContinueSource = "in_progress" | "learning_path" | "favorite";

export interface ContinueRecommendation {
  source: ContinueSource;
  course: ContinueCourseData;
  progress: number;
  pathName?: string;
}

export interface PathSuggestion {
  course: ContinueCourseData;
  pathName: string;
}

export function pickContinueRecommendation(
  userProgress: ContinueProgressInput[],
  pathSuggestion?: PathSuggestion | null,
  favoriteSuggestion?: ContinueCourseData | null
): ContinueRecommendation | null {
  // P1
  const inProgress = [...userProgress]
    .filter((p) => {
      const v = p.progress_percentage ?? 0;
      return v > 0 && v < 100 && p.courses;
    })
    .sort((a, b) => {
      const at = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0;
      const bt = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0;
      return bt - at;
    })[0];

  if (inProgress && inProgress.courses) {
    return {
      source: "in_progress",
      course: inProgress.courses,
      progress: inProgress.progress_percentage ?? 0,
    };
  }

  // P2
  if (pathSuggestion?.course) {
    return {
      source: "learning_path",
      course: pathSuggestion.course,
      progress: 0,
      pathName: pathSuggestion.pathName,
    };
  }

  // P3
  if (favoriteSuggestion) {
    return {
      source: "favorite",
      course: favoriteSuggestion,
      progress: 0,
    };
  }

  return null;
}
