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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          org_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          org_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "admin_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "admin_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string
          cover_url: string | null
          content_md: string
          status: string
          author_id: string | null
          category_id: string | null
          published_at: string | null
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt: string
          cover_url?: string | null
          content_md: string
          status?: string
          author_id?: string | null
          category_id?: string | null
          published_at?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          excerpt?: string
          cover_url?: string | null
          content_md?: string
          status?: string
          author_id?: string | null
          category_id?: string | null
          published_at?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_sessions: {
        Row: {
          created_at: string | null
          data_json: Json | null
          id: string
          org_id: string
          step_completed: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_json?: Json | null
          id?: string
          org_id: string
          step_completed?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_json?: Json | null
          id?: string
          org_id?: string
          step_completed?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "discovery_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "discovery_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_entries: {
        Row: {
          created_at: string | null
          id: string
          kpi_id: string
          note: string | null
          period_date: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          kpi_id: string
          note?: string | null
          period_date: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          kpi_id?: string
          note?: string | null
          period_date?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_entries_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string | null
          dept_level: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          owner_user_id: string | null
          target_value: number
          unit: string
          updated_at: string | null
          x_matrix_id: string | null
        }
        Insert: {
          created_at?: string | null
          dept_level?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          owner_user_id?: string | null
          target_value: number
          unit: string
          updated_at?: string | null
          x_matrix_id?: string | null
        }
        Update: {
          created_at?: string | null
          dept_level?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          owner_user_id?: string | null
          target_value?: number
          unit?: string
          updated_at?: string | null
          x_matrix_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_x_matrix_id_fkey"
            columns: ["x_matrix_id"]
            isOneToOne: false
            referencedRelation: "x_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string | null
          id: string
          opened_at: string | null
          org_id: string
          payload: Json | null
          sent_at: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          opened_at?: string | null
          org_id: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          opened_at?: string | null
          org_id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "notification_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "notification_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string
          created_at: string | null
          headcount: string
          id: string
          industry: string
          name: string
          plan_tier: string
          updated_at: string | null
          zalo_oa_token: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          headcount: string
          id?: string
          industry: string
          name: string
          plan_tier?: string
          updated_at?: string | null
          zalo_oa_token?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          headcount?: string
          id?: string
          industry?: string
          name?: string
          plan_tier?: string
          updated_at?: string | null
          zalo_oa_token?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          org_id: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          org_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_analyses: {
        Row: {
          created_at: string | null
          evidence_json: Json | null
          framework_source: string
          id: string
          implication: string | null
          org_id: string
          quadrant: string
          statement: string
        }
        Insert: {
          created_at?: string | null
          evidence_json?: Json | null
          framework_source: string
          id?: string
          implication?: string | null
          org_id: string
          quadrant: string
          statement: string
        }
        Update: {
          created_at?: string | null
          evidence_json?: Json | null
          framework_source?: string
          id?: string
          implication?: string | null
          org_id?: string
          quadrant?: string
          statement?: string
        }
        Relationships: [
          {
            foreignKeyName: "swot_analyses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "swot_analyses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "swot_analyses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_factors: {
        Row: {
          code: string
          content: string
          created_at: string
          evidence_text: string | null
          id: string
          is_key_factor: boolean
          org_id: string
          priority_rank: number | null
          quadrant: string
          quality_score: number | null
          source_framework: string | null
          source_ref: string | null
          swot_analysis_id: string
          updated_at: string
        }
        Insert: {
          code: string
          content: string
          created_at?: string
          evidence_text?: string | null
          id?: string
          is_key_factor?: boolean
          org_id: string
          priority_rank?: number | null
          quadrant: string
          quality_score?: number | null
          source_framework?: string | null
          source_ref?: string | null
          swot_analysis_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          content?: string
          created_at?: string
          evidence_text?: string | null
          id?: string
          is_key_factor?: boolean
          org_id?: string
          priority_rank?: number | null
          quadrant?: string
          quality_score?: number | null
          source_framework?: string | null
          source_ref?: string | null
          swot_analysis_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swot_factors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "swot_factors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "swot_factors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swot_factors_swot_analysis_id_fkey"
            columns: ["swot_analysis_id"]
            isOneToOne: false
            referencedRelation: "swot_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      tows_strategies: {
        Row: {
          ai_generated: boolean
          ai_prompt_used: string | null
          bsc_perspective: string
          combined_code: string
          created_at: string
          id: string
          order_index: number
          org_id: string
          ot_factor_ids: string[]
          quadrant: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          strategy_statement: string
          strategy_title: string | null
          sw_factor_ids: string[]
          swot_analysis_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          ai_prompt_used?: string | null
          bsc_perspective?: string
          combined_code: string
          created_at?: string
          id?: string
          order_index?: number
          org_id: string
          ot_factor_ids?: string[]
          quadrant: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          strategy_statement: string
          strategy_title?: string | null
          sw_factor_ids?: string[]
          swot_analysis_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          ai_prompt_used?: string | null
          bsc_perspective?: string
          combined_code?: string
          created_at?: string
          id?: string
          order_index?: number
          org_id?: string
          ot_factor_ids?: string[]
          quadrant?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          strategy_statement?: string
          strategy_title?: string | null
          sw_factor_ids?: string[]
          swot_analysis_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tows_strategies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "tows_strategies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "tows_strategies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tows_strategies_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tows_strategies_swot_analysis_id_fkey"
            columns: ["swot_analysis_id"]
            isOneToOne: false
            referencedRelation: "swot_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          zalo_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          zalo_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          zalo_user_id?: string | null
        }
        Relationships: []
      }
      x_matrices: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          status: string
          title: string
          updated_at: string | null
          vision_json: Json | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          status?: string
          title: string
          updated_at?: string | null
          vision_json?: Json | null
          year?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          status?: string
          title?: string
          updated_at?: string | null
          vision_json?: Json | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "x_matrices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customer_detail"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "x_matrices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_customers_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "x_matrices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      xray_leads: {
        Row: {
          answers_json: Json
          company_name: string
          converted: boolean
          created_at: string | null
          email: string
          headcount: string
          id: string
          industry: string
          overall_level: string
          overall_score: number
          result_json: Json
        }
        Insert: {
          answers_json?: Json
          company_name: string
          converted?: boolean
          created_at?: string | null
          email: string
          headcount: string
          id?: string
          industry: string
          overall_level: string
          overall_score: number
          result_json?: Json
        }
        Update: {
          answers_json?: Json
          company_name?: string
          converted?: boolean
          created_at?: string | null
          email?: string
          headcount?: string
          id?: string
          industry?: string
          overall_level?: string
          overall_score?: number
          result_json?: Json
        }
        Relationships: []
      }
      xray_results: {
        Row: {
          answers_json: Json
          created_at: string
          id: string
          org_id: string | null
          overall_level: string
          overall_score: number
          result_json: Json
          user_id: string | null
        }
        Insert: {
          answers_json: Json
          created_at?: string
          id?: string
          org_id?: string | null
          overall_level: string
          overall_score: number
          result_json: Json
          user_id?: string | null
        }
        Update: {
          answers_json?: Json
          created_at?: string
          id?: string
          org_id?: string | null
          overall_level?: string
          overall_score?: number
          result_json?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xray_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xray_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          result_json: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          result_json: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          result_json?: Json
        }
        Relationships: []
      }
    }
    Views: {
      admin_customer_detail: {
        Row: {
          city: string | null
          created_at: string | null
          current_period_end: string | null
          headcount: string | null
          industry: string | null
          last_active_at: string | null
          member_count: number | null
          org_id: string | null
          org_name: string | null
          owner_email: string | null
          owner_name: string | null
          plan: string | null
          stripe_customer_id: string | null
          sub_status: string | null
          total_sessions: number | null
          total_x_matrices: number | null
        }
        Relationships: []
      }
      admin_customers_overview: {
        Row: {
          created_at: string | null
          last_active_at: string | null
          member_count: number | null
          org_id: string | null
          org_name: string | null
          owner_email: string | null
          owner_name: string | null
          plan: string | null
          sub_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_is_super_admin: { Args: never; Returns: boolean }
      get_user_org_ids: { Args: { uid: string }; Returns: string[] }
      increment_rate_limit: {
        Args: { p_bucket: string; p_window_start: string }
        Returns: number
      }
      increment_blog_post_views: {
        Args: { p_slug: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
