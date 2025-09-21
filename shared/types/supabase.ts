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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      direct_messages: {
        Row: {
          content: Json
          created_at: string | null
          deleted_at: string | null
          edit_history: Json | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          receiver_id: string | null
          reply_to: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          deleted_at?: string | null
          edit_history?: Json | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          edit_history?: Json | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          addressee_id: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          status: Database["public"]["Enums"]["friend_status"] | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: Database["public"]["Enums"]["friend_status"] | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: Database["public"]["Enums"]["friend_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      group_invitations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invitation_code: string | null
          invitee_id: string | null
          inviter_id: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["invitation_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_code?: string | null
          invitee_id?: string | null
          inviter_id?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_code?: string | null
          invitee_id?: string | null
          inviter_id?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          completed_at: string | null
          correct_attempts: number | null
          created_at: string | null
          difficulty_level: number | null
          id: string
          score: number | null
          session_data: Json | null
          session_type: string
          total_attempts: number | null
          user_id: string | null
          wpm_achieved: number | null
        }
        Insert: {
          completed_at?: string | null
          correct_attempts?: number | null
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          score?: number | null
          session_data?: Json | null
          session_type: string
          total_attempts?: number | null
          user_id?: string | null
          wpm_achieved?: number | null
        }
        Update: {
          completed_at?: string | null
          correct_attempts?: number | null
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          score?: number | null
          session_data?: Json | null
          session_type?: string
          total_attempts?: number | null
          user_id?: string | null
          wpm_achieved?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: Json
          created_at: string | null
          deleted_at: string | null
          edit_history: Json | null
          id: string
          is_deleted: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          metadata: Json | null
          reply_to: string | null
          room_id: string | null
          thread_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          deleted_at?: string | null
          edit_history?: Json | null
          id?: string
          is_deleted?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          reply_to?: string | null
          room_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          edit_history?: Json | null
          id?: string
          is_deleted?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          metadata?: Json | null
          reply_to?: string | null
          room_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          id: string
          joined_at: string | null
          last_read_message_id: string | null
          notifications_enabled: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_message_id?: string | null
          notifications_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_message_id?: string | null
          notifications_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          max_members: number | null
          name: string
          password_hash: string | null
          room_type: Database["public"]["Enums"]["room_type"] | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          max_members?: number | null
          name: string
          password_hash?: string | null
          room_type?: Database["public"]["Enums"]["room_type"] | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          max_members?: number | null
          name?: string
          password_hash?: string | null
          room_type?: Database["public"]["Enums"]["room_type"] | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_online: boolean | null
          last_active: string | null
          learning_progress: Json | null
          morse_skill_level: number | null
          preferences: Json | null
          preferred_speed: number | null
          total_messages_count: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_online?: boolean | null
          last_active?: string | null
          learning_progress?: Json | null
          morse_skill_level?: number | null
          preferences?: Json | null
          preferred_speed?: number | null
          total_messages_count?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_online?: boolean | null
          last_active?: string | null
          learning_progress?: Json | null
          morse_skill_level?: number | null
          preferences?: Json | null
          preferred_speed?: number | null
          total_messages_count?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      friend_status: "pending" | "accepted" | "blocked"
      invitation_status: "pending" | "accepted" | "declined" | "expired"
      message_type: "text" | "system" | "morse_only"
      room_type: "general" | "learning" | "practice" | "private"
      user_role: "admin" | "moderator" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      friend_status: ["pending", "accepted", "blocked"],
      invitation_status: ["pending", "accepted", "declined", "expired"],
      message_type: ["text", "system", "morse_only"],
      room_type: ["general", "learning", "practice", "private"],
      user_role: ["admin", "moderator", "member"],
    },
  },
} as const
