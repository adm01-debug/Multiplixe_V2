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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          ends_at: string | null
          gradient: string | null
          icon: string
          id: string
                  is_secret: boolean
          name: string
                  requirement_category: string | null
          requirement_type: string
          requirement_value: number
          seasonal_event_id: string | null
          slug: string
          starts_at: string | null
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          ends_at?: string | null
          gradient?: string | null
          icon?: string
          id?: string
                  is_secret?: boolean
          name: string
                  requirement_category?: string | null
          requirement_type: string
          requirement_value?: number
          seasonal_event_id?: string | null
          slug: string
          starts_at?: string | null
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          ends_at?: string | null
          gradient?: string | null
          icon?: string
          id?: string
                  is_secret?: boolean
          name?: string
                  requirement_category?: string | null
          requirement_type?: string
          requirement_value?: number
          seasonal_event_id?: string | null
          slug?: string
          starts_at?: string | null
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
      course_discussions: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          is_resolved: boolean | null
          lesson_id: string | null
          title: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          lesson_id?: string | null
          title: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          lesson_id?: string | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
          video_preview_url: string | null
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
          video_preview_url?: string | null
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
          video_preview_url?: string | null
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
      daily_challenges: {
        Row: {
          challenge_period: string
          challenge_type: string
          created_at: string
          day_of_week: number | null
          description: string
          id: string
          is_active: boolean | null
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_period?: string
          challenge_type: string
          created_at?: string
          day_of_week?: number | null
          description: string
          id?: string
          is_active?: boolean | null
          target_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_period?: string
          challenge_type?: string
          created_at?: string
          day_of_week?: number | null
          description?: string
          id?: string
          is_active?: boolean | null
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      department_challenge_claims: {
        Row: {
          challenge_id: string
          claimed_at: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          challenge_id: string
          claimed_at?: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          challenge_id?: string
          claimed_at?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      department_challenges: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          metric: string
          starts_at: string
          target_value: number
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          metric?: string
          starts_at?: string
          target_value: number
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          starts_at?: string
          target_value?: number
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      discussion_replies: {
        Row: {
          content: string
          created_at: string
          discussion_id: string
          id: string
          is_answer: boolean | null
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          is_answer?: boolean | null
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          is_answer?: boolean | null
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "course_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_votes: {
        Row: {
          created_at: string
          discussion_id: string | null
          id: string
          reply_id: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          discussion_id?: string | null
          id?: string
          reply_id?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          discussion_id?: string | null
          id?: string
          reply_id?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_votes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "course_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
        ]
      }
            feedback: {
              Row: {
                created_at: string
                humor: string | null
                id: string
                mensagem: string
                nota_interna: string | null
                pagina: string | null
                status: string
                tipo: string
                updated_at: string
                user_id: string
              }
              Insert: {
                created_at?: string
                humor?: string | null
                id?: string
                mensagem: string
                nota_interna?: string | null
                pagina?: string | null
                status?: string
                tipo: string
                updated_at?: string
                user_id: string
              }
              Update: {
                created_at?: string
                humor?: string | null
                id?: string
                mensagem?: string
                nota_interna?: string | null
                pagina?: string | null
                status?: string
                tipo?: string
                updated_at?: string
                user_id?: string
              }
              Relationships: []
            }
      flashcards: {
        Row: {
          back: string
          course_id: string
          created_at: string
          created_by: string | null
          front: string
          hint: string | null
          id: string
          is_active: boolean
          lesson_id: string | null
          updated_at: string
        }
        Insert: {
          back: string
          course_id: string
          created_at?: string
          created_by?: string | null
          front: string
          hint?: string | null
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          updated_at?: string
        }
        Update: {
          back?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          front?: string
          hint?: string | null
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_blocking_config: {
        Row: {
          id: string
          is_enabled: boolean | null
          mode: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_enabled?: boolean | null
          mode?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_enabled?: boolean | null
          mode?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      geo_countries: {
        Row: {
          blocked_by: string | null
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          list_type: string | null
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          list_type?: string | null
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          list_type?: string | null
          reason?: string | null
        }
        Relationships: []
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
          chapters: Json
          course_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_free: boolean | null
          order_index: number
          title: string
          transcript: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          chapters?: Json
          course_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          title: string
          transcript?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          chapters?: Json
          course_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          title?: string
          transcript?: string | null
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
      login_attempts: {
        Row: {
          attempt_count: number
          created_at: string
          email: string
          id: string
          ip_address: unknown
          last_attempt_at: string
          locked_until: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string
          locked_until?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      mentorship_requests: {
        Row: {
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          message: string
          responded_at: string | null
          response_note: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          message: string
          responded_at?: string | null
          response_note?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          message?: string
          responded_at?: string | null
          response_note?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
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
      onboarding_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          role_target: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          role_target?: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          role_target?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          reason: string | null
          requested_at: string | null
          reset_token_sent_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          user_agent: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          requested_at?: string | null
          reset_token_sent_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          user_agent?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          requested_at?: string | null
          reset_token_sent_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
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
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      platform_stats_cache: {
        Row: {
          certificates_count: number
          courses_count: number
          id: number
          lessons_completed_count: number
          updated_at: string
          users_count: number
        }
        Insert: {
          certificates_count?: number
          courses_count?: number
          id?: number
          lessons_completed_count?: number
          updated_at?: string
          users_count?: number
        }
        Update: {
          certificates_count?: number
          courses_count?: number
          id?: number
          lessons_completed_count?: number
          updated_at?: string
          users_count?: number
        }
        Relationships: []
      }
      playbook_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          playbook_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          playbook_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          playbook_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_comments_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_views: {
        Row: {
          id: string
          playbook_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          playbook_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          playbook_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_views_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
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
          deactivated_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_mentor: boolean
          is_public: boolean
          mentor_bio: string | null
          mentor_topics: string[]
          reputation: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_mentor?: boolean
          is_public?: boolean
          mentor_bio?: string | null
          mentor_topics?: string[]
          reputation?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_mentor?: boolean
          is_public?: boolean
          mentor_bio?: string | null
          mentor_topics?: string[]
          reputation?: number
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
          difficulty_level: string
          explanation: string | null
          id: string
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string
          explanation?: string | null
          id?: string
          order_index?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string
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
      saved_filters: {
        Row: {
          created_at: string
          description: string | null
          entity_type: string
          filters: Json
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_type: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_type?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      seasonal_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string | null
          ends_at: string
          id: string
          is_active: boolean
          slug: string
          starts_at: string
          title: string
          updated_at: string
          xp_multiplier: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          slug: string
          starts_at: string
          title: string
          updated_at?: string
          xp_multiplier?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          starts_at?: string
          title?: string
          updated_at?: string
          xp_multiplier?: number
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          created_at: string
          description: string | null
          frequency_days: number
          id: string
          is_active: boolean
          passing_score: number
          quiz_id: string | null
          skill_area: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency_days?: number
          id?: string
          is_active?: boolean
          passing_score?: number
          quiz_id?: string | null
          skill_area: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency_days?: number
          id?: string
          is_active?: boolean
          passing_score?: number
          quiz_id?: string | null
          skill_area?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_schedule: {
        Row: {
          completed: boolean
          course_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          scheduled_date: string
          scheduled_time: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          scheduled_date: string
          scheduled_time?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_video_views: {
        Row: {
          completed: boolean
          id: string
          updated_at: string
          user_id: string
          video_id: string
          viewed_at: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
          viewed_at?: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
          viewed_at?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          view_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number
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
      user_assessment_results: {
        Row: {
          assessment_id: string
          completed_at: string
          gaps: Json | null
          id: string
          next_due_at: string | null
          passed: boolean
          score: number
          user_id: string
        }
        Insert: {
          assessment_id: string
          completed_at?: string
          gaps?: Json | null
          id?: string
          next_due_at?: string | null
          passed?: boolean
          score: number
          user_id: string
        }
        Update: {
          assessment_id?: string
          completed_at?: string
          gaps?: Json | null
          id?: string
          next_due_at?: string | null
          passed?: boolean
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "skill_assessments"
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
      user_daily_challenge_progress: {
        Row: {
          challenge_date: string
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean | null
          updated_at: string
          user_id: string
          xp_claimed: boolean | null
        }
        Insert: {
          challenge_date?: string
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean | null
          updated_at?: string
          user_id: string
          xp_claimed?: boolean | null
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean | null
          updated_at?: string
          user_id?: string
          xp_claimed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcard_progress: {
        Row: {
          created_at: string
          due_at: string
          ease_factor: number
          flashcard_id: string
          id: string
          interval_days: number
          lapses: number
          last_grade: number | null
          last_reviewed_at: string | null
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string
          ease_factor?: number
          flashcard_id: string
          id?: string
          interval_days?: number
          lapses?: number
          last_grade?: number | null
          last_reviewed_at?: string | null
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          ease_factor?: number
          flashcard_id?: string
          id?: string
          interval_days?: number
          lapses?: number
          last_grade?: number | null
          last_reviewed_at?: string | null
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_leagues: {
        Row: {
          created_at: string
          last_change: string | null
          last_change_at: string | null
          league: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          last_change?: string | null
          last_change_at?: string | null
          league?: string
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          last_change?: string | null
          last_change_at?: string | null
          league?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      store_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          powerup_duration_minutes: number | null
          powerup_kind: string | null
          powerup_multiplier: number | null
          price_coins: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          powerup_duration_minutes?: number | null
          powerup_kind?: string | null
          powerup_multiplier?: number | null
          price_coins?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          powerup_duration_minutes?: number | null
          powerup_kind?: string | null
          powerup_multiplier?: number | null
          price_coins?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_powerups: {
        Row: {
          activated_at: string | null
          consumed_at: string | null
          created_at: string
          duration_minutes: number
          expires_at: string | null
          id: string
          item_id: string | null
          kind: string
          multiplier: number | null
          purchase_id: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          consumed_at?: string | null
          created_at?: string
          duration_minutes?: number
          expires_at?: string | null
          id?: string
          item_id?: string | null
          kind: string
          multiplier?: number | null
          purchase_id?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          consumed_at?: string | null
          created_at?: string
          duration_minutes?: number
          expires_at?: string | null
          id?: string
          item_id?: string | null
          kind?: string
          multiplier?: number | null
          purchase_id?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          created_at: string
          id: string
          item_id: string
          price_paid: number
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          price_paid: number
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          price_paid?: number
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          end_date: string
          goal_type: string
          id: string
          start_date: string
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          end_date: string
          goal_type: string
          id?: string
          start_date: string
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          end_date?: string
          goal_type?: string
          id?: string
          start_date?: string
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_notes: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json
          current_step: number
          id: string
          started_at: string
          updated_at: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json
          current_step?: number
          id?: string
          started_at?: string
          updated_at?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json
          current_step?: number
          id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_progress_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json | null
          by_difficulty: Json | null
          completed_at: string
          difficulty_level: string | null
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          total_questions: number
          user_id: string
          weighted_score: number | null
          xp_earned: number
        }
        Insert: {
          answers?: Json | null
          by_difficulty?: Json | null
          completed_at?: string
          difficulty_level?: string | null
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          started_at?: string
          total_questions: number
          user_id: string
          weighted_score?: number | null
          xp_earned?: number
        }
        Update: {
          answers?: Json | null
          by_difficulty?: Json | null
          completed_at?: string
          difficulty_level?: string | null
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          total_questions?: number
          user_id?: string
          weighted_score?: number | null
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
          coins: number
          coins_xp_remainder: number
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
          xp_multiplier: number
        }
        Insert: {
          coins?: number
          coins_xp_remainder?: number
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
          xp_multiplier?: number
        }
        Update: {
          coins?: number
          coins_xp_remainder?: number
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
          xp_multiplier?: number
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
      webhook_deliveries: {
        Row: {
          created_at: string
          endpoint_id: string
          entregue_em: string | null
          erro: string | null
          evento: string
          id: string
          payload: Json
          proxima_tentativa: string
          resposta_status: number | null
          status: string
          tentativas: number
        }
        Insert: {
          created_at?: string
          endpoint_id: string
          entregue_em?: string | null
          erro?: string | null
          evento: string
          id?: string
          payload?: Json
          proxima_tentativa?: string
          resposta_status?: number | null
          status?: string
          tentativas?: number
        }
        Update: {
          created_at?: string
          endpoint_id?: string
          entregue_em?: string | null
          erro?: string | null
          evento?: string
          id?: string
          payload?: Json
          proxima_tentativa?: string
          resposta_status?: number | null
          status?: string
          tentativas?: number
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          eventos: string[]
          formato: string
          id: string
          is_active: boolean
          nome: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          eventos?: string[]
          formato?: string
          id?: string
          is_active?: boolean
          nome: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          eventos?: string[]
          formato?: string
          id?: string
          is_active?: boolean
          nome?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      quiz_options_public: {
        Row: {
          id: string | null
          option_text: string | null
          order_index: number | null
          question_id: string | null
        }
        Insert: {
          id?: string | null
          option_text?: string | null
          order_index?: number | null
          question_id?: string | null
        }
        Update: {
          id?: string | null
          option_text?: string | null
          order_index?: number | null
          question_id?: string | null
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
    }
    Functions: {
      activate_powerup: {
        Args: { p_kind?: string }
        Returns: Json
      }
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
      atualizar_reputacao: { Args: never; Returns: undefined }
      calcular_reputacao: {
        Args: { p_user_id: string }
        Returns: number
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
      check_due_assessment_notifications: { Args: never; Returns: undefined }
      check_login_allowed: {
        Args: { p_email: string }
        Returns: {
          attempt_count: number
          is_allowed: boolean
          remaining_seconds: number
        }[]
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
      claim_daily_challenge_reward: {
        Args: { p_progress_id: string; p_user_id: string }
        Returns: Json
      }
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
      consumir_codigo_backup: {
        Args: { p_hash: string }
        Returns: boolean
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
      department_challenge_progresso: {
        Args: { p_challenge_id: string }
        Returns: {
          membros: number
          participantes: number
          progresso: number
        }[]
      }
      detalhar_reputacao: {
        Args: { p_user_id: string }
        Returns: Json
      }
      enfileirar_webhook: {
        Args: { p_endpoint_id?: string; p_evento: string; p_payload?: Json }
        Returns: number
      }
      get_admin_department_challenges: { Args: never; Returns: Json }
      get_active_seasonal_event: { Args: never; Returns: Json }
      get_adaptive_quiz_plan: {
        Args: { p_limit?: number; p_quiz_id: string }
        Returns: Json
      }
      get_category_leaderboard: {
        Args: { p_category_id?: string; p_limit?: number }
        Returns: {
          avatar_url: string | null
          category_color: string | null
          category_id: string
          category_name: string
          category_slug: string | null
          completed_courses: number
          completed_lessons: number
          display_name: string
          rank: number
          user_id: string
        }[]
      }
      get_department_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avg_xp: number
          department: string
          member_count: number
          rank: number
          total_xp: number
        }[]
      }
      get_due_assessments: {
        Args: { p_user_id: string }
        Returns: {
          assessment_id: string
          frequency_days: number
          last_completed_at: string
          next_due_at: string
          passing_score: number
          quiz_id: string
          skill_area: string
          status: string
          title: string
        }[]
      }
      get_due_flashcards: {
        Args: { p_course_id?: string; p_limit?: number }
        Returns: {
          back: string
          course_id: string
          due_at: string
          ease_factor: number
          front: string
          hint: string | null
          id: string
          interval_days: number
          is_new: boolean
          lesson_id: string | null
          repetitions: number
        }[]
      }
      get_flashcard_overview: { Args: never; Returns: Json }
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
      get_my_challenges: {
        Args: never
        Returns: {
          challenge_date: string
          challenge_id: string
          challenge_period: string
          challenge_type: string
          current_progress: number
          description: string
          ends_at: string
          is_completed: boolean
          progress_id: string
          target_value: number
          title: string
          xp_claimed: boolean
          xp_reward: number
        }[]
      }
      get_my_league: { Args: never; Returns: Json }
      get_my_powerups: { Args: never; Returns: Json }
      get_my_wallet: { Args: never; Returns: Json }
      get_my_xp_multiplier: {
        Args: never
        Returns: Json
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_performance_comparison: {
              Args: never
              Returns: {
                courses_average: number
                courses_completed: number
                hours_average: number
                hours_studied: number
                lessons_average: number
                lessons_completed: number
                streak_average: number
                streak_current: number
                student_count: number
                xp_average: number
                xp_total: number
              }[]
            }
            get_platform_stats: {
        Args: never
        Returns: {
          certificates_count: number
          courses_count: number
          lessons_completed_count: number
          updated_at: string
          users_count: number
        }[]
      }
      get_quiz_review: { Args: { p_attempt_id: string }; Returns: Json }
      get_recommended_courses: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          category_id: string
          description: string
          duration_minutes: number
          id: string
          instructor_name: string
          is_featured: boolean
          level: string
          recommendation_reason: string
          slug: string
          thumbnail_url: string
          title: string
          total_lessons: number
        }[]
      }
      get_smart_recommendations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          category_id: string
          description: string
          duration_minutes: number
          id: string
          instructor_name: string
          is_featured: boolean
          level: string
          recommendation_reason: string
          slug: string
          thumbnail_url: string
          title: string
          total_lessons: number
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
      mcp_exec: { Args: { max_rows?: number; sql: string }; Returns: Json }
      recalculate_user_goals: {
        Args: { p_user_id?: string }
        Returns: undefined
      }
      record_failed_login: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: {
          is_locked: boolean
          lockout_seconds: number
          total_attempts: number
        }[]
      }
      refresh_leagues: {
        Args: { p_zone?: number; p_min_jogadores?: number }
        Returns: Json
      }
      purchase_store_item: { Args: { p_item_id: string }; Returns: Json }
      admin_grant_coins: {
        Args: { p_user_id: string; p_amount: number; p_reason: string }
        Returns: Json
      }
      apply_coin_transaction: {
        Args: { p_user_id: string; p_amount: number; p_source: string; p_description: string }
        Returns: Json
      }
      refresh_platform_stats: { Args: never; Returns: undefined }
      register_playbook_view: {
        Args: { p_playbook_id: string }
        Returns: undefined
      }
      reset_login_attempts: { Args: { p_email: string }; Returns: undefined }
      review_flashcard: {
        Args: { p_flashcard_id: string; p_grade: number }
        Returns: Json
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_quiz_id: string }
        Returns: {
          by_difficulty: Json
          correct_count: number
          passed: boolean
          passing_score: number
          recommended_difficulty: string
          score: number
          total_questions: number
          weighted_score: number
          xp_bonus: number
        }[]
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          freeze_used: boolean
          is_new_record: boolean
          new_streak: number
          streak_updated: boolean
          xp_awarded: number
        }[]
      }
      verify_certificate_by_code: {
        Args: { p_code: string }
        Returns: {
          course_title: string
          issued_at: string
          user_name: string
          verification_code: string
        }[]
      }
      verify_path_certificate_by_code: {
        Args: { p_code: string }
        Returns: {
          issued_at: string
          path_title: string
          user_name: string
          verification_code: string
        }[]
      }
      get_mentors: { Args: { p_busca?: string }; Returns: Json }
      get_my_mentorship: { Args: never; Returns: Json }
      get_my_department_challenges: { Args: never; Returns: Json }
      mentor_disponivel: { Args: { p_user_id: string }; Returns: boolean }
      recalcular_reputacao_perfil: { Args: never; Returns: undefined }
      resgatar_desafio_departamento: {
        Args: { p_challenge_id: string }
        Returns: Json
      }
      respond_mentorship_request: {
        Args: { p_id: string; p_nota?: string; p_status: string }
        Returns: Json
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
