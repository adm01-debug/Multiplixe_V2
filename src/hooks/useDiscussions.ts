import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Discussion {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  title: string;
  content: string;
  is_resolved: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  replies_count?: number;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  is_answer: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export const useDiscussions = (courseId?: string, lessonId?: string) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiscussions = useCallback(async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('course_discussions')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user profiles for each discussion
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        // Count replies for each discussion
        const discussionIds = data.map(d => d.id);
        const { data: replyCounts } = await supabase
          .from('discussion_replies')
          .select('discussion_id')
          .in('discussion_id', discussionIds);

        const replyCountMap = (replyCounts || []).reduce((acc, r) => {
          acc[r.discussion_id] = (acc[r.discussion_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        const enrichedData = data.map(d => ({
          ...d,
          user_name: profileMap[d.user_id]?.full_name || 'Usuário',
          user_avatar: profileMap[d.user_id]?.avatar_url,
          replies_count: replyCountMap[d.id] || 0,
        }));

        setDiscussions(enrichedData);
      } else {
        setDiscussions([]);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Erro ao carregar discussões');
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const createDiscussion = async (title: string, content: string) => {
    if (!user || !courseId) return null;

    try {
      const { data, error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          lesson_id: lessonId || null,
          user_id: user.id,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Pergunta criada com sucesso!');
      fetchDiscussions();
      return data;
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Erro ao criar pergunta');
      return null;
    }
  };

  const fetchReplies = async (discussionId: string): Promise<DiscussionReply[]> => {
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('is_answer', { ascending: false })
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        return data.map(r => ({
          ...r,
          user_name: profileMap[r.user_id]?.full_name || 'Usuário',
          user_avatar: profileMap[r.user_id]?.avatar_url,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  };

  const createReply = async (discussionId: string, content: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Resposta enviada!');
      return data;
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Erro ao enviar resposta');
      return null;
    }
  };

  const markAsAnswer = async (replyId: string, discussionId: string) => {
    try {
      // First, unmark all other answers for this discussion
      await supabase
        .from('discussion_replies')
        .update({ is_answer: false })
        .eq('discussion_id', discussionId);

      // Mark this reply as the answer
      const { error } = await supabase
        .from('discussion_replies')
        .update({ is_answer: true })
        .eq('id', replyId);

      if (error) throw error;

      // Mark discussion as resolved
      await supabase
        .from('course_discussions')
        .update({ is_resolved: true })
        .eq('id', discussionId);

      toast.success('Marcado como resposta!');
      fetchDiscussions();
    } catch (error) {
      console.error('Error marking as answer:', error);
      toast.error('Erro ao marcar como resposta');
    }
  };

  const vote = async (type: 'discussion' | 'reply', id: string, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const voteData = type === 'discussion' 
        ? { user_id: user.id, discussion_id: id, vote_type: voteType }
        : { user_id: user.id, reply_id: id, vote_type: voteType };

      const { error } = await supabase
        .from('discussion_votes')
        .upsert(voteData, { 
          onConflict: type === 'discussion' ? 'user_id,discussion_id' : 'user_id,reply_id' 
        });

      if (error) throw error;

      if (type === 'discussion') {
        fetchDiscussions();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return {
    discussions,
    loading,
    createDiscussion,
    fetchReplies,
    createReply,
    markAsAnswer,
    vote,
    refetch: fetchDiscussions,
  };
};
