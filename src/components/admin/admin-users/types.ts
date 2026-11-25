export interface UserStat {
  user_id: string;
  email: string;
  full_name: string;
  total_xp: number;
  current_level: number;
  lessons_completed: number;
  courses_completed: number;
  created_at: string;
  is_active: boolean;
  deactivated_at: string | null;
  roles: string[];
  xp_from_lessons: number;
  xp_from_courses: number;
  xp_from_streaks: number;
  xp_from_achievements: number;
  last_xp_earned_at: string | null;
}