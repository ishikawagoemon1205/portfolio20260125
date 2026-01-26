-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT UNIQUE NOT NULL,
  fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_blocked BOOLEAN DEFAULT false,
  tier INTEGER DEFAULT 1,
  total_messages INTEGER DEFAULT 0,
  total_sites_generated INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  name TEXT,
  email TEXT,
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX idx_visitors_fingerprint ON visitors(fingerprint);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  title TEXT,
  character_pattern_id UUID,
  status TEXT DEFAULT 'active',
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Generated Sites table
CREATE TABLE IF NOT EXISTS generated_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  unique_url TEXT UNIQUE NOT NULL,
  html_content TEXT NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_sites_visitor_id ON generated_sites(visitor_id);
CREATE INDEX idx_generated_sites_unique_url ON generated_sites(unique_url);
CREATE INDEX idx_generated_sites_expires_at ON generated_sites(expires_at);

-- Usage Limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  limit_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_limits_visitor_id ON usage_limits(visitor_id);
CREATE INDEX idx_usage_limits_reset_at ON usage_limits(reset_at);

-- Admin Users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default AI settings
INSERT INTO ai_settings (key, value, description) VALUES
  ('chat_model', '"gpt-4o-mini"', 'チャット用のOpenAIモデル'),
  ('site_generation_model', '"gpt-4o"', 'サイト生成用のOpenAIモデル'),
  ('max_tokens', '2000', '最大トークン数'),
  ('temperature', '0.7', 'モデルの温度パラメータ'),
  ('system_prompt_base', '"あなたはあっちゃんAIです。"', 'システムプロンプトのベース')
ON CONFLICT (key) DO NOTHING;

-- Profile Data table
CREATE TABLE IF NOT EXISTS profile_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  weight REAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_data_category ON profile_data(category);
CREATE INDEX idx_profile_data_is_active ON profile_data(is_active);

-- Sample profile data
INSERT INTO profile_data (category, key, value, display_order, weight) VALUES
  ('skill', 'frontend', 'React, Next.js, TypeScript', 1, 1.0),
  ('skill', 'backend', 'Node.js, Python, Supabase', 2, 1.0),
  ('skill', 'ai', 'OpenAI API, Prompt Engineering', 3, 1.0),
  ('experience', 'years', '5年以上のWeb開発経験', 1, 1.0),
  ('experience', 'projects', '20以上のプロジェクト実績', 2, 1.0),
  ('personality', 'trait1', '丁寧で分かりやすい説明', 1, 1.0),
  ('personality', 'trait2', '最新技術へのキャッチアップ', 2, 1.0)
ON CONFLICT DO NOTHING;

-- Character Patterns table
CREATE TABLE IF NOT EXISTS character_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  tone TEXT NOT NULL,
  style TEXT NOT NULL,
  emoji_usage TEXT DEFAULT 'moderate',
  response_length TEXT DEFAULT 'medium',
  formality_level INTEGER DEFAULT 5,
  enthusiasm_level INTEGER DEFAULT 5,
  technical_depth INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample character patterns
INSERT INTO character_patterns (name, description, tone, style, formality_level, enthusiasm_level, technical_depth) VALUES
  ('フレンドリー', 'カジュアルで親しみやすい', 'friendly', 'casual', 3, 8, 5),
  ('プロフェッショナル', 'ビジネス向けの丁寧な対応', 'professional', 'formal', 8, 5, 7),
  ('テクニカル', '技術的で詳細な説明', 'technical', 'detailed', 6, 6, 9),
  ('エンスージアスト', '熱意があり積極的', 'enthusiastic', 'energetic', 4, 9, 6)
ON CONFLICT DO NOTHING;

-- Profile Images table
CREATE TABLE IF NOT EXISTS profile_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  alt_text TEXT,
  category TEXT,
  weight REAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Mentions table
CREATE TABLE IF NOT EXISTS profile_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  profile_item_category TEXT NOT NULL,
  profile_item_key TEXT NOT NULL,
  mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  reaction_sentiment TEXT
);

CREATE INDEX idx_profile_mentions_conversation_id ON profile_mentions(conversation_id);
CREATE INDEX idx_profile_mentions_category_key ON profile_mentions(profile_item_category, profile_item_key);

-- Conversation Embeddings table
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  embedding vector(1536),
  content_summary TEXT,
  topics TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_embeddings_conversation_id ON conversation_embeddings(conversation_id);

-- API Usage Tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  estimated_cost NUMERIC(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_conversation_id ON api_usage(conversation_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

-- Inquiries table (問い合わせ管理)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  summary TEXT NOT NULL,
  project_type TEXT,
  budget_range TEXT,
  timeline TEXT,
  details TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inquiries_visitor_id ON inquiries(visitor_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
