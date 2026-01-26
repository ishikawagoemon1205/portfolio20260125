/**
 * Database Types
 * Supabaseデータベースのテーブル定義
 */

// JSON type for JSONB columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Visitor tier definition
export type VisitorTier = 1 | 2 | 3 | 4;

export interface Database {
  public: {
    Tables: {
      visitors: {
        Row: {
          id: string;
          visitor_id: string;
          fingerprint: string | null;
          ip_address: string | null;
          user_agent: string | null;
          is_blocked: boolean;
          tier: VisitorTier;
          total_messages: number;
          total_sites_generated: number;
          visit_count: number;
          name: string | null;
          email: string | null;
          last_visit_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          fingerprint?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          is_blocked?: boolean;
          tier?: VisitorTier;
          total_messages?: number;
          total_sites_generated?: number;
          visit_count?: number;
          name?: string | null;
          email?: string | null;
          last_visit_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          fingerprint?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          is_blocked?: boolean;
          tier?: VisitorTier;
          total_messages?: number;
          total_sites_generated?: number;
          visit_count?: number;
          name?: string | null;
          email?: string | null;
          last_visit_at?: string;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          visitor_id: string;
          title: string | null;
          character_pattern_id: string | null;
          status: string;
          message_count: number;
          started_at: string;
          last_message_at: string;
          ended_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          title?: string | null;
          character_pattern_id?: string | null;
          status?: string;
          message_count?: number;
          started_at?: string;
          last_message_at?: string;
          ended_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          title?: string | null;
          character_pattern_id?: string | null;
          status?: string;
          message_count?: number;
          started_at?: string;
          last_message_at?: string;
          ended_at?: string | null;
          metadata?: Json;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          token_count: number | null;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          token_count?: number | null;
          model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          token_count?: number | null;
          model?: string | null;
          created_at?: string;
        };
      };
      generated_sites: {
        Row: {
          id: string;
          visitor_id: string;
          conversation_id: string | null;
          unique_url: string;
          html_content: string;
          access_count: number;
          last_accessed_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          conversation_id?: string | null;
          unique_url: string;
          html_content: string;
          access_count?: number;
          last_accessed_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          conversation_id?: string | null;
          unique_url?: string;
          html_content?: string;
          access_count?: number;
          last_accessed_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      usage_limits: {
        Row: {
          id: string;
          visitor_id: string;
          limit_type: string;
          count: number;
          reset_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          limit_type: string;
          count?: number;
          reset_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          limit_type?: string;
          count?: number;
          reset_at?: string;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: string;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
        };
      };
      ai_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
      };
      profile_data: {
        Row: {
          id: string;
          category: string;
          key: string;
          value: string;
          display_order: number;
          weight: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          key: string;
          value: string;
          display_order?: number;
          weight?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          key?: string;
          value?: string;
          display_order?: number;
          weight?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      character_patterns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          tone: string;
          style: string;
          emoji_usage: string;
          response_length: string;
          formality_level: number;
          enthusiasm_level: number;
          technical_depth: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          tone: string;
          style: string;
          emoji_usage?: string;
          response_length?: string;
          formality_level?: number;
          enthusiasm_level?: number;
          technical_depth?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          tone?: string;
          style?: string;
          emoji_usage?: string;
          response_length?: string;
          formality_level?: number;
          enthusiasm_level?: number;
          technical_depth?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      profile_images: {
        Row: {
          id: string;
          url: string;
          alt_text: string | null;
          category: string | null;
          weight: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          alt_text?: string | null;
          category?: string | null;
          weight?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          alt_text?: string | null;
          category?: string | null;
          weight?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      profile_mentions: {
        Row: {
          id: string;
          conversation_id: string;
          message_id: string | null;
          profile_item_category: string;
          profile_item_key: string;
          mentioned_at: string;
          reaction_sentiment: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          message_id?: string | null;
          profile_item_category: string;
          profile_item_key: string;
          mentioned_at?: string;
          reaction_sentiment?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          message_id?: string | null;
          profile_item_category?: string;
          profile_item_key?: string;
          mentioned_at?: string;
          reaction_sentiment?: string | null;
        };
      };
      conversation_embeddings: {
        Row: {
          id: string;
          conversation_id: string;
          embedding: number[] | null;
          content_summary: string | null;
          topics: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          embedding?: number[] | null;
          content_summary?: string | null;
          topics?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          embedding?: number[] | null;
          content_summary?: string | null;
          topics?: string[] | null;
          created_at?: string;
        };
      };
      api_usage: {
        Row: {
          id: string;
          conversation_id: string | null;
          message_id: string | null;
          service: string;
          model: string | null;
          tokens_used: number | null;
          estimated_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          message_id?: string | null;
          service: string;
          model?: string | null;
          tokens_used?: number | null;
          estimated_cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          message_id?: string | null;
          service?: string;
          model?: string | null;
          tokens_used?: number | null;
          estimated_cost?: number | null;
          created_at?: string;
        };
      };
      inquiries: {
        Row: {
          id: string;
          visitor_id: string;
          conversation_id: string | null;
          email: string;
          name: string | null;
          company: string | null;
          summary: string;
          project_type: string | null;
          budget_range: string | null;
          timeline: string | null;
          details: string | null;
          status: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          conversation_id?: string | null;
          email: string;
          name?: string | null;
          company?: string | null;
          summary: string;
          project_type?: string | null;
          budget_range?: string | null;
          timeline?: string | null;
          details?: string | null;
          status?: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          conversation_id?: string | null;
          email?: string;
          name?: string | null;
          company?: string | null;
          summary?: string;
          project_type?: string | null;
          budget_range?: string | null;
          timeline?: string | null;
          details?: string | null;
          status?: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Visitor = Database['public']['Tables']['visitors']['Row'];
export type VisitorInsert = Database['public']['Tables']['visitors']['Insert'];
export type VisitorUpdate = Database['public']['Tables']['visitors']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type GeneratedSite = Database['public']['Tables']['generated_sites']['Row'];
export type GeneratedSiteInsert = Database['public']['Tables']['generated_sites']['Insert'];
export type GeneratedSiteUpdate = Database['public']['Tables']['generated_sites']['Update'];

export type ProfileData = Database['public']['Tables']['profile_data']['Row'];
export type ProfileDataInsert = Database['public']['Tables']['profile_data']['Insert'];
export type ProfileDataUpdate = Database['public']['Tables']['profile_data']['Update'];

export type CharacterPattern = Database['public']['Tables']['character_patterns']['Row'];
export type CharacterPatternInsert = Database['public']['Tables']['character_patterns']['Insert'];
export type CharacterPatternUpdate = Database['public']['Tables']['character_patterns']['Update'];

export type ProfileMention = Database['public']['Tables']['profile_mentions']['Row'];
export type ProfileMentionInsert = Database['public']['Tables']['profile_mentions']['Insert'];
export type ProfileMentionUpdate = Database['public']['Tables']['profile_mentions']['Update'];

export type ProfileImage = Database['public']['Tables']['profile_images']['Row'];
export type ProfileImageInsert = Database['public']['Tables']['profile_images']['Insert'];
export type ProfileImageUpdate = Database['public']['Tables']['profile_images']['Update'];

export type ApiUsage = Database['public']['Tables']['api_usage']['Row'];
export type ApiUsageInsert = Database['public']['Tables']['api_usage']['Insert'];
export type ApiUsageUpdate = Database['public']['Tables']['api_usage']['Update'];

export type Inquiry = Database['public']['Tables']['inquiries']['Row'];
export type InquiryInsert = Database['public']['Tables']['inquiries']['Insert'];
export type InquiryUpdate = Database['public']['Tables']['inquiries']['Update'];

// Inquiry status type
export type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';

// Tier limits configuration
export const TIER_LIMITS = {
  1: { messages: 10, sites: 1 },
  2: { messages: 50, sites: 3 },
  3: { messages: 200, sites: 10 },
  4: { messages: 1000, sites: 50 },
} as const;