import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { trackMutationError } from "@/lib/telemetry";

// Configuração otimizada do QueryClient com cache agressivo + telemetria
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof Error) {
        trackMutationError(error, { kind: "query" });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof Error) {
        trackMutationError(error, { kind: "mutation" });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys padronizadas para consistência de cache
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    list: (filters?: { category?: string; level?: string }) =>
      ['courses', 'list', filters] as const,
    detail: (slug: string) => ['courses', 'detail', slug] as const,
    progress: (courseId: string) => ['courses', 'progress', courseId] as const,
  },
  learningPaths: {
    all: ['learning-paths'] as const,
    list: () => ['learning-paths', 'list'] as const,
    detail: (slug: string) => ['learning-paths', 'detail', slug] as const,
    progress: (pathId: string) => ['learning-paths', 'progress', pathId] as const,
  },
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    xp: (userId: string) => ['user', 'xp', userId] as const,
    achievements: (userId: string) => ['user', 'achievements', userId] as const,
    streak: (userId: string) => ['user', 'streak', userId] as const,
    certificates: (userId: string) => ['user', 'certificates', userId] as const,
  },
  leaderboard: {
    global: (period?: string) => ['leaderboard', 'global', period] as const,
    department: () => ['leaderboard', 'department'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  quizzes: {
    forLesson: (lessonId: string) => ['quizzes', 'lesson', lessonId] as const,
    forCourse: (courseId: string) => ['quizzes', 'course', courseId] as const,
    attempts: (quizId: string) => ['quizzes', 'attempts', quizId] as const,
  },
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', 'unread', userId] as const,
  },
} as const;
