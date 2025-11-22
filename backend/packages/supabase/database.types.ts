export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      dataset_access_logs: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at: string
          bytes_transferred: number | null
          city: string | null
          country_code: string | null
          dataset_id: string
          id: string
          ip_address: unknown | null
          license_id: string | null
          referer: string | null
          response_time_ms: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id?: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_access_logs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_access_logs_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_access_logs_2025_10: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at: string
          bytes_transferred: number | null
          city: string | null
          country_code: string | null
          dataset_id: string
          id: string
          ip_address: unknown | null
          license_id: string | null
          referer: string | null
          response_time_ms: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id?: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dataset_access_logs_2025_11: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at: string
          bytes_transferred: number | null
          city: string | null
          country_code: string | null
          dataset_id: string
          id: string
          ip_address: unknown | null
          license_id: string | null
          referer: string | null
          response_time_ms: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id?: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dataset_access_logs_2025_12: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at: string
          bytes_transferred: number | null
          city: string | null
          country_code: string | null
          dataset_id: string
          id: string
          ip_address: unknown | null
          license_id: string | null
          referer: string | null
          response_time_ms: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          accessed_at?: string
          bytes_transferred?: number | null
          city?: string | null
          country_code?: string | null
          dataset_id?: string
          id?: string
          ip_address?: unknown | null
          license_id?: string | null
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      datasets: {
        Row: {
          ai_training_allowed: boolean | null
          archived_at: string | null
          attestation_source: string | null
          attestations: Json | null
          attribution_required: boolean | null
          average_rating: number | null
          blockchain_explorer_url: string | null
          blockchain_registered_at: string | null
          blockchain_registry_account: string | null
          blockchain_sync_status: string | null
          blockchain_tx_hash: string | null
          can_commercial_use: boolean | null
          can_resale: boolean | null
          category: Database["public"]["Enums"]["dataset_category"]
          commercial_use: boolean | null
          consent_required: boolean | null
          created_at: string
          dataset_hash: string | null
          derivative_works_allowed: boolean | null
          description: string
          download_count: number | null
          featured_at: string | null
          file_content_hash: string | null
          file_format: string
          file_hash_algorithm: string | null
          file_hash_verified_at: string | null
          geographic_regions: string[] | null
          geographic_restrictions: boolean | null
          hardware_verified: boolean | null
          id: string
          is_featured: boolean | null
          is_marketplace_only: boolean | null
          license_duration_days: number | null
          license_on_chain_metadata: Json | null
          license_price_usd: number | null
          license_terms: string | null
          license_type: string
          max_owners: number | null
          preview_files: Json | null
          price_usdc: number
          published_at: string | null
          purchase_count: number | null
          redistribution_allowed: boolean | null
          review_count: number | null
          royalty_bps: number | null
          search_vector: unknown | null
          semantic_tags: Json | null
          size_bytes: number
          size_formatted: string | null
          solana_listing_pubkey: string | null
          solana_tx_signature: string | null
          sp1_commitment: string | null
          sp1_proof_hash: string | null
          status: Database["public"]["Enums"]["dataset_status"]
          status_reason: string | null
          storage_bucket: string | null
          storage_key: string
          storage_provider: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_revenue: number | null
          updated_at: string
          upload_completed_at: string | null
          upload_progress: number | null
          upload_started_at: string | null
          upload_status: string | null
          user_id: string
          verification_date: string | null
          verification_score: number | null
          verification_status: boolean | null
          view_count: number | null
        }
        Insert: {
          ai_training_allowed?: boolean | null
          archived_at?: string | null
          attestation_source?: string | null
          attestations?: Json | null
          attribution_required?: boolean | null
          average_rating?: number | null
          blockchain_explorer_url?: string | null
          blockchain_registered_at?: string | null
          blockchain_registry_account?: string | null
          blockchain_sync_status?: string | null
          blockchain_tx_hash?: string | null
          can_commercial_use?: boolean | null
          can_resale?: boolean | null
          category: Database["public"]["Enums"]["dataset_category"]
          commercial_use?: boolean | null
          consent_required?: boolean | null
          created_at?: string
          dataset_hash?: string | null
          derivative_works_allowed?: boolean | null
          description: string
          download_count?: number | null
          featured_at?: string | null
          file_content_hash?: string | null
          file_format: string
          file_hash_algorithm?: string | null
          file_hash_verified_at?: string | null
          geographic_regions?: string[] | null
          geographic_restrictions?: boolean | null
          hardware_verified?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_marketplace_only?: boolean | null
          license_duration_days?: number | null
          license_on_chain_metadata?: Json | null
          license_price_usd?: number | null
          license_terms?: string | null
          license_type: string
          max_owners?: number | null
          preview_files?: Json | null
          price_usdc: number
          published_at?: string | null
          purchase_count?: number | null
          redistribution_allowed?: boolean | null
          review_count?: number | null
          royalty_bps?: number | null
          search_vector?: unknown | null
          semantic_tags?: Json | null
          size_bytes: number
          size_formatted?: string | null
          solana_listing_pubkey?: string | null
          solana_tx_signature?: string | null
          sp1_commitment?: string | null
          sp1_proof_hash?: string | null
          status?: Database["public"]["Enums"]["dataset_status"]
          status_reason?: string | null
          storage_bucket?: string | null
          storage_key: string
          storage_provider?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_revenue?: number | null
          updated_at?: string
          upload_completed_at?: string | null
          upload_progress?: number | null
          upload_started_at?: string | null
          upload_status?: string | null
          user_id: string
          verification_date?: string | null
          verification_score?: number | null
          verification_status?: boolean | null
          view_count?: number | null
        }
        Update: {
          ai_training_allowed?: boolean | null
          archived_at?: string | null
          attestation_source?: string | null
          attestations?: Json | null
          attribution_required?: boolean | null
          average_rating?: number | null
          blockchain_explorer_url?: string | null
          blockchain_registered_at?: string | null
          blockchain_registry_account?: string | null
          blockchain_sync_status?: string | null
          blockchain_tx_hash?: string | null
          can_commercial_use?: boolean | null
          can_resale?: boolean | null
          category?: Database["public"]["Enums"]["dataset_category"]
          commercial_use?: boolean | null
          consent_required?: boolean | null
          created_at?: string
          dataset_hash?: string | null
          derivative_works_allowed?: boolean | null
          description?: string
          download_count?: number | null
          featured_at?: string | null
          file_content_hash?: string | null
          file_format?: string
          file_hash_algorithm?: string | null
          file_hash_verified_at?: string | null
          geographic_regions?: string[] | null
          geographic_restrictions?: boolean | null
          hardware_verified?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_marketplace_only?: boolean | null
          license_duration_days?: number | null
          license_on_chain_metadata?: Json | null
          license_price_usd?: number | null
          license_terms?: string | null
          license_type?: string
          max_owners?: number | null
          preview_files?: Json | null
          price_usdc?: number
          published_at?: string | null
          purchase_count?: number | null
          redistribution_allowed?: boolean | null
          review_count?: number | null
          royalty_bps?: number | null
          search_vector?: unknown | null
          semantic_tags?: Json | null
          size_bytes?: number
          size_formatted?: string | null
          solana_listing_pubkey?: string | null
          solana_tx_signature?: string | null
          sp1_commitment?: string | null
          sp1_proof_hash?: string | null
          status?: Database["public"]["Enums"]["dataset_status"]
          status_reason?: string | null
          storage_bucket?: string | null
          storage_key?: string
          storage_provider?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_revenue?: number | null
          updated_at?: string
          upload_completed_at?: string | null
          upload_progress?: number | null
          upload_started_at?: string | null
          upload_status?: string | null
          user_id?: string
          verification_date?: string | null
          verification_score?: number | null
          verification_status?: boolean | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "datasets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_entries: {
        Row: {
          author_name: string | null
          category: Database["public"]["Enums"]["dataset_category"]
          created_at: string
          data_size: string | null
          description: string
          entry_type: string
          estimated_budget: string | null
          hardware_type: string | null
          id: string
          interested_count: number
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          category: Database["public"]["Enums"]["dataset_category"]
          created_at?: string
          data_size?: string | null
          description: string
          entry_type: string
          estimated_budget?: string | null
          hardware_type?: string | null
          id?: string
          interested_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          category?: Database["public"]["Enums"]["dataset_category"]
          created_at?: string
          data_size?: string | null
          description?: string
          entry_type?: string
          estimated_budget?: string | null
          hardware_type?: string | null
          id?: string
          interested_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_verifications: {
        Row: {
          anti_synthesis_score: number | null
          data_commitment: string
          dataset_id: string
          device_id: string
          device_model: string | null
          firmware_version: string | null
          id: string
          nonce: number
          physics_verified: boolean | null
          proof_metadata: Json | null
          solana_tx_signature: string | null
          solana_verification_pubkey: string | null
          sp1_proof_hash: string
          sp1_public_values_hash: string
          vendor: Database["public"]["Enums"]["hardware_vendor"]
          verification_score: number
          verified_at: string
          verifier_user_id: string | null
        }
        Insert: {
          anti_synthesis_score?: number | null
          data_commitment: string
          dataset_id: string
          device_id: string
          device_model?: string | null
          firmware_version?: string | null
          id?: string
          nonce: number
          physics_verified?: boolean | null
          proof_metadata?: Json | null
          solana_tx_signature?: string | null
          solana_verification_pubkey?: string | null
          sp1_proof_hash: string
          sp1_public_values_hash: string
          vendor: Database["public"]["Enums"]["hardware_vendor"]
          verification_score: number
          verified_at?: string
          verifier_user_id?: string | null
        }
        Update: {
          anti_synthesis_score?: number | null
          data_commitment?: string
          dataset_id?: string
          device_id?: string
          device_model?: string | null
          firmware_version?: string | null
          id?: string
          nonce?: number
          physics_verified?: boolean | null
          proof_metadata?: Json | null
          solana_tx_signature?: string | null
          solana_verification_pubkey?: string | null
          sp1_proof_hash?: string
          sp1_public_values_hash?: string
          vendor?: Database["public"]["Enums"]["hardware_vendor"]
          verification_score?: number
          verified_at?: string
          verifier_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_verifications_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_verifications_verifier_user_id_fkey"
            columns: ["verifier_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      license_purchases: {
        Row: {
          blockchain_signature: string | null
          blockchain_tx_hash: string | null
          buyer_user_id: string
          created_at: string | null
          dataset_id: string
          expires_at: string | null
          id: string
          license_terms: string
          license_type: string
          purchase_price_usd: number
          purchased_at: string | null
          seller_user_id: string
          updated_at: string | null
        }
        Insert: {
          blockchain_signature?: string | null
          blockchain_tx_hash?: string | null
          buyer_user_id: string
          created_at?: string | null
          dataset_id: string
          expires_at?: string | null
          id?: string
          license_terms: string
          license_type: string
          purchase_price_usd: number
          purchased_at?: string | null
          seller_user_id: string
          updated_at?: string | null
        }
        Update: {
          blockchain_signature?: string | null
          blockchain_tx_hash?: string | null
          buyer_user_id?: string
          created_at?: string | null
          dataset_id?: string
          expires_at?: string | null
          id?: string
          license_terms?: string
          license_type?: string
          purchase_price_usd?: number
          purchased_at?: string | null
          seller_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_purchases_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          access_count: number | null
          blockchain_sync_status: string | null
          buyer_id: string
          created_at: string
          dataset_id: string
          download_allowed: boolean | null
          expiration_date: string | null
          id: string
          is_transferable: boolean | null
          last_access_at: string | null
          license_type: string
          original_buyer_id: string | null
          platform_fee_usdc: number
          purchase_date: string
          purchase_price_usdc: number
          revoked_at: string | null
          revoked_reason: string | null
          seller_id: string
          seller_payout_usdc: number
          solana_license_pubkey: string | null
          solana_tx_signature: string | null
          status: Database["public"]["Enums"]["license_status"]
          transfer_count: number | null
          updated_at: string
          usage_limit: number | null
          usage_rights: Json
        }
        Insert: {
          access_count?: number | null
          blockchain_sync_status?: string | null
          buyer_id: string
          created_at?: string
          dataset_id: string
          download_allowed?: boolean | null
          expiration_date?: string | null
          id?: string
          is_transferable?: boolean | null
          last_access_at?: string | null
          license_type: string
          original_buyer_id?: string | null
          platform_fee_usdc: number
          purchase_date?: string
          purchase_price_usdc: number
          revoked_at?: string | null
          revoked_reason?: string | null
          seller_id: string
          seller_payout_usdc: number
          solana_license_pubkey?: string | null
          solana_tx_signature?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          transfer_count?: number | null
          updated_at?: string
          usage_limit?: number | null
          usage_rights: Json
        }
        Update: {
          access_count?: number | null
          blockchain_sync_status?: string | null
          buyer_id?: string
          created_at?: string
          dataset_id?: string
          download_allowed?: boolean | null
          expiration_date?: string | null
          id?: string
          is_transferable?: boolean | null
          last_access_at?: string | null
          license_type?: string
          original_buyer_id?: string | null
          platform_fee_usdc?: number
          purchase_date?: string
          purchase_price_usdc?: number
          revoked_at?: string | null
          revoked_reason?: string | null
          seller_id?: string
          seller_payout_usdc?: number
          solana_license_pubkey?: string | null
          solana_tx_signature?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          transfer_count?: number | null
          updated_at?: string
          usage_limit?: number | null
          usage_rights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "licenses_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_original_buyer_id_fkey"
            columns: ["original_buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          dataset_id: string | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          sent_via_email: boolean | null
          title: string
          transaction_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          dataset_id?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          sent_via_email?: boolean | null
          title: string
          transaction_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          dataset_id?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          sent_via_email?: boolean | null
          title?: string
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          accuracy_rating: number | null
          created_at: string
          data_quality_rating: number | null
          dataset_id: string
          documentation_rating: number | null
          helpful_count: number | null
          id: string
          is_flagged: boolean | null
          is_hidden: boolean | null
          license_id: string | null
          moderation_notes: string | null
          not_helpful_count: number | null
          rating: number
          review_text: string
          reviewer_id: string
          seller_response: string | null
          seller_response_at: string | null
          title: string | null
          updated_at: string
          value_for_money_rating: number | null
          verified_purchase: boolean | null
        }
        Insert: {
          accuracy_rating?: number | null
          created_at?: string
          data_quality_rating?: number | null
          dataset_id: string
          documentation_rating?: number | null
          helpful_count?: number | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          license_id?: string | null
          moderation_notes?: string | null
          not_helpful_count?: number | null
          rating: number
          review_text: string
          reviewer_id: string
          seller_response?: string | null
          seller_response_at?: string | null
          title?: string | null
          updated_at?: string
          value_for_money_rating?: number | null
          verified_purchase?: boolean | null
        }
        Update: {
          accuracy_rating?: number | null
          created_at?: string
          data_quality_rating?: number | null
          dataset_id?: string
          documentation_rating?: number | null
          helpful_count?: number | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          license_id?: string | null
          moderation_notes?: string | null
          not_helpful_count?: number | null
          rating?: number
          review_text?: string
          reviewer_id?: string
          seller_response?: string | null
          seller_response_at?: string | null
          title?: string | null
          updated_at?: string
          value_for_money_rating?: number | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          category: string | null
          clicked_dataset_ids: string[] | null
          filters: Json | null
          id: string
          ip_address: unknown | null
          query_text: string
          result_count: number | null
          searched_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          clicked_dataset_ids?: string[] | null
          filters?: Json | null
          id?: string
          ip_address?: unknown | null
          query_text: string
          result_count?: number | null
          searched_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          clicked_dataset_ids?: string[] | null
          filters?: Json | null
          id?: string
          ip_address?: unknown | null
          query_text?: string
          result_count?: number | null
          searched_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_usdc: number
          blockchain_confirmations: number | null
          completed_at: string | null
          created_at: string
          dataset_id: string | null
          description: string | null
          failed_at: string | null
          failure_reason: string | null
          fee_usdc: number | null
          from_user_id: string | null
          id: string
          license_id: string | null
          metadata: Json | null
          net_amount_usdc: number
          payment_method: string | null
          payment_processor: string | null
          solana_tx_signature: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          to_user_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount_usdc: number
          blockchain_confirmations?: number | null
          completed_at?: string | null
          created_at?: string
          dataset_id?: string | null
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          fee_usdc?: number | null
          from_user_id?: string | null
          id?: string
          license_id?: string | null
          metadata?: Json | null
          net_amount_usdc: number
          payment_method?: string | null
          payment_processor?: string | null
          solana_tx_signature?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          to_user_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount_usdc?: number
          blockchain_confirmations?: number | null
          completed_at?: string | null
          created_at?: string
          dataset_id?: string | null
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          fee_usdc?: number | null
          from_user_id?: string | null
          id?: string
          license_id?: string | null
          metadata?: Json | null
          net_amount_usdc?: number
          payment_method?: string | null
          payment_processor?: string | null
          solana_tx_signature?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          to_user_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          chunks_total: number | null
          chunks_uploaded: number | null
          completed_at: string | null
          created_at: string | null
          dataset_id: string | null
          error_message: string | null
          file_hash: string | null
          file_name: string
          file_size: number
          id: string
          last_activity_at: string | null
          metadata: Json | null
          presigned_url_expires_at: string | null
          progress_percent: number | null
          r2_key: string | null
          r2_upload_id: string | null
          retry_count: number | null
          started_at: string | null
          updated_at: string | null
          upload_status: string | null
          user_id: string
        }
        Insert: {
          chunks_total?: number | null
          chunks_uploaded?: number | null
          completed_at?: string | null
          created_at?: string | null
          dataset_id?: string | null
          error_message?: string | null
          file_hash?: string | null
          file_name: string
          file_size: number
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          presigned_url_expires_at?: string | null
          progress_percent?: number | null
          r2_key?: string | null
          r2_upload_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          updated_at?: string | null
          upload_status?: string | null
          user_id: string
        }
        Update: {
          chunks_total?: number | null
          chunks_uploaded?: number | null
          completed_at?: string | null
          created_at?: string | null
          dataset_id?: string | null
          error_message?: string | null
          file_hash?: string | null
          file_name?: string
          file_size?: number
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          presigned_url_expires_at?: string | null
          progress_percent?: number | null
          r2_key?: string | null
          r2_upload_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          updated_at?: string | null
          upload_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quotas: {
        Row: {
          created_at: string | null
          max_storage_bytes: number | null
          tier: string | null
          total_storage_bytes: number | null
          updated_at: string | null
          uploads_reset_at: string | null
          uploads_today: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          max_storage_bytes?: number | null
          tier?: string | null
          total_storage_bytes?: number | null
          updated_at?: string | null
          uploads_reset_at?: string | null
          uploads_today?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          max_storage_bytes?: number | null
          tier?: string | null
          total_storage_bytes?: number | null
          updated_at?: string | null
          uploads_reset_at?: string | null
          uploads_today?: number | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          company_website: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          id: string
          is_admin: boolean | null
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          last_login_at: string | null
          notification_preferences: Json | null
          privacy_settings: Json | null
          privy_id: string
          reputation_score: number | null
          total_datasets: number | null
          total_revenue: number | null
          total_sales: number | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_admin?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          last_login_at?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          privy_id: string
          reputation_score?: number | null
          total_datasets?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_admin?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          last_login_at?: string | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          privy_id?: string
          reputation_score?: number | null
          total_datasets?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_next_partition: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_discovery_interest: {
        Args: { entry_id: string }
        Returns: {
          author_name: string | null
          category: Database["public"]["Enums"]["dataset_category"]
          created_at: string
          data_size: string | null
          description: string
          entry_type: string
          estimated_budget: string | null
          hardware_type: string | null
          id: string
          interested_count: number
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      access_type: "view" | "preview" | "download" | "stream" | "api_access"
      dataset_category:
        | "robotics"
        | "autonomous_vehicles"
        | "drone"
        | "manipulation"
        | "navigation"
        | "sensor_data"
        | "human_robot_interaction"
        | "embodied_ai"
        | "motion_capture"
        | "other"
      dataset_status: "draft" | "pending" | "live" | "rejected" | "archived"
      hardware_vendor: "dji" | "nvidia" | "qualcomm" | "custom"
      license_status: "active" | "expired" | "revoked" | "transferred"
      notification_type:
        | "dataset_purchased"
        | "dataset_verified"
        | "dataset_rejected"
        | "new_review"
        | "revenue_milestone"
        | "license_expiring"
        | "system_announcement"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type:
        | "purchase"
        | "royalty"
        | "withdrawal"
        | "refund"
        | "platform_fee"
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
      access_type: ["view", "preview", "download", "stream", "api_access"],
      dataset_category: [
        "robotics",
        "autonomous_vehicles",
        "drone",
        "manipulation",
        "navigation",
        "sensor_data",
        "human_robot_interaction",
        "embodied_ai",
        "motion_capture",
        "other",
      ],
      dataset_status: ["draft", "pending", "live", "rejected", "archived"],
      hardware_vendor: ["dji", "nvidia", "qualcomm", "custom"],
      license_status: ["active", "expired", "revoked", "transferred"],
      notification_type: [
        "dataset_purchased",
        "dataset_verified",
        "dataset_rejected",
        "new_review",
        "revenue_milestone",
        "license_expiring",
        "system_announcement",
      ],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: [
        "purchase",
        "royalty",
        "withdrawal",
        "refund",
        "platform_fee",
      ],
    },
  },
} as const

