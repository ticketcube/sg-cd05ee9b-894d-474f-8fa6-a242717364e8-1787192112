 
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
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_demo_requests: {
        Row: {
          created_at: string | null
          email: string
          event_date: string | null
          event_type: string | null
          expected_attendees: string | null
          id: string
          message: string | null
          name: string
          status: string | null
          user_id: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_date?: string | null
          event_type?: string | null
          expected_attendees?: string | null
          id?: string
          message?: string | null
          name: string
          status?: string | null
          user_id?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_date?: string | null
          event_type?: string | null
          expected_attendees?: string | null
          id?: string
          message?: string | null
          name?: string
          status?: string | null
          user_id?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      artist_mint_payments: {
        Row: {
          artist_user_id: string
          created_at: string | null
          mint_quantity: number
          payment_id: string
          payment_status: string | null
          price_per_mint: number
          stripe_payment_intent: string | null
          template_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          artist_user_id: string
          created_at?: string | null
          mint_quantity: number
          payment_id?: string
          payment_status?: string | null
          price_per_mint: number
          stripe_payment_intent?: string | null
          template_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          artist_user_id?: string
          created_at?: string | null
          mint_quantity?: number
          payment_id?: string
          payment_status?: string | null
          price_per_mint?: number
          stripe_payment_intent?: string | null
          template_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_mint_payments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
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
          top_list: string | null
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
          top_list?: string | null
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
          top_list?: string | null
          uuid?: string
        }
        Relationships: []
      }
      batch_progress: {
        Row: {
          batches_completed: number
          completed_at: string | null
          id: string
          is_running: boolean | null
          last_completed_offset: number
          last_updated_at: string | null
          operation_type: string
          started_at: string | null
          total_artists: number
          total_errors: number | null
          total_new_events: number | null
          total_updated_events: number | null
        }
        Insert: {
          batches_completed: number
          completed_at?: string | null
          id?: string
          is_running?: boolean | null
          last_completed_offset: number
          last_updated_at?: string | null
          operation_type: string
          started_at?: string | null
          total_artists: number
          total_errors?: number | null
          total_new_events?: number | null
          total_updated_events?: number | null
        }
        Update: {
          batches_completed?: number
          completed_at?: string | null
          id?: string
          is_running?: boolean | null
          last_completed_offset?: number
          last_updated_at?: string | null
          operation_type?: string
          started_at?: string | null
          total_artists?: number
          total_errors?: number | null
          total_new_events?: number | null
          total_updated_events?: number | null
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
          action_type: string | null
          action_type_video_title: string | null
          action_url: string | null
          background_color: string | null
          content_text: string | null
          content_type: string
          created_at: string | null
          face_id: string
          face_number: number
          face_title: string | null
          image_url: string | null
          is_current: boolean | null
          is_editable: boolean
          parent_face_id: string | null
          text_color: string | null
          ticketcube_id: string
          user_id: string
          version_number: number | null
        }
        Insert: {
          action_type?: string | null
          action_type_video_title?: string | null
          action_url?: string | null
          background_color?: string | null
          content_text?: string | null
          content_type: string
          created_at?: string | null
          face_id?: string
          face_number: number
          face_title?: string | null
          image_url?: string | null
          is_current?: boolean | null
          is_editable?: boolean
          parent_face_id?: string | null
          text_color?: string | null
          ticketcube_id: string
          user_id: string
          version_number?: number | null
        }
        Update: {
          action_type?: string | null
          action_type_video_title?: string | null
          action_url?: string | null
          background_color?: string | null
          content_text?: string | null
          content_type?: string
          created_at?: string | null
          face_id?: string
          face_number?: number
          face_title?: string | null
          image_url?: string | null
          is_current?: boolean | null
          is_editable?: boolean
          parent_face_id?: string | null
          text_color?: string | null
          ticketcube_id?: string
          user_id?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cube_faces_parent_face_id_fkey"
            columns: ["parent_face_id"]
            isOneToOne: false
            referencedRelation: "cube_faces"
            referencedColumns: ["face_id"]
          },
          {
            foreignKeyName: "cube_faces_ticketcube_id_fkey"
            columns: ["ticketcube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      cube_mints: {
        Row: {
          artist_payout: number
          cloned_cube_id: string | null
          created_at: string | null
          mint_id: string
          mint_number: number
          owner_user_id: string
          platform_fee: number
          purchase_amount: number
          stripe_payment_intent: string | null
          sui_transaction_hash: string | null
          tcube_token_id: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          artist_payout: number
          cloned_cube_id?: string | null
          created_at?: string | null
          mint_id?: string
          mint_number: number
          owner_user_id: string
          platform_fee: number
          purchase_amount: number
          stripe_payment_intent?: string | null
          sui_transaction_hash?: string | null
          tcube_token_id?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          artist_payout?: number
          cloned_cube_id?: string | null
          created_at?: string | null
          mint_id?: string
          mint_number?: number
          owner_user_id?: string
          platform_fee?: number
          purchase_amount?: number
          stripe_payment_intent?: string | null
          sui_transaction_hash?: string | null
          tcube_token_id?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cube_mints_cloned_cube_id_fkey"
            columns: ["cloned_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "cube_mints_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      cube_update_notifications: {
        Row: {
          artist_user_id: string | null
          created_at: string | null
          holder_cube_id: string | null
          holder_user_id: string | null
          is_applied: boolean | null
          is_dismissed: boolean | null
          is_viewed: boolean | null
          notification_id: string
          template_id: string | null
          update_mode: string
        }
        Insert: {
          artist_user_id?: string | null
          created_at?: string | null
          holder_cube_id?: string | null
          holder_user_id?: string | null
          is_applied?: boolean | null
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          notification_id?: string
          template_id?: string | null
          update_mode: string
        }
        Update: {
          artist_user_id?: string | null
          created_at?: string | null
          holder_cube_id?: string | null
          holder_user_id?: string | null
          is_applied?: boolean | null
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          notification_id?: string
          template_id?: string | null
          update_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "cube_update_notifications_holder_cube_id_fkey"
            columns: ["holder_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "cube_update_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      cube_update_payments: {
        Row: {
          amount_total: number | null
          created_at: string | null
          notification_id: string | null
          payment_id: string
          payment_status: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          created_at?: string | null
          notification_id?: string | null
          payment_id?: string
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          created_at?: string | null
          notification_id?: string | null
          payment_id?: string
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cube_update_payments_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "cube_update_notifications"
            referencedColumns: ["notification_id"]
          },
        ]
      }
      minting_price_configs: {
        Row: {
          config_data: Json | null
          config_id: string
          created_at: string | null
          custom_features: Json | null
          is_active: boolean | null
          price_cents: number | null
          price_type: string | null
          stripe_price_id: string | null
          ticketcube_id: string | null
        }
        Insert: {
          config_data?: Json | null
          config_id?: string
          created_at?: string | null
          custom_features?: Json | null
          is_active?: boolean | null
          price_cents?: number | null
          price_type?: string | null
          stripe_price_id?: string | null
          ticketcube_id?: string | null
        }
        Update: {
          config_data?: Json | null
          config_id?: string
          created_at?: string | null
          custom_features?: Json | null
          is_active?: boolean | null
          price_cents?: number | null
          price_type?: string | null
          stripe_price_id?: string | null
          ticketcube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minting_price_configs_ticketcube_id_fkey"
            columns: ["ticketcube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      minting_transactions: {
        Row: {
          artist_revenue_cents: number | null
          artist_user_id: string | null
          buyer_user_id: string | null
          cloned_cube_id: string | null
          completed_at: string | null
          created_at: string | null
          cube_id: string | null
          platform_fee_cents: number | null
          price_cents: number | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          template_id: string | null
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          artist_revenue_cents?: number | null
          artist_user_id?: string | null
          buyer_user_id?: string | null
          cloned_cube_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          cube_id?: string | null
          platform_fee_cents?: number | null
          price_cents?: number | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          template_id?: string | null
          transaction_id?: string
          user_id?: string | null
        }
        Update: {
          artist_revenue_cents?: number | null
          artist_user_id?: string | null
          buyer_user_id?: string | null
          cloned_cube_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          cube_id?: string | null
          platform_fee_cents?: number | null
          price_cents?: number | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          template_id?: string | null
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minting_transactions_cloned_cube_id_fkey"
            columns: ["cloned_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "minting_transactions_cube_id_fkey"
            columns: ["cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "minting_transactions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          home_city: string | null
          id: string
          last_email_sent_at: string | null
          status: string | null
          subscribed_at: string | null
          unsubscribe_token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          home_city?: string | null
          id?: string
          last_email_sent_at?: string | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribe_token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          home_city?: string | null
          id?: string
          last_email_sent_at?: string | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribe_token?: string | null
        }
        Relationships: []
      }
      pending_artist_templates: {
        Row: {
          artist_name: string | null
          pending_id: string
        }
        Insert: {
          artist_name?: string | null
          pending_id?: string
        }
        Update: {
          artist_name?: string | null
          pending_id?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          config_key: string
          config_value: Json | null
          created_at: string | null
          description: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json | null
          created_at?: string | null
          description?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json | null
          created_at?: string | null
          description?: string | null
        }
        Relationships: []
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
          reward_description: string | null
          rewards_url: string | null
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
          reward_description?: string | null
          rewards_url?: string | null
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
          reward_description?: string | null
          rewards_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_roadmap_comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          parent_comment_id: number | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          parent_comment_id?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          parent_comment_id?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      referral_tracking: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          claimed_at: string | null
          cube_id: string | null
          id: string
          referral_source: string
          user_id: string | null
          visited_at: string | null
        }
        Insert: {
          artist_id?: string | null
          artist_name?: string | null
          claimed_at?: string | null
          cube_id?: string | null
          id?: string
          referral_source: string
          user_id?: string | null
          visited_at?: string | null
        }
        Update: {
          artist_id?: string | null
          artist_name?: string | null
          claimed_at?: string | null
          cube_id?: string | null
          id?: string
          referral_source?: string
          user_id?: string | null
          visited_at?: string | null
        }
        Relationships: []
      }
      staff_modules: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      ticket_entries: {
        Row: {
          created_at: string | null
          email: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          user_id?: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      ticketcubes: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          artist_tier: string | null
          artist_upfront_per_cube: number | null
          clone_price_fan: number | null
          created_at: string | null
          cube_id: string
          cube_type: string
          current_mint_count: number | null
          description: string | null
          event_date: string | null
          event_name: string | null
          fan_fee_model: string | null
          glb_url: string | null
          is_active: boolean | null
          is_minting_enabled: boolean | null
          is_secured: boolean | null
          is_template: boolean | null
          max_free_refreshes: number
          max_mint_count: number | null
          mint_price_artist: number | null
          parent_cube_id: string | null
          payment_model: string | null
          platform_revenue_share: number | null
          premium_features: Json | null
          refresh_count: number
          revenue_recovered: number | null
          slug: string | null
          stripe_payment_intent_id: string | null
          tcube_contract_address: string | null
          theme_config: Json | null
          tier: string | null
          title: string
          update_notification_cost: number | null
          updated_at: string | null
          upfront_fee_paid: boolean | null
          upfront_payment_bypassed: boolean | null
          upfront_payment_completed: boolean | null
          upfront_stripe_payment_intent_id: string | null
          user_id: string
          uses_revenue_recovery: boolean | null
          venue: string | null
        }
        Insert: {
          artist_id?: string | null
          artist_name?: string | null
          artist_tier?: string | null
          artist_upfront_per_cube?: number | null
          clone_price_fan?: number | null
          created_at?: string | null
          cube_id?: string
          cube_type?: string
          current_mint_count?: number | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          fan_fee_model?: string | null
          glb_url?: string | null
          is_active?: boolean | null
          is_minting_enabled?: boolean | null
          is_secured?: boolean | null
          is_template?: boolean | null
          max_free_refreshes?: number
          max_mint_count?: number | null
          mint_price_artist?: number | null
          parent_cube_id?: string | null
          payment_model?: string | null
          platform_revenue_share?: number | null
          premium_features?: Json | null
          refresh_count?: number
          revenue_recovered?: number | null
          slug?: string | null
          stripe_payment_intent_id?: string | null
          tcube_contract_address?: string | null
          theme_config?: Json | null
          tier?: string | null
          title: string
          update_notification_cost?: number | null
          updated_at?: string | null
          upfront_fee_paid?: boolean | null
          upfront_payment_bypassed?: boolean | null
          upfront_payment_completed?: boolean | null
          upfront_stripe_payment_intent_id?: string | null
          user_id: string
          uses_revenue_recovery?: boolean | null
          venue?: string | null
        }
        Update: {
          artist_id?: string | null
          artist_name?: string | null
          artist_tier?: string | null
          artist_upfront_per_cube?: number | null
          clone_price_fan?: number | null
          created_at?: string | null
          cube_id?: string
          cube_type?: string
          current_mint_count?: number | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          fan_fee_model?: string | null
          glb_url?: string | null
          is_active?: boolean | null
          is_minting_enabled?: boolean | null
          is_secured?: boolean | null
          is_template?: boolean | null
          max_free_refreshes?: number
          max_mint_count?: number | null
          mint_price_artist?: number | null
          parent_cube_id?: string | null
          payment_model?: string | null
          platform_revenue_share?: number | null
          premium_features?: Json | null
          refresh_count?: number
          revenue_recovered?: number | null
          slug?: string | null
          stripe_payment_intent_id?: string | null
          tcube_contract_address?: string | null
          theme_config?: Json | null
          tier?: string | null
          title?: string
          update_notification_cost?: number | null
          updated_at?: string | null
          upfront_fee_paid?: boolean | null
          upfront_payment_bypassed?: boolean | null
          upfront_payment_completed?: boolean | null
          upfront_stripe_payment_intent_id?: string | null
          user_id?: string
          uses_revenue_recovery?: boolean | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticketcubes_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticketcubes_parent_cube_id_fkey"
            columns: ["parent_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      ticketmaster_events: {
        Row: {
          artist_image: string | null
          artist_name: string | null
          artist_uuid: string | null
          artist_videolink: string | null
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
          artist_image?: string | null
          artist_name?: string | null
          artist_uuid?: string | null
          artist_videolink?: string | null
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
          artist_image?: string | null
          artist_name?: string | null
          artist_uuid?: string | null
          artist_videolink?: string | null
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
          created_at: string | null
          user_id: string
        }
        Insert: {
          artist_uuid: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          artist_uuid?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_dashboard_stats: {
        Row: {
          artists_discovered: number | null
          last_updated_at: string | null
          total_points: number | null
          user_id: string
          weeks_active: number | null
        }
        Insert: {
          artists_discovered?: number | null
          last_updated_at?: string | null
          total_points?: number | null
          user_id: string
          weeks_active?: number | null
        }
        Update: {
          artists_discovered?: number | null
          last_updated_at?: string | null
          total_points?: number | null
          user_id?: string
          weeks_active?: number | null
        }
        Relationships: []
      }
      user_engagements: {
        Row: {
          artist_uuid: string | null
          created_at: string
          engagement_type: string
          id: number
          metadata: Json | null
          points_earned: number | null
          user_id: string
          week_identifier: string | null
          weekly_list_id: number | null
          x_quadrant: number | null
          y_quadrant: number | null
        }
        Insert: {
          artist_uuid?: string | null
          created_at?: string
          engagement_type: string
          id?: number
          metadata?: Json | null
          points_earned?: number | null
          user_id: string
          week_identifier?: string | null
          weekly_list_id?: number | null
          x_quadrant?: number | null
          y_quadrant?: number | null
        }
        Update: {
          artist_uuid?: string | null
          created_at?: string
          engagement_type?: string
          id?: number
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string
          week_identifier?: string | null
          weekly_list_id?: number | null
          x_quadrant?: number | null
          y_quadrant?: number | null
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
          avatar_url: string | null
          city_id: number | null
          created_at: string
          display_name: string | null
          email: string
          last_active: string | null
          raw_city_input: string | null
          role: string | null
          stripe_customer_id: string | null
          stripe_subscription_status: string | null
          total_points: number | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          city_id?: number | null
          created_at?: string
          display_name?: string | null
          email: string
          last_active?: string | null
          raw_city_input?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_status?: string | null
          total_points?: number | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          city_id?: number | null
          created_at?: string
          display_name?: string | null
          email?: string
          last_active?: string | null
          raw_city_input?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_status?: string | null
          total_points?: number | null
          user_id?: string
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
          created_at: string | null
          current_streak: number | null
          last_activity_date: string | null
          longest_streak: number | null
          streak_id: number
          streak_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_id?: number
          streak_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_id?: number
          streak_type?: string
          updated_at?: string | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_engagement: {
        Args: {
          p_artist_id: number
          p_engagement_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      clone_cube_for_fan: {
        Args: { fan_user_id: string; template_id: string }
        Returns: {
          cube_id: string
        }[]
      }
      decrement_mint_count: { Args: { p_cube_id: string }; Returns: undefined }
      get_artist_vote_counts: {
        Args: never
        Returns: {
          artist_name: string
          vote_count: number
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_weekly_list_for_user: {
        Args: { p_user_id: string; p_week_identifier: string }
        Returns: Json
      }
      increment_refresh_count: {
        Args: { cube_id_to_update: string }
        Returns: {
          artist_id: string | null
          artist_name: string | null
          artist_tier: string | null
          artist_upfront_per_cube: number | null
          clone_price_fan: number | null
          created_at: string | null
          cube_id: string
          cube_type: string
          current_mint_count: number | null
          description: string | null
          event_date: string | null
          event_name: string | null
          fan_fee_model: string | null
          glb_url: string | null
          is_active: boolean | null
          is_minting_enabled: boolean | null
          is_secured: boolean | null
          is_template: boolean | null
          max_free_refreshes: number
          max_mint_count: number | null
          mint_price_artist: number | null
          parent_cube_id: string | null
          payment_model: string | null
          platform_revenue_share: number | null
          premium_features: Json | null
          refresh_count: number
          revenue_recovered: number | null
          slug: string | null
          stripe_payment_intent_id: string | null
          tcube_contract_address: string | null
          theme_config: Json | null
          tier: string | null
          title: string
          update_notification_cost: number | null
          updated_at: string | null
          upfront_fee_paid: boolean | null
          upfront_payment_bypassed: boolean | null
          upfront_payment_completed: boolean | null
          upfront_stripe_payment_intent_id: string | null
          user_id: string
          uses_revenue_recovery: boolean | null
          venue: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ticketcubes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_user_points: {
        Args: { points_to_add: number; user_id: string }
        Returns: undefined
      }
      insert_ticket_entry: {
        Args: { p_email: string; p_user_id?: string; p_username: string }
        Returns: Json
      }
      is_otwstaff: { Args: never; Returns: boolean }
      recalculate_user_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      upsert_artist_and_add_to_weekly_list: {
        Args: {
          p_artist_genre: string
          p_artist_home: string
          p_artist_image: string
          p_artist_name: string
          p_artist_videolink: string
          p_weekly_list_id: number
        }
        Returns: string
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
