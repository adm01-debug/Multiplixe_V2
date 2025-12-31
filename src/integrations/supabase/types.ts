export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          gradient: string | null
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          slug: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          gradient?: string | null
          icon?: string
          id?: string
          name: string
          requirement_type: string
          requirement_value?: number
          slug: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          gradient?: string | null
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          slug?: string
          xp_reward?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_countries: {
        Row: {
          blocked_by: string | null
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_permanent: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_permanent?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_permanent?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          course_title: string
          id: string
          issued_at: string
          user_id: string
          user_name: string
          verification_code: string
        }
        Insert: {
          course_id: string
          course_title: string
          id?: string
          issued_at?: string
          user_id: string
          user_name: string
          verification_code: string
        }
        Update: {
          course_id?: string
          course_title?: string
          id?: string
          issued_at?: string
          user_id?: string
          user_name?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_avatar: string | null
          instructor_name: string | null
          is_featured: boolean | null
          is_published: boolean | null
          level: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_avatar?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          level?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_avatar?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          level?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      known_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string
          first_seen_at: string
          id: string
          ip_address: unknown
          is_trusted: boolean | null
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name: string
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          is_trusted?: boolean | null
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          is_trusted?: boolean | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_path_certificates: {
        Row: {
          id: string
          issued_at: string
          learning_path_id: string
          path_title: string
          user_id: string
          user_name: string
          verification_code: string
        }
        Insert: {
          id?: string
          issued_at?: string
          learning_path_id: string
          path_title: string
          user_id: string
          user_name: string
          verification_code: string
        }
        Update: {
          id?: string
          issued_at?: string
          learning_path_id?: string
          path_title?: string
          user_id?: string
          user_name?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_certificates_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          learning_path_id: string
          order_index: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          learning_path_id: string
          order_index?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          learning_path_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_free: boolean | null
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration_minutes: number
          id: string
          session_type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_minutes: number
          id?: string
          session_type: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          order_index?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_performance_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean
          notes: string | null
          passed_attempts: number
          passing_rate: number
          quiz_id: string
          resolved_at: string | null
          threshold: number
          total_attempts: number
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          notes?: string | null
          passed_attempts: number
          passing_rate: number
          quiz_id: string
          resolved_at?: string | null
          threshold?: number
          total_attempts: number
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          notes?: string | null
          passed_attempts?: number
          passing_rate?: number
          quiz_id?: string
          resolved_at?: string | null
          threshold?: number
          total_attempts?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_performance_alerts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          cooldown_hours: number
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          passing_score: number
          time_limit_seconds: number | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          cooldown_hours?: number
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          cooldown_hours?: number
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          passing_score?: number
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_config: {
        Row: {
          block_duration_minutes: number | null
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          max_requests: number | null
          updated_at: string | null
          window_seconds: number | null
        }
        Insert: {
          block_duration_minutes?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          max_requests?: number | null
          updated_at?: string | null
          window_seconds?: number | null
        }
        Update: {
          block_duration_minutes?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          max_requests?: number | null
          updated_at?: string | null
          window_seconds?: number | null
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: unknown
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          is_resolved: boolean | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          last_accessed_at: string
          progress_percentage: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          last_accessed_at?: string
          progress_percentage?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          last_accessed_at?: string
          progress_percentage?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_path_progress: {
        Row: {
          completed_at: string | null
          courses_completed: number | null
          created_at: string
          id: string
          learning_path_id: string
          progress_percentage: number | null
          started_at: string
          total_courses: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          courses_completed?: number | null
          created_at?: string
          id?: string
          learning_path_id: string
          progress_percentage?: number | null
          started_at?: string
          total_courses?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          courses_completed?: number | null
          created_at?: string
          id?: string
          learning_path_id?: string
          progress_percentage?: number | null
          started_at?: string
          total_courses?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_path_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          last_mfa_at: string | null
          phone_number: string | null
          phone_verified: boolean | null
          sms_enabled: boolean | null
          totp_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_mfa_at?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          sms_enabled?: boolean | null
          totp_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_mfa_at?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          sms_enabled?: boolean | null
          totp_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          total_questions: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          started_at?: string
          total_questions: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          total_questions?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          streak_started_at: string | null
          total_streak_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_started_at?: string | null
          total_streak_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_started_at?: string | null
          total_streak_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          created_at: string
          current_level: number
          id: string
          last_xp_earned_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
          xp_from_achievements: number
          xp_from_courses: number
          xp_from_lessons: number
          xp_from_streaks: number
        }
        Insert: {
          created_at?: string
          current_level?: number
          id?: string
          last_xp_earned_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_from_achievements?: number
          xp_from_courses?: number
          xp_from_lessons?: number
          xp_from_streaks?: number
        }
        Update: {
          created_at?: string
          current_level?: number
          id?: string
          last_xp_earned_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_from_achievements?: number
          xp_from_courses?: number
          xp_from_lessons?: number
          xp_from_streaks?: number
        }
        Relationships: []
      }
      user_xp_history: {
        Row: {
          created_at: string
          id: string
          source: string
          total_xp_after: number
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          source?: string
          total_xp_after: number
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          total_xp_after?: number
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      whitelisted_ips: {
        Row: {
          added_by: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address: unknown
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: {
        Args: { p_amount: number; p_source?: string; p_user_id: string }
        Returns: {
          created_at: string
          current_level: number
          id: string
          last_xp_earned_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
          xp_from_achievements: number
          xp_from_courses: number
          xp_from_lessons: number
          xp_from_streaks: number
        }
        SetofOptions: {
          from: "*"
          to: "user_xp"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_and_award_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_achievements"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      check_rate_limit: {
        Args: { p_endpoint: string; p_ip_address: unknown; p_user_id?: string }
        Returns: {
          is_allowed: boolean
          remaining_requests: number
          reset_at: string
        }[]
      }
      check_streak_risk_notifications: { Args: never; Returns: undefined }
      cleanup_old_security_logs: { Args: never; Returns: undefined }
      complete_pomodoro_session: {
        Args: {
          p_duration_minutes: number
          p_session_type: string
          p_user_id: string
        }
        Returns: {
          session_id: string
          xp_earned: number
        }[]
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_user_id: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          avatar_url: string
          current_level: number
          display_name: string
          rank: number
          total_xp: number
          user_id: string
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          action: string
          permission_name: string
          resource: string
        }[]
      }
      get_user_rank: {
        Args: { p_user_id: string }
        Returns: {
          rank: number
          total_users: number
        }[]
      }
      get_xp_history: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          cumulative_xp: number
          daily_xp: number
          date: string
        }[]
      }
      has_permission: {
        Args: { p_permission_name: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_certificate: {
        Args: {
          p_course_id: string
          p_course_title: string
          p_user_id: string
          p_user_name: string
        }
        Returns: {
          course_id: string
          course_title: string
          id: string
          issued_at: string
          user_id: string
          user_name: string
          verification_code: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      issue_learning_path_certificate: {
        Args: {
          p_learning_path_id: string
          p_path_title: string
          p_user_id: string
          p_user_name: string
        }
        Returns: {
          id: string
          issued_at: string
          learning_path_id: string
          path_title: string
          user_id: string
          user_name: string
          verification_code: string
        }
        SetofOptions: {
          from: "*"
          to: "learning_path_certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          is_new_record: boolean
          new_streak: number
          streak_updated: boolean
          xp_awarded: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "gestor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "gestor"],
    },
  },
} as const
