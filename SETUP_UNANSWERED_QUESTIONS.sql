-- ============================================
-- 未回答質問機能のセットアップSQL
-- ============================================
-- このSQLをSupabase SQL Editorで実行してください
-- 手順: https://supabase.com/dashboard → SQL Editor → 「New Query」

-- 未回答質問テーブルの作成
CREATE TABLE IF NOT EXISTS unanswered_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL UNIQUE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  asked_count INTEGER DEFAULT 1,
  first_asked_at TIMESTAMPTZ DEFAULT NOW(),
  last_asked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 回答登録後のステータス
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'ignored')),
  answer TEXT,
  answered_at TIMESTAMPTZ,
  answered_by UUID REFERENCES auth.users(id),
  
  -- プロフィール連携
  profile_category TEXT,
  profile_item_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_status ON unanswered_questions(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_asked_count ON unanswered_questions(asked_count DESC);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_last_asked ON unanswered_questions(last_asked_at DESC);

-- RLSポリシー
ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for pending questions" ON unanswered_questions;
DROP POLICY IF EXISTS "Authenticated full access" ON unanswered_questions;

-- 認証済みユーザーはフルアクセス
CREATE POLICY "Authenticated full access" ON unanswered_questions
  FOR ALL USING (auth.role() = 'authenticated');

-- 更新時にupdated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_unanswered_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_unanswered_questions_updated_at ON unanswered_questions;
CREATE TRIGGER trigger_update_unanswered_questions_updated_at
  BEFORE UPDATE ON unanswered_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_unanswered_questions_updated_at();

-- 質問が再度来た時にカウントを増やすupsert用の関数
CREATE OR REPLACE FUNCTION upsert_unanswered_question(
  p_question TEXT,
  p_conversation_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO unanswered_questions (question, conversation_id, asked_count, first_asked_at, last_asked_at)
  VALUES (p_question, p_conversation_id, 1, NOW(), NOW())
  ON CONFLICT (question) DO UPDATE SET
    asked_count = unanswered_questions.asked_count + 1,
    last_asked_at = NOW(),
    conversation_id = COALESCE(EXCLUDED.conversation_id, unanswered_questions.conversation_id)
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- セットアップ完了確認
-- ============================================
SELECT 
  'Setup completed!' as message,
  COUNT(*) as unanswered_questions_count
FROM unanswered_questions;
