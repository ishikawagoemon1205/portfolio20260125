-- ============================================
-- 記事機能用テーブル作成 SQL
-- 実行日: 2026年1月26日
-- ============================================

-- articlesテーブル
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                    -- URL用スラッグ（例: "nextjs-tutorial"）
  title TEXT NOT NULL,                          -- タイトル
  subtitle TEXT,                                -- サブタイトル
  content TEXT NOT NULL DEFAULT '',             -- Markdown形式本文
  tags TEXT[] DEFAULT '{}',                     -- 技術タグ（例: ['TypeScript', 'React']）
  related_experience_ids TEXT[] DEFAULT '{}',   -- 職務経歴との紐付け（タイトルベース）
  thumbnail_url TEXT,                           -- サムネイル画像URL
  estimated_reading_time INTEGER DEFAULT 5,     -- 推定読了時間（分）
  is_published BOOLEAN DEFAULT false,           -- 公開/非公開
  published_at TIMESTAMP,                       -- 公開日時
  view_count INTEGER DEFAULT 0,                 -- 閲覧数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);

-- article_viewsテーブル（閲覧数トラッキング）
CREATE TABLE article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_article_views_article_id ON article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON article_views(viewed_at DESC);

-- RLS (Row Level Security) - 必要に応じて有効化
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 確認用クエリ
-- ============================================
-- SELECT * FROM articles;
-- SELECT * FROM article_views;
