import { describe, it, expect } from "vitest";
import {
  pickContinueRecommendation,
  type ContinueCourseData,
  type ContinueProgressInput,
  type PathSuggestion,
} from "@/lib/continueLearning";

const makeCourse = (id: string, overrides: Partial<ContinueCourseData> = {}): ContinueCourseData => ({
  id,
  title: `Course ${id}`,
  slug: `course-${id}`,
  thumbnail_url: null,
  duration_minutes: 60,
  total_lessons: 10,
  instructor_name: null,
  ...overrides,
});

describe("pickContinueRecommendation", () => {
  it("P1: returns the most recently accessed in-progress course", () => {
    const progress: ContinueProgressInput[] = [
      { course_id: "a", progress_percentage: 30, last_accessed_at: "2025-01-01T10:00:00Z", courses: makeCourse("a") },
      { course_id: "b", progress_percentage: 50, last_accessed_at: "2025-01-05T10:00:00Z", courses: makeCourse("b") },
      { course_id: "c", progress_percentage: 100, last_accessed_at: "2025-01-10T10:00:00Z", courses: makeCourse("c") },
    ];
    const rec = pickContinueRecommendation(progress);
    expect(rec).not.toBeNull();
    expect(rec?.source).toBe("in_progress");
    expect(rec?.course.id).toBe("b");
    expect(rec?.progress).toBe(50);
  });

  it("P1 ignores 0% and 100% progress", () => {
    const progress: ContinueProgressInput[] = [
      { course_id: "a", progress_percentage: 0, courses: makeCourse("a") },
      { course_id: "b", progress_percentage: 100, courses: makeCourse("b") },
    ];
    const path: PathSuggestion = { course: makeCourse("p"), pathName: "Vendas 101" };
    const rec = pickContinueRecommendation(progress, path);
    expect(rec?.source).toBe("learning_path");
    expect(rec?.course.id).toBe("p");
  });

  it("P2: falls back to learning path when no in-progress course exists", () => {
    const path: PathSuggestion = { course: makeCourse("p"), pathName: "Onboarding" };
    const rec = pickContinueRecommendation([], path);
    expect(rec?.source).toBe("learning_path");
    expect(rec?.pathName).toBe("Onboarding");
    expect(rec?.progress).toBe(0);
  });

  it("P3: falls back to favorite when no in-progress and no learning path", () => {
    const fav = makeCourse("f");
    const rec = pickContinueRecommendation([], null, fav);
    expect(rec?.source).toBe("favorite");
    expect(rec?.course.id).toBe("f");
  });

  it("returns null when no source is available", () => {
    expect(pickContinueRecommendation([])).toBeNull();
    expect(pickContinueRecommendation([], null, null)).toBeNull();
  });

  it("priority order P1 > P2 > P3", () => {
    const progress: ContinueProgressInput[] = [
      { course_id: "a", progress_percentage: 40, last_accessed_at: "2025-01-01T00:00:00Z", courses: makeCourse("a") },
    ];
    const path: PathSuggestion = { course: makeCourse("p"), pathName: "X" };
    const fav = makeCourse("f");
    const rec = pickContinueRecommendation(progress, path, fav);
    expect(rec?.source).toBe("in_progress");
    expect(rec?.course.id).toBe("a");
  });
});
