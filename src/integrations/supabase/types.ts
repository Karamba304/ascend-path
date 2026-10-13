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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          condition: Json
          created_at: string
          current_progress: number
          description: string | null
          end_date: string | null
          id: string
          objective_id: string | null
          required_progress: number
          start_date: string
          status: Database["public"]["Enums"]["challenge_status"]
          title: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          condition?: Json
          created_at?: string
          current_progress?: number
          description?: string | null
          end_date?: string | null
          id?: string
          objective_id?: string | null
          required_progress?: number
          start_date?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          title: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          condition?: Json
          created_at?: string
          current_progress?: number
          description?: string | null
          end_date?: string | null
          id?: string
          objective_id?: string | null
          required_progress?: number
          start_date?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          title?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      context_adaptations: {
        Row: {
          context: Json
          created_at: string
          id: string
          original_mission_id: string | null
          reason: string
          replacement_mission_id: string | null
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          original_mission_id?: string | null
          reason: string
          replacement_mission_id?: string | null
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          original_mission_id?: string | null
          reason?: string
          replacement_mission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_adaptations_original_mission_id_fkey"
            columns: ["original_mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_adaptations_replacement_mission_id_fkey"
            columns: ["replacement_mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      level_events: {
        Row: {
          date: string
          id: string
          new_level: number
          old_level: number
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          new_level: number
          old_level: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          new_level?: number
          old_level?: number
          user_id?: string
        }
        Relationships: []
      }
      mission_results: {
        Row: {
          actual_duration: number | null
          comment: string | null
          completion_date: string
          final_status: Database["public"]["Enums"]["mission_status"]
          id: string
          mission_id: string
          not_done_reason: string | null
          perceived_difficulty:
            | Database["public"]["Enums"]["perceived_difficulty"]
            | null
          performance_data: Json
          user_id: string
        }
        Insert: {
          actual_duration?: number | null
          comment?: string | null
          completion_date?: string
          final_status: Database["public"]["Enums"]["mission_status"]
          id?: string
          mission_id: string
          not_done_reason?: string | null
          perceived_difficulty?:
            | Database["public"]["Enums"]["perceived_difficulty"]
            | null
          performance_data?: Json
          user_id: string
        }
        Update: {
          actual_duration?: number | null
          comment?: string | null
          completion_date?: string
          final_status?: Database["public"]["Enums"]["mission_status"]
          id?: string
          mission_id?: string
          not_done_reason?: string | null
          perceived_difficulty?:
            | Database["public"]["Enums"]["perceived_difficulty"]
            | null
          performance_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_results_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          constraints: Json
          created_at: string
          date: string
          deleted_reason: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["mission_difficulty"]
          duration: number
          family: string | null
          id: string
          objective_id: string
          prerequisites: Json
          reason: string | null
          replaced_mission_id: string | null
          skill: string | null
          source: string | null
          status: Database["public"]["Enums"]["mission_status"]
          steps: Json
          title: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          constraints?: Json
          created_at?: string
          date: string
          deleted_reason?: string | null
          description?: string | null
          difficulty: Database["public"]["Enums"]["mission_difficulty"]
          duration: number
          family?: string | null
          id?: string
          objective_id: string
          prerequisites?: Json
          reason?: string | null
          replaced_mission_id?: string | null
          skill?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          steps?: Json
          title: string
          updated_at?: string
          user_id: string
          xp: number
        }
        Update: {
          constraints?: Json
          created_at?: string
          date?: string
          deleted_reason?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["mission_difficulty"]
          duration?: number
          family?: string | null
          id?: string
          objective_id?: string
          prerequisites?: Json
          reason?: string | null
          replaced_mission_id?: string | null
          skill?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          steps?: Json
          title?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "missions_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          available_days: string[]
          created_at: string
          daily_time: number | null
          description: string | null
          domain: Database["public"]["Enums"]["objective_domain"]
          id: string
          objective_parameters: Json
          start_date: string
          status: Database["public"]["Enums"]["objective_status"]
          target_date: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
          weekly_time: number | null
        }
        Insert: {
          available_days?: string[]
          created_at?: string
          daily_time?: number | null
          description?: string | null
          domain: Database["public"]["Enums"]["objective_domain"]
          id?: string
          objective_parameters?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["objective_status"]
          target_date?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
          weekly_time?: number | null
        }
        Update: {
          available_days?: string[]
          created_at?: string
          daily_time?: number | null
          description?: string | null
          domain?: Database["public"]["Enums"]["objective_domain"]
          id?: string
          objective_parameters?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["objective_status"]
          target_date?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          weekly_time?: number | null
        }
        Relationships: []
      }
      personal_levels: {
        Row: {
          comment: string | null
          date: string
          id: string
          metric: string
          objective_id: string
          origin: string | null
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          comment?: string | null
          date?: string
          id?: string
          metric: string
          objective_id: string
          origin?: string | null
          unit?: string | null
          user_id: string
          value: number
        }
        Update: {
          comment?: string | null
          date?: string
          id?: string
          metric?: string
          objective_id?: string
          origin?: string | null
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_levels_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_level: number
          best_streak: number
          created_at: string
          current_streak: number
          id: string
          last_login: string | null
          settings: Json
          total_xp: number
          updated_at: string
          username: string
        }
        Insert: {
          app_level?: number
          best_streak?: number
          created_at?: string
          current_streak?: number
          id: string
          last_login?: string | null
          settings?: Json
          total_xp?: number
          updated_at?: string
          username: string
        }
        Update: {
          app_level?: number
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_login?: string | null
          settings?: Json
          total_xp?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          completed_date: string | null
          created_at: string
          id: string
          metric: string | null
          objective_id: string
          planned_date: string | null
          result: number | null
          status: Database["public"]["Enums"]["test_status"]
          title: string
          unit: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          id?: string
          metric?: string | null
          objective_id: string
          planned_date?: string | null
          result?: number | null
          status?: Database["public"]["Enums"]["test_status"]
          title: string
          unit?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          id?: string
          metric?: string | null
          objective_id?: string
          planned_date?: string | null
          result?: number | null
          status?: Database["public"]["Enums"]["test_status"]
          title?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
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
      xp_events: {
        Row: {
          amount: number
          challenge_id: string | null
          date: string
          id: string
          mission_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          challenge_id?: string | null
          date?: string
          id?: string
          mission_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          challenge_id?: string | null
          date?: string
          id?: string
          mission_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      challenge_status: "active" | "completed" | "failed" | "expired"
      mission_difficulty:
        | "tres_facile"
        | "facile"
        | "moyenne"
        | "difficile"
        | "tres_difficile"
      mission_status: "todo" | "in_progress" | "done" | "not_done" | "deleted"
      objective_domain:
        | "sport"
        | "langues"
        | "etudes"
        | "programmation"
        | "lecture"
        | "mental"
        | "creation"
        | "habitudes"
        | "quantitatif"
        | "complexe"
      objective_status: "active" | "paused" | "completed" | "abandoned"
      perceived_difficulty: "trop_facile" | "comme_prevu" | "trop_difficile"
      test_status: "planned" | "done" | "skipped"
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
      app_role: ["admin", "moderator", "user"],
      challenge_status: ["active", "completed", "failed", "expired"],
      mission_difficulty: [
        "tres_facile",
        "facile",
        "moyenne",
        "difficile",
        "tres_difficile",
      ],
      mission_status: ["todo", "in_progress", "done", "not_done", "deleted"],
      objective_domain: [
        "sport",
        "langues",
        "etudes",
        "programmation",
        "lecture",
        "mental",
        "creation",
        "habitudes",
        "quantitatif",
        "complexe",
      ],
      objective_status: ["active", "paused", "completed", "abandoned"],
      perceived_difficulty: ["trop_facile", "comme_prevu", "trop_difficile"],
      test_status: ["planned", "done", "skipped"],
    },
  },
} as const
