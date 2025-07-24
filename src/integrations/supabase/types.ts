
    export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instanciate createClient with right options
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
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
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
                    created_at: string | null
                    email: string
                    id: string
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    id?: string
                }
                Update: {
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
                    artist_otwid: string | null
                    artist_relatedartists: string[] | null
                    artist_tiktok_username: string | null
                    artist_tiktok_videoid: string | null
                    attractionId: string | null
                    artist_totallisteners: number | null
                    artist_totalwatchers: number | null
                    artist_videolink: string | null
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
                    artist_otwid?: string | null
                    artist_relatedartists?: string[] | null
                    artist_tiktok_username?: string | null
                    artist_tiktok_videoid?: string | null
                    attractionId?: string | null
                    artist_totallisteners?: number | null
                    artist_totalwatchers?: number | null
                    artist_videolink?: string | null
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
                    artist_otwid?: string | null
                    artist_relatedartists?: string[] | null
                    artist_tiktok_username?: string | null
                    artist_tiktok_videoid?: string | null
                    attractionId?: string | null
                    artist_totallisteners?: number | null
                    artist_totalwatchers?: number | null
                    artist_videolink?: string | null
                    primary_vibe?: string | null
                    secondary_vibe?: string | null
                    Top_List?: string | null
                    uuid?: string
                }
                Relationships: []
            }
            ticket_entries: {
                Row: {
                    created_at: string | null
                    email: string
                    id: string
                    user_id: string | null
                    username: string | null
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    id?: string
                    user_id?: string | null
                    username?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    id?: string
                    user_id?: string | null
                    username?: string | null
                }
                Relationships: []
            }
            ticketmaster_events: {
                Row: {
                    artist_uuid: string | null
                    attractionId: string
                    created_at: string | null
                    event_date: string
                    event_id: string
                    event_name: string
                    event_time: string | null
                    event_url: string
                    id: string
                    is_active: boolean | null
                    updated_at: string | null
                    venue_city: string | null
                    venue_country: string | null
                    venue_name: string | null
                    venue_state: string | null
                }
                Insert: {
                    artist_uuid?: string | null
                    attractionId: string
                    created_at?: string | null
                    event_date: string
                    event_id: string
                    event_name: string
                    event_time?: string | null
                    event_url: string
                    id?: string
                    is_active?: boolean | null
                    updated_at?: string | null
                    venue_city?: string | null
                    venue_country?: string | null
                    venue_name?: string | null
                    venue_state?: string | null
                }
                Update: {
                    artist_uuid?: string | null
                    attractionId?: string
                    created_at?: string | null
                    event_date?: string
                    event_id?: string
                    event_name?: string
                    event_time?: string | null
                    event_url?: string
                    id?: string
                    is_active?: boolean | null
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
                    artist_otwid: number | null
                    artist_uuid: string | null
                    created_at: string | null
                    username: string
                    uuid: string
                }
                Insert: {
                    artist_otwid?: number | null
                    artist_uuid?: string | null
                    created_at?: string | null
                    username: string
                    uuid?: string
                }
                Update: {
                    artist_otwid?: number | null
                    artist_uuid?: string | null
                    created_at?: string | null
                    username?: string
                    uuid?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "top25_votes_artist_uuid_fkey"
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
            insert_ticket_entry: {
                Args: { p_email: string; p_username: string; p_user_id?: string }
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
  