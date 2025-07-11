
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          email: string
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          UUID: string
          artist_name: string
          artist_home: string | null
          artist_otwcreateddate: string | null
          artist_videolink: string | null
          artist_audiolink: string | null
          artist_image: string | null
          artist_totallisteners: number | null
          artist_totalwatchers: number | null
          artist_otwcategory: string | null
          artist_genre: string | null
          artist_relatedartists: string[] | null
          artist_bio: string | null
          artist_otwid: number | null
          artist_tiktok_username: string | null
          artist_tiktok_videoid: string | null
        }
        Insert: {
          UUID?: string
          artist_name: string
          artist_home?: string | null
          artist_otwcreateddate?: string | null
          artist_videolink?: string | null
          artist_audiolink?: string | null
          artist_image?: string | null
          artist_totallisteners?: number | null
          artist_totalwatchers?: number | null
          artist_otwcategory?: string | null
          artist_genre?: string | null
          artist_relatedartists?: string[] | null
          artist_bio?: string | null
          artist_otwid?: number | null
          artist_tiktok_username?: string | null
          artist_tiktok_videoid?: string | null
        }
        Update: {
          UUID?: string
          artist_name?: string
          artist_home?: string | null
          artist_otwcreateddate?: string | null
          artist_videolink?: string | null
          artist_audiolink?: string | null
          artist_image?: string | null
          artist_totallisteners?: number | null
          artist_totalwatchers?: number | null
          artist_otwcategory?: string | null
          artist_genre?: string | null
          artist_relatedartists?: string[] | null
          artist_bio?: string | null
          artist_otwid?: number | null
          artist_tiktok_username?: string | null
          artist_tiktok_videoid?: string | null
        }
        Relationships: []
      }
      ticket_entries: {
        Row: {
          id: string
          email: string
          username: string | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      top25_votes: {
        Row: {
          UUID: string
          username: string
          created_at: string | null
          artist_otwid: number | null
          artist_uuid: string | null
        }
        Insert: {
          UUID?: string
          username: string
          created_at?: string | null
          artist_otwid?: number | null
          artist_uuid: string
        }
        Update: {
          UUID?: string
          username?: string
          created_at?: string | null
          artist_otwid?: number | null
          artist_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "top25_votes_artist_uuid_fkey"
            columns: ["artist_uuid"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["UUID"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_artist_vote_counts: {
        Args: Record<string, never>
        Returns: {
          artist_name: string
          vote_count: number
        }[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
