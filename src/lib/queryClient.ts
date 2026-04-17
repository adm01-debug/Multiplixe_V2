import { QueryClient } from "@tanstack/react-query";

// Configuração otimizada do QueryClient com cache agressivo
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados ficam "frescos" por 5 minutos - não refetch automático
      staleTime: 1000 * 60 * 5,
      // Cache mantido por 30 minutos após não ser mais usado
      gcTime: 1000 * 60 * 30,
      // Retry com backoff exponencial (até 2 tentativas)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      // Não refetch ao focar a janela (evita requisições desnecessárias)
      refetchOnWindowFocus: false,
      // Não refetch ao reconectar
      refetchOnReconnect: false,
      // Manter dados anteriores enquanto carrega novos
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Retry apenas 1 vez em mutations
      retry: 1,
    },
  },
});

// Query keys padronizadas para consistência de cache
export const queryKeys = {
  // Cursos
  courses: {
    all: ['courses'] as const,
    list: (filters?: { category?: string; level?: string }) => 
      ['courses', 'list', filters] as const,
    detail: (slug: string) => ['courses', 'detail', slug] as const,
    progress: (courseId: string) => ['courses', 'progress', courseId] as const,
  },
  // Trilhas de aprendizado
  learningPaths: {
    all: ['learning-paths'] as const,
    list: () => ['learning-paths', 'list'] as const,
    detail: (slug: string) => ['learning-paths', 'detail', slug] as const,
    progress: (pathId: string) => ['learning-paths', 'progress', pathId] as const,
  },
  // Usuário
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    xp: (userId: string) => ['user', 'xp', userId] as const,
    achievements: (userId: string) => ['user', 'achievements', userId] as const,
    streak: (userId: string) => ['user', 'streak', userId] as const,
    certificates: (userId: string) => ['user', 'certificates', userId] as const,
  },
  // Leaderboard
  leaderboard: {
    global: (period?: string) => ['leaderboard', 'global', period] as const,
    department: () => ['leaderboard', 'department'] as const,
  },
  // Categorias
  categories: {
    all: ['categories'] as const,
  },
  // Quizzes
  quizzes: {
    forLesson: (lessonId: string) => ['quizzes', 'lesson', lessonId] as const,
    forCourse: (courseId: string) => ['quizzes', 'course', courseId] as const,
    attempts: (quizId: string) => ['quizzes', 'attempts', quizId] as const,
  },
  // Notificações
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', 'unread', userId] as const,
  },
} as const;
