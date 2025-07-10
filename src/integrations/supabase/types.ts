
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
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          artist_audiolink: string | null
          artist_bio: string | null
          artist_genre: string[] | null
          artist_home: string | null
          artist_image: string | null
          artist_name: string
          artist_otwcategory: string | null
          artist_otwcreateddate: string | null
          artist_relatedartists: string[] | null
          artist_totallisteners: number | null
          artist_totalwatchers: number | null
          artist_videolink: string | null
          artist_otwid: number | null
          UUID: string
        }
        Insert: {
          artist_audiolink?: string | null
          artist_bio?: string | null
          artist_genre?: string[] | null
          artist_home?: string | null
          artist_image?: string | null
          artist_name: string
          artist_otwcategory?: string | null
          artist_otwcreateddate?: string | null
          artist_relatedartists?: string[] | null
          artist_totallisteners?: number | null
          artist_totalwatchers?: number | null
          artist_videolink?: string | null
          artist_otwid?: number | null
          UUID?: string
        }
        Update: {
          artist_audiolink?: string | null
          artist_bio?: string | null
          artist_genre?: string[] | null
          artist_home?: string | null
          artist_image?: string | null
          artist_name?: string
          artist_otwcategory?: string | null
          artist_otwcreateddate?: string | null
          artist_relatedartists?: string[] | null
          artist_totallisteners?: number | null
          artist_totalwatchers?: number | null
          artist_videolink?: string | null
          artist_otwid?: number | null
          UUID?: string
        }
        Relationships: []
      }
      top25_votes: {
        Row: {
          artist_otwid: number | null
          created_at: string | null
          username: string
          UUID: string
        }
        Insert: {
          artist_otwid?: number | null
          created_at?: string | null
          username: string
          UUID?: string
        }
        Update: {
          artist_otwid?: number | null
          created_at?: string | null
          username?: string
          UUID?: string
        }
        Relationships: [
          {
            foreignKeyName: "top25_votes_artist_otwid_fkey"
            columns: ["artist_otwid"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["artist_otwid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
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
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
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
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
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
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
