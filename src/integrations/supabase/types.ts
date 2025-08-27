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
    PostgrestVersion: "12.2.3 (519615d)"
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
      admin_users: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          artist_audiolink: string | null
          artist_bio: string | null
          artist_genre: string | null
          artist_home: string | null
          artist_image: string | null
          artist_name: string
          artist_otwcategory: string | null
          artist_otwcoverage: number | null
          artist_otwcreateddate: string | null
          artist_relatedartists: string[] | null
          artist_tiktok_username: string | null
          artist_tiktok_videoid: string | null
          artist_totallisteners: number | null
          artist_totalwatchers: number | null
          artist_videolink: string | null
          attractionId: string | null
          cityid: number | null
          primary_vibe: string | null
          secondary_vibe: string | null
          Top_List: string | null
          uuid: string
        }
        Insert: {
          artist_audiolink?: string | null
          artist_bio?: string | null
          artist_genre?: string | null
          artist_home?: string | null
          artist_image?: string | null
          artist_name: string
          artist_otwcategory?: string | null
          artist_otwcoverage?: number | null
          artist_otwcreateddate?: string | null
          artist_relatedartists?: string[] | null
          artist_tiktok_username?: string | null
          artist_tiktok_videoid?: string | null
          artist_totallisteners?: number | null
          artist_totalwatchers?: number | null
          artist_videolink?: string | null
          attractionId?: string | null
          cityid?: number | null
          primary_vibe?: string | null
          secondary_vibe?: string | null
          Top_List?: string | null
          uuid?: string
        }
        Update: {
          artist_audiolink?: string | null
          artist_bio?: string | null
          artist_genre?: string | null
          artist_home?: string | null
          artist_image?: string | null
          artist_name?: string
          artist_otwcategory?: string | null
          artist_otwcoverage?: number | null
          artist_otwcreateddate?: string | null
          artist_relatedartists?: string[] | null
          artist_tiktok_username?: string | null
          artist_tiktok_videoid?: string | null
          artist_totallisteners?: number | null
          artist_totalwatchers?: number | null
          artist_videolink?: string | null
          attractionId?: string | null
          cityid?: number | null
          primary_vibe?: string | null
          secondary_vibe?: string | null
          Top_List?: string | null
          uuid?: string
        }
        Relationships: []
      }
      city_latlong: {
        Row: {
          country_code: string | null
          created_at: string
          id: number
          latitude: number | null
          longitude: number | null
          name: string | null
          normalized_name: string | null
          state_code: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          normalized_name?: string | null
          state_code?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          normalized_name?: string | null
          state_code?: string | null
        }
        Relationships: []
      }
      cube_faces: {
        Row: {
          content_text: string | null
          content_type: string
          created_at: string | null
          face_number: number
          face_title: string | null
          id: string
          image_url: string | null
          ticketcube_id: string | null
        }
        Insert: {
          content_text?: string | null
          content_type: string
          created_at?: string | null
          face_number: number
          face_title?: string | null
          id?: string
          image_url?: string | null
          ticketcube_id?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: string
          created_at?: string | null
          face_number?: number
          face_title?: string | null
          id?: string
          image_url?: string | null
          ticketcube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cube_faces_ticketcube_id_fkey"
            columns: ["ticketcube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["id"]
          },
        ]
      }
      points_config: {
        Row: {
          action_name: string
          created_at: string | null
          description: string | null
          frequency: string | null
          id: number
          is_active: boolean | null
          min_value: number | null
          points_value: number
          updated_at: string | null
        }
        Insert: {
          action_name: string
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          id?: number
          is_active?: boolean | null
          min_value?: number | null
          points_value: number
          updated_at?: string | null
        }
        Update: {
          action_name?: string
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          id?: number
          is_active?: boolean | null
          min_value?: number | null
          points_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_roadmap_comments: {
        Row: {
          auth_id: string
          content: string
          created_at: string | null
          id: number
          parent_comment_id: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          content: string
          created_at?: string | null
          id?: number
          parent_comment_id?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          content?: string
          created_at?: string | null
          id?: number
          parent_comment_id?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_roadmap_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "product_roadmap_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_entries: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          auth_id?: string
          created_at?: string | null
          email: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      ticketcubes: {
        Row: {
          created_at: string | null
          cube_type: string | null
          description: string | null
          event_date: string | null
          event_name: string | null
          gifts_remaining: number | null
          id: string
          is_secured: boolean | null
          stripe_payment_intent_id: string | null
          tier: string | null
          title: string
          updated_at: string | null
          updates_remaining: number | null
          user_id: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          cube_type?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          gifts_remaining?: number | null
          id?: string
          is_secured?: boolean | null
          stripe_payment_intent_id?: string | null
          tier?: string | null
          title: string
          updated_at?: string | null
          updates_remaining?: number | null
          user_id?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          cube_type?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          gifts_remaining?: number | null
          id?: string
          is_secured?: boolean | null
          stripe_payment_intent_id?: string | null
          tier?: string | null
          title?: string
          updated_at?: string | null
          updates_remaining?: number | null
          user_id?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      ticketmaster_events: {
        Row: {
          artist_uuid: string | null
          attractionId: string | null
          created_at: string | null
          event_date: string
          event_id: string
          event_name: string
          event_time: string | null
          event_url: string | null
          id: string
          is_active: boolean | null
          search_keyword: string | null
          updated_at: string | null
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          venue_state: string | null
        }
        Insert: {
          artist_uuid?: string | null
          attractionId?: string | null
          created_at?: string | null
          event_date: string
          event_id: string
          event_name: string
          event_time?: string | null
          event_url?: string | null
          id?: string
          is_active?: boolean | null
          search_keyword?: string | null
          updated_at?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_state?: string | null
        }
        Update: {
          artist_uuid?: string | null
          attractionId?: string | null
          created_at?: string | null
          event_date?: string
          event_id?: string
          event_name?: string
          event_time?: string | null
          event_url?: string | null
          id?: string
          is_active?: boolean | null
          search_keyword?: string | null
          updated_at?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticketmaster_events_artist_uuid_fkey"
            columns: ["artist_uuid"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["uuid"]
          },
        ]
      }
      top25_votes: {
        Row: {
          artist_uuid: string
          auth_id: string
          created_at: string | null
        }
        Insert: {
          artist_uuid: string
          auth_id: string
          created_at?: string | null
        }
        Update: {
          artist_uuid?: string
          auth_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      user_engagements: {
        Row: {
          artist_uuid: string | null
          auth_id: string
          created_at: string
          engagement_type: string
          id: number
          metadata: Json | null
          points_earned: number | null
          user_auth_id: string | null
          week_identifier: string | null
          weekly_list_id: number | null
        }
        Insert: {
          artist_uuid?: string | null
          auth_id: string
          created_at?: string
          engagement_type: string
          id?: number
          metadata?: Json | null
          points_earned?: number | null
          user_auth_id?: string | null
          week_identifier?: string | null
          weekly_list_id?: number | null
        }
        Update: {
          artist_uuid?: string | null
          auth_id?: string
          created_at?: string
          engagement_type?: string
          id?: number
          metadata?: Json | null
          points_earned?: number | null
          user_auth_id?: string | null
          week_identifier?: string | null
          weekly_list_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_engagements_weekly_list_id_fkey"
            columns: ["weekly_list_id"]
            isOneToOne: false
            referencedRelation: "weekly_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_id: string
          city_id: number | null
          created_at: string
          email: string
          id: number
          last_active: string | null
          raw_city_input: string | null
          role: string | null
          total_points: number | null
          username: string
        }
        Insert: {
          auth_id: string
          city_id?: number | null
          created_at?: string
          email: string
          id?: number
          last_active?: string | null
          raw_city_input?: string | null
          role?: string | null
          total_points?: number | null
          username: string
        }
        Update: {
          auth_id?: string
          city_id?: number | null
          created_at?: string
          email?: string
          id?: number
          last_active?: string | null
          raw_city_input?: string | null
          role?: string | null
          total_points?: number | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_latlong"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          auth_id: string
          created_at: string | null
          current_streak: number | null
          id: number
          last_activity_date: string | null
          longest_streak: number | null
          streak_type: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          current_streak?: number | null
          id?: number
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_type: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          current_streak?: number | null
          id?: number
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_type?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          city_id: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          tm_raw_json: Json | null
        }
        Insert: {
          address?: string | null
          city_id?: number | null
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          tm_raw_json?: Json | null
        }
        Update: {
          address?: string | null
          city_id?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          tm_raw_json?: Json | null
        }
        Relationships: []
      }
      weekly_list_artists: {
        Row: {
          artist_uuid: string
          created_at: string
          id: number
          position: number | null
          week_identifier: string | null
          weekly_list_id: number | null
        }
        Insert: {
          artist_uuid: string
          created_at?: string
          id?: number
          position?: number | null
          week_identifier?: string | null
          weekly_list_id?: number | null
        }
        Update: {
          artist_uuid?: string
          created_at?: string
          id?: number
          position?: number | null
          week_identifier?: string | null
          weekly_list_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_weekly_list_artists_artist"
            columns: ["artist_uuid"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "weekly_list_artists_weekly_list_id_fkey"
            columns: ["weekly_list_id"]
            isOneToOne: false
            referencedRelation: "weekly_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_lists: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: number
          start_date: string | null
          status: string | null
          title: string | null
          voting_mode: string | null
          week_identifier: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          start_date?: string | null
          status?: string | null
          title?: string | null
          voting_mode?: string | null
          week_identifier?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: number
          start_date?: string | null
          status?: string | null
          title?: string | null
          voting_mode?: string | null
          week_identifier?: string | null
        }
        Relationships: []
      }
      weekly_votes: {
        Row: {
          artist_uuid: string
          auth_id: string
          created_at: string | null
          id: number
          quadrant_x: number | null
          quadrant_y: number | null
          ranking_position: number | null
          updated_at: string | null
          vote_type: string
          week_identifier: string
        }
        Insert: {
          artist_uuid: string
          auth_id: string
          created_at?: string | null
          id?: number
          quadrant_x?: number | null
          quadrant_y?: number | null
          ranking_position?: number | null
          updated_at?: string | null
          vote_type: string
          week_identifier: string
        }
        Update: {
          artist_uuid?: string
          auth_id?: string
          created_at?: string | null
          id?: number
          quadrant_x?: number | null
          quadrant_y?: number | null
          ranking_position?: number | null
          updated_at?: string | null
          vote_type?: string
          week_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_votes_artist_uuid_fkey"
            columns: ["artist_uuid"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["uuid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_artist_vote_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          artist_name: string
          vote_count: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_weekly_list_for_user: {
        Args: { p_user_id: string; p_week_identifier: string }
        Returns: Json
      }
      increment_user_points: {
        Args: { points_to_add: number; user_auth_id: string }
        Returns: undefined
      }
      increment_user_points_by_auth_id: {
        Args: { auth_id_to_update: string; points_to_add: number }
        Returns: undefined
      }
      insert_ticket_entry: {
        Args: { p_email: string; p_user_id?: string; p_username: string }
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
    Enums: {},
  },
} as const
