import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryLeaderboardEntry {
  category_id: string;
  category_name: string;
  category_slug: string | null;
  category_color: string | null;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  completed_courses: number;
  completed_lessons: number;
  rank: number;
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  entries: CategoryLeaderboardEntry[];
}

const groupByCategory = (rows: CategoryLeaderboardEntry[]): CategoryGroup[] => {
  const groups = new Map<string, CategoryGroup>();

  rows.forEach((row) => {
    const group = groups.get(row.category_id) ?? {
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryColor: row.category_color,
      entries: [],
    };
    group.entries.push(row);
    groups.set(row.category_id, group);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    entries: [...group.entries].sort((a, b) => a.rank - b.rank),
  }));
};

export const useCategoryLeaderboard = (categoryId?: string, limit = 10) => {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.rpc('get_category_leaderboard', {
        p_category_id: categoryId,
        p_limit: limit,
      });

      if (fetchError) {
        setError(fetchError.message);
        setGroups([]);
        return;
      }

      setGroups(groupByCategory((data ?? []) as CategoryLeaderboardEntry[]));
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { groups, loading, error, refetch: fetchLeaderboard };
};