import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  estimated_hours: number;
  difficulty_level: string;
  is_published: boolean;
  is_featured: boolean;
  xp_reward: number;
  created_at: string;
  courses_count?: number;
}

export interface LearningPathCourse {
  id: string;
  course_id: string;
  order_index: number;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    duration_minutes: number;
    level: string;
    total_lessons: number;
  };
}

export interface UserLearningPathProgress {
  id: string;
  learning_path_id: string;
  progress_percentage: number;
  courses_completed: number;
  total_courses: number;
  started_at: string;
  completed_at: string | null;
}

export interface LearningPathCertificate {
  id: string;
  user_id: string;
  learning_path_id: string;
  verification_code: string;
  user_name: string;
  path_title: string;
  issued_at: string;
}

export function useLearningPaths() {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningPaths = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get course counts for each path
      const pathsWithCounts = await Promise.all(
        (data || []).map(async (path) => {
          const { count } = await supabase
            .from('learning_path_courses')
            .select('*', { count: 'exact', head: true })
            .eq('learning_path_id', path.id);
          
          return { ...path, courses_count: count || 0 };
        })
      );

      setLearningPaths(pathsWithCounts);
    } catch (err: any) {
      console.error('Error fetching learning paths:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLearningPathBySlug = useCallback(async (slug: string): Promise<LearningPath | null> => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching learning path:', err);
      return null;
    }
  }, []);

  const getLearningPathCourses = useCallback(async (learningPathId: string): Promise<LearningPathCourse[]> => {
    try {
      const { data, error } = await supabase
        .from('learning_path_courses')
        .select(`
          id,
          course_id,
          order_index,
          course:courses (
            id,
            title,
            slug,
            description,
            thumbnail_url,
            duration_minutes,
            level,
            total_lessons
          )
        `)
        .eq('learning_path_id', learningPathId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        course_id: item.course_id,
        order_index: item.order_index,
        course: item.course
      }));
    } catch (err) {
      console.error('Error fetching learning path courses:', err);
      return [];
    }
  }, []);

  const getUserProgress = useCallback(async (learningPathId: string): Promise<UserLearningPathProgress | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_learning_path_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('learning_path_id', learningPathId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user progress:', err);
      return null;
    }
  }, [user]);

  const startLearningPath = useCallback(async (learningPathId: string, totalCourses: number) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_learning_path_progress')
        .upsert({
          user_id: user.id,
          learning_path_id: learningPathId,
          total_courses: totalCourses,
          courses_completed: 0,
          progress_percentage: 0
        }, { onConflict: 'user_id,learning_path_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error starting learning path:', err);
      return null;
    }
  }, [user]);

  const updateProgress = useCallback(async (learningPathId: string, coursesCompleted: number, totalCourses: number) => {
    if (!user) return null;

    const progressPercentage = Math.round((coursesCompleted / totalCourses) * 100);
    const isCompleted = progressPercentage === 100;

    try {
      const { data, error } = await supabase
        .from('user_learning_path_progress')
        .update({
          courses_completed: coursesCompleted,
          progress_percentage: progressPercentage,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('learning_path_id', learningPathId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating progress:', err);
      return null;
    }
  }, [user]);

  const issueCertificate = useCallback(async (
    learningPathId: string,
    userName: string,
    pathTitle: string
  ): Promise<LearningPathCertificate | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('issue_learning_path_certificate', {
          p_user_id: user.id,
          p_learning_path_id: learningPathId,
          p_user_name: userName,
          p_path_title: pathTitle
        });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error issuing certificate:', err);
      return null;
    }
  }, [user]);

  const getUserCertificates = useCallback(async (): Promise<LearningPathCertificate[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('learning_path_certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching certificates:', err);
      return [];
    }
  }, [user]);

  useEffect(() => {
    fetchLearningPaths();
  }, [fetchLearningPaths]);

  return {
    learningPaths,
    loading,
    error,
    fetchLearningPaths,
    getLearningPathBySlug,
    getLearningPathCourses,
    getUserProgress,
    startLearningPath,
    updateProgress,
    issueCertificate,
    getUserCertificates
  };
}
