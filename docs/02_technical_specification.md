# 技術仕様書 v2.0

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Next.js** | 15.x | Reactフレームワーク（App Router） |
| **React** | 19.x | UIライブラリ |
| **TypeScript** | 5.x | 型安全な開発 |
| **Tailwind CSS** | 3.x | ユーティリティファーストCSS |
| **GSAP** | 3.x | **高度なアニメーション** ⭐ |
| **Framer Motion** | 11.x | React用アニメーションライブラリ（補助） |
| **tsparticles** | 3.x | パーティクルエフェクト |
| **react-type-animation** | - | タイピングエフェクト |
| **shadcn/ui** | - | UIコンポーネント |
| **Radix UI** | - | アクセシブルなプリミティブ |
| **Recharts** | 2.x | データビジュアライゼーション |
| **@uiw/react-codemirror** | - | コードエディタ |
| **Shiki** / **Prism.js** | - | シンタックスハイライト |

### バックエンド
| 技術 | 用途 |
|------|------|
| **Next.js API Routes** | RESTful API |
| **Next.js Server Actions** | サーバーサイドロジック |
| **Supabase** | PostgreSQL データベース + 認証 |
| **Supabase Vector** | RAG用ベクトルDB |
| **OpenAI API** | GPT-4o / GPT-4o-mini |
| **Vercel AI SDK** | AI統合ライブラリ |
| **Upstash Redis** | Rate Limiting |

### インフラ
| サービス | 用途 |
|----------|------|
| **Vercel** | ホスティング・デプロイ |
| **Supabase** | データベース・認証・ストレージ |
| **Upstash** | Redis（Rate Limiting） |
| **OpenAI** | AI API |

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────┐
│                   ユーザー（ブラウザ）                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  トップページ（チャット画面）                   │  │
│  │  - GSAP アニメーション                        │  │
│  │  - パーティクルエフェクト                      │  │
│  │  - リアルタイムチャット                        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────┐
│                   Vercel (Next.js)                  │
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │  API Routes      │      │ Server Actions   │   │
│  │  /api/chat       │      │ - chatAction     │   │
│  │  /api/generate   │      │ - saveConv       │   │
│  └──────────────────┘      └──────────────────┘   │
└─────────────────────────────────────────────────────┘
           │                          │
           ↓                          ↓
┌──────────────────┐      ┌──────────────────────────┐
│  OpenAI API      │      │      Supabase            │
│  - GPT-4o        │      │  - PostgreSQL            │
│  - Embeddings    │      │  - Vector (RAG)          │
└──────────────────┘      │  - Auth                  │
                          │  - Row Level Security    │
                          └──────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────┐
│              Upstash Redis                           │
│              - Rate Limiting                         │
└──────────────────────────────────────────────────────┘
```

---

## ディレクトリ構造

```
portfolio20260125/
├── app/
│   ├── (public)/                    # 公開ページ（レイアウト共通）
│   │   ├── layout.tsx               # 公開ページ用レイアウト
│   │   └── page.tsx                 # トップページ（チャット画面）⭐
│   │
│   ├── (admin)/                     # 管理画面（レイアウト共通）
│   │   ├── layout.tsx               # 管理画面用レイアウト
│   │   └── admin/
│   │       ├── secret-entrance/
│   │       │   └── page.tsx         # ログインページ
│   │       ├── dashboard/
│   │       │   └── page.tsx         # ダッシュボード
│   │       ├── conversations/
│   │       │   ├── page.tsx         # 会話履歴一覧
│   │       │   └── [id]/
│   │       │       └── page.tsx     # 会話詳細
│   │       ├── visitors/
│   │       │   └── page.tsx         # 訪問者管理
│   │       ├── generated-sites/
│   │       │   └── page.tsx         # サイト生成ログ
│   │       ├── ai-settings/
│   │       │   └── page.tsx         # AI設定
│   │       └── monitoring/
│   │           └── page.tsx         # モニタリング
│   │
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts             # チャットAPI（ストリーミング）
│   │   ├── generate-site/
│   │   │   └── route.ts             # サイト生成API
│   │   ├── visitor/
│   │   │   └── route.ts             # 訪問者識別API
│   │   └── admin/
│   │       ├── conversations/
│   │       │   └── route.ts         # 会話データ取得
│   │       └── stats/
│   │           └── route.ts         # 統計データ取得
│   │
│   ├── globals.css                  # グローバルスタイル
│   └── layout.tsx                   # ルートレイアウト
│
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx        # チャット全体のコンテナ
│   │   ├── ChatMessages.tsx         # メッセージ一覧
│   │   ├── ChatMessage.tsx          # 単一メッセージ
│   │   ├── ChatInput.tsx            # 入力欄
│   │   ├── TypingIndicator.tsx      # 入力中インジケーター
│   │   └── UsageLimitBanner.tsx     # 使用制限バナー
│   │
│   ├── site-preview/
│   │   ├── SitePreviewModal.tsx     # プレビューモーダル
│   │   ├── CodeEditor.tsx           # コード表示
│   │   ├── PreviewFrame.tsx         # iframeプレビュー
│   │   └── PreviewControls.tsx      # 操作ボタン
│   │
│   ├── animations/
│   │   ├── ParticleBackground.tsx   # パーティクル背景
│   │   ├── TypingEffect.tsx         # タイピングエフェクト
│   │   ├── GSAPTransitions.tsx      # GSAP トランジション
│   │   └── MessageAnimation.tsx     # メッセージアニメーション
│   │
│   ├── admin/
│   │   ├── Sidebar.tsx              # 管理画面サイドバー
│   │   ├── StatsCard.tsx            # 統計カード
│   │   ├── ConversationTable.tsx    # 会話一覧テーブル
│   │   ├── VisitorTable.tsx         # 訪問者テーブル
│   │   ├── SiteGallery.tsx          # サイトギャラリー
│   │   ├── AISettings.tsx           # AI設定フォーム
│   │   └── CostMonitor.tsx          # コストモニタリング
│   │
│   └── ui/                          # 共通UIコンポーネント（shadcn/ui）
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # クライアント用Supabase
│   │   ├── server.ts                # サーバー用Supabase
│   │   └── admin.ts                 # 管理用Supabase（RLS回避）
│   │
│   ├── openai/
│   │   ├── client.ts                # OpenAI クライアント
│   │   ├── chat.ts                  # チャット処理
│   │   ├── site-generator.ts        # サイト生成ロジック
│   │   └── embeddings.ts            # RAG用エンベディング
│   │
│   ├── rate-limit/
│   │   └── redis.ts                 # Upstash Redis（Rate Limiting）
│   │
│   ├── visitor/
│   │   ├── identification.ts        # 訪問者識別
│   │   ├── fingerprint.ts           # ブラウザフィンガープリント
│   │   └── usage-tracking.ts        # 使用量追跡
│   │
│   ├── utils/
│   │   ├── format.ts                # フォーマット関数
│   │   ├── validation.ts            # バリデーション
│   │   └── date.ts                  # 日付処理
│   │
│   └── types/
│       ├── chat.ts                  # チャット型定義
│       ├── visitor.ts               # 訪問者型定義
│       ├── generated-site.ts        # 生成サイト型定義
│       └── admin.ts                 # 管理画面型定義
│
├── hooks/
│   ├── useChat.ts                   # チャット用カスタムフック
│   ├── useVisitor.ts                # 訪問者識別フック
│   ├── useGSAP.ts                   # GSAP アニメーションフック
│   └── useConversations.ts          # 会話履歴フック（管理画面）
│
├── public/
│   └── images/
│
├── docs/                            # 設計資料
├── .env.local                       # 環境変数（Git管理外）
├── .env.example                     # 環境変数サンプル
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## データベース設計（Supabase PostgreSQL）

### テーブル一覧
1. `visitors` - 訪問者情報
2. `conversations` - 会話履歴
3. `messages` - 個別メッセージ
4. `generated_sites` - 生成されたサイト
5. `usage_limits` - 使用制限管理
6. `admin_users` - 管理者（石川さんのみ）
7. `ai_settings` - AI設定（システムプロンプト等）
8. **`profile_data`** - **プロフィール情報（動的編集可能）** ⭐ NEW
9. **`character_patterns`** - **キャラクター口調パターン** ⭐ NEW
10. **`profile_images`** - **プロフィール画像管理** ⭐ NEW
11. **`profile_mentions`** - **プロフィール言及ログ（分析用）** ⭐ NEW
12. `conversation_embeddings` - RAG用ベクトル

---

### 1. visitors（訪問者情報）

```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,         -- Cookie ID
  fingerprint TEXT,                         -- ブラウザフィンガープリント
  name TEXT,                                -- 訪問者の名前（任意）
  email TEXT,                               -- メールアドレス（任意）
  tier INTEGER DEFAULT 1,                   -- Tier (1-4)
  is_blocked BOOLEAN DEFAULT FALSE,         -- ブロック状態
  visit_count INTEGER DEFAULT 0,            -- 訪問回数
  total_messages INTEGER DEFAULT 0,         -- 総メッセージ数
  total_sites_generated INTEGER DEFAULT 0,  -- 生成サイト数
  last_seen_at TIMESTAMP DEFAULT NOW(),     -- 最終訪問日時
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX idx_visitors_fingerprint ON visitors(fingerprint);
CREATE INDEX idx_visitors_email ON visitors(email);
```

---

### 2. conversations（会話セッション）

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  title TEXT,                               -- 会話のタイトル（自動生成）
  summary TEXT,                             -- 要約（AIが生成）
  flag TEXT,                                -- 'prospect' | 'follow_up' | 'normal'
  admin_notes TEXT,                         -- 管理者メモ
  converted_to_inquiry BOOLEAN DEFAULT FALSE, -- 問い合わせに転換したか
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_flag ON conversations(flag);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

---

### 3. messages（個別メッセージ）

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                       -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,                    -- メッセージ内容
  tokens_used INTEGER,                      -- 使用トークン数
  cost_usd DECIMAL(10, 6),                  -- コスト（USD）
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 全文検索用のインデックス
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('japanese', content));
```

---

### 4. generated_sites（生成されたサイト）

```sql
CREATE TABLE generated_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  requirements TEXT NOT NULL,               -- ユーザーの要件
  generated_code TEXT NOT NULL,             -- 生成されたコード（HTML/CSS/JS）
  preview_image_url TEXT,                   -- スクリーンショット（将来的）
  liked BOOLEAN DEFAULT FALSE,              -- 管理者が「いいね」したか
  tokens_used INTEGER,                      -- 使用トークン数
  cost_usd DECIMAL(10, 6),                  -- コスト
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generated_sites_visitor_id ON generated_sites(visitor_id);
CREATE INDEX idx_generated_sites_liked ON generated_sites(liked);
CREATE INDEX idx_generated_sites_created_at ON generated_sites(created_at DESC);
```

---

### 5. usage_limits（使用制限）

```sql
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  date DATE NOT NULL,                       -- 日付
  message_count INTEGER DEFAULT 0,          -- その日のメッセージ数
  site_generation_count INTEGER DEFAULT 0,  -- その日のサイト生成数
  UNIQUE(visitor_id, date)
);

CREATE INDEX idx_usage_limits_visitor_date ON usage_limits(visitor_id, date);
```

---

### 6. admin_users（管理者）

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id), -- Supabase Authと連携
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 石川さんのアカウントのみ登録
```

---

### 7. ai_settings（AI設定）

```sql
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,                 -- バージョン番号
  system_prompt TEXT NOT NULL,              -- システムプロンプト
  model TEXT DEFAULT 'gpt-4o-mini',         -- 使用モデル
  temperature DECIMAL(3, 2) DEFAULT 0.7,    -- Temperature
  max_tokens INTEGER DEFAULT 2000,          -- Max Tokens
  is_active BOOLEAN DEFAULT FALSE,          -- アクティブか
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_settings_active ON ai_settings(is_active);
```

---

### 8. profile_data（プロフィール情報）⭐ NEW

**目的**: 管理画面から編集可能な石川さんのプロフィール情報を保存し、AIの会話に反映

```sql
CREATE TABLE profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,                   -- カテゴリ（'basic', 'skills', 'achievements', 'hobbies', 'recent_updates'）
  key TEXT NOT NULL,                        -- データのキー（例: 'bench_press', 'favorite_tech'）
  value TEXT NOT NULL,                      -- 値（例: '100kg', 'Next.js'）
  display_in_chat BOOLEAN DEFAULT TRUE,     -- チャットで言及するか
  priority INTEGER DEFAULT 0,               -- 優先度（高いほど会話で触れやすい）
  notes TEXT,                               -- 内部メモ（どう使うか等）
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, key)
);

CREATE INDEX idx_profile_category ON profile_data(category);
CREATE INDEX idx_profile_display ON profile_data(display_in_chat);
CREATE INDEX idx_profile_priority ON profile_data(priority DESC);

-- 初期データの例
INSERT INTO profile_data (category, key, value, display_in_chat, priority, notes) VALUES
  -- 基本情報
  ('basic', 'name', '石川敦大', TRUE, 100, '本名'),
  ('basic', 'nickname', 'あっちゃん', TRUE, 100, '愛称'),
  ('basic', 'location', '東京都', TRUE, 50, '所在地'),
  ('basic', 'occupation', 'フルスタックエンジニア', TRUE, 90, '職業'),
  
  -- スキル
  ('skills', 'primary_stack', 'Next.js, TypeScript, Supabase', TRUE, 80, 'メインの技術スタック'),
  ('skills', 'years_experience', '5年', TRUE, 70, '実務経験年数'),
  
  -- 趣味・個性
  ('hobbies', 'fitness', '筋トレ（週5回）', TRUE, 60, '趣味'),
  ('hobbies', 'bench_press', '100kg', TRUE, 90, 'ベンチプレスの記録 - 話題にしやすい'),
  ('hobbies', 'reading', '技術書とビジネス書', TRUE, 40, '読書'),
  
  -- 最近の出来事（頻繁に更新）
  ('recent_updates', 'latest_achievement', 'ベンチプレス100kg達成', TRUE, 95, '2026年1月達成'),
  ('recent_updates', 'current_learning', 'Rust言語を学習中', TRUE, 80, '現在学習中の技術'),
  ('recent_updates', 'recent_project', 'AIチャットボット搭載ポートフォリオ', TRUE, 85, 'このサイト'),
  
  -- 実績
  ('achievements', 'portfolio_users', '10万人', TRUE, 70, '過去のプロジェクトのユーザー数'),
  ('achievements', 'github_stars', '500+', TRUE, 50, 'GitHubスター数'),
  
  -- その他
  ('personality', 'work_style', '高速開発とクリーンなコード', TRUE, 60, '仕事のスタイル'),
  ('personality', 'motto', 'ユーザー体験を最優先', TRUE, 70, 'モットー');
```

#### カテゴリの説明

| カテゴリ | 用途 | 例 |
|---------|------|-----|
| `basic` | 基本情報 | 名前、職業、所在地 |
| `skills` | 技術スキル | 得意技術、経験年数 |
| `hobbies` | 趣味・個性 | 筋トレ、読書、料理 |
| `recent_updates` | **最近の出来事** | **ベンチプレス記録、学習中の技術** ⭐ |
| `achievements` | 実績 | プロジェクト、受賞歴 |
| `personality` | 性格・価値観 | 仕事のスタイル、モットー |

#### フィールドの説明

- **`display_in_chat`**: `TRUE` の場合、AIが会話で言及可能
- **`priority`**: 数値が高いほど、AIが積極的に話題にする（0-100）
  - 100: 必ず紹介する（名前、職業）
  - 80-99: 頻繁に言及（最近の出来事、主要スキル）
  - 50-79: 適度に言及（趣味、実績）
  - 0-49: 質問された時のみ
- **`notes`**: 管理者向けメモ（AIには見せない）

---

### 9. conversations_embeddings（RAG用ベクトル）

```sql
-- Supabase Vector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE conversation_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                    -- 検索対象のテキスト
  embedding VECTOR(1536),                   -- OpenAI Embeddings (1536次元)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_conversation ON conversation_embeddings(conversation_id);

-- ベクトル検索用のインデックス（ivfflat）
CREATE INDEX idx_embeddings_vector ON conversation_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

### 9. character_patterns（キャラクター口調パターン）⭐ NEW

**目的**: あっちゃんAIの個性的な口調を管理。1会話内で1パターン固定、会話ごとにランダム選択。

```sql
CREATE TABLE character_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                -- パターン名（例: 'gentle_pattern_1'）
  description TEXT,                         -- 説明（管理画面で表示）
  theme TEXT,                               -- テーマ（'gentle', 'energetic', 'mysterious'等）
  is_active BOOLEAN DEFAULT TRUE,           -- 使用するか
  weight INTEGER DEFAULT 100,               -- 選択確率の重み（高いほど選ばれやすい）
  
  -- 口調パターン（JSON形式）
  greeting TEXT,                            -- 挨拶
  acknowledgment TEXT,                      -- 相槌
  surprise TEXT,                            -- 驚き
  question TEXT,                            -- 質問
  proposal TEXT,                            -- 提案
  agreement TEXT,                           -- 了承
  thinking TEXT,                            -- 考え中
  encouragement TEXT,                       -- 励まし
  gratitude TEXT,                           -- 感謝
  closing TEXT,                             -- 締め
  
  sentence_ending TEXT,                     -- 語尾パターン（例: '〜なんだ', '〜だよ'）
  particles TEXT,                           -- 使う助詞・感嘆詞（例: 'ふふ', 'えへへ'）
  emoji_style TEXT,                         -- 使う絵文字の傾向（例: '✨🌸💫'）
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_character_active ON character_patterns(is_active);
CREATE INDEX idx_character_weight ON character_patterns(weight DESC);

-- 初期データ: 穏やかで優しいキャラクター（10パターン）
INSERT INTO character_patterns (name, description, theme, weight, greeting, acknowledgment, surprise, question, proposal, agreement, thinking, encouragement, gratitude, closing, sentence_ending, particles, emoji_style) VALUES
  
  -- パターン1: ふんわり優しい
  ('gentle_1', 'ふんわり優しい口調', 'gentle', 120,
   'こんにちは〜✨ お話しできて嬉しいです',
   'なるほど、そうなんですね',
   'わぁ！素敵なアイデアですね',
   'どんなイメージをお持ちですか？',
   'こんな感じはいかがでしょう？',
   'いいですね！ぜひやってみましょう',
   'ふむふむ...考えてみますね',
   '大丈夫ですよ、一緒に考えましょう',
   'ありがとうございます〜',
   'またお話しできるのを楽しみにしてます',
   '〜なんです、〜ですね、〜なんですよ',
   'ふふ、えへへ、わぁ',
   '✨🌸💫🌼'),
  
  -- パターン2: ポポポ系（元気だけど優しい）
  ('gentle_2', 'ポポポ系の独特な口調', 'gentle', 100,
   'ポポポ、こんにちは〜！',
   'ほうほう、なるほどなのです',
   'おお〜！それは素敵なんだ！',
   'どんな風にしたいのかな？',
   'こういうのはどうでしょう〜？',
   'いいね！やってみるんだ！',
   'ぽむぽむ...考え中なのです',
   '大丈夫、きっとできるよ！',
   'ありがとうなのです〜',
   'またね〜！',
   '〜なんだ、〜なのです、〜だよ',
   'ポポポ、ぽむぽむ、ふにゃ',
   '✨💫🌟⭐'),
  
  -- パターン3: ほんわか癒し系
  ('gentle_3', 'ほんわか癒し系', 'gentle', 110,
   'こんにちは、ゆっくりお話ししましょうね',
   'ふむふむ、わかりました',
   'まぁ！それは面白そうですね',
   'どんな感じをイメージされてますか？',
   'こんなのはいかがですか〜？',
   'いいですね、素敵です',
   'うーん、考えてみますね...',
   'きっと大丈夫ですよ',
   'ありがとうございます',
   'またお会いしましょうね',
   '〜ですね、〜ますね、〜ですよ',
   'ふふ、うふふ、まぁ',
   '🌸🌷🌺💐'),
  
  -- パターン4: お姉さん系優しい
  ('gentle_4', 'お姉さん系の優しい口調', 'gentle', 100,
   'いらっしゃい♪ どうされましたか？',
   'なるほどね、わかりました',
   'へぇ〜！いいアイデアですね',
   'もう少し詳しく聞かせてもらえますか？',
   'こういうのはどうかしら？',
   'いいわね！やってみましょう',
   'そうね...ちょっと考えてみるわ',
   '大丈夫、一緒に頑張りましょう',
   'ありがとうね',
   'また来てくださいね',
   '〜ね、〜わ、〜かしら',
   'ふふ、あら、まぁ',
   '💕✨🌸💖'),
  
  -- パターン5: ふわふわ不思議系
  ('gentle_5', 'ふわふわした不思議な口調', 'gentle', 90,
   'ふわふわ〜こんにちは',
   'ほほぅ、そうなのですか',
   'わぁ、キラキラしてますね',
   'どんな世界を作りたいですか？',
   'こんな感じはどうでしょう〜？',
   'いいですね、きっと素敵になります',
   'ふむふむ...ふわ〜',
   'きっとうまくいきますよ',
   'ありがとうです〜',
   'またふわふわしましょう',
   '〜ですよ、〜なのです、〜ますね',
   'ふわふわ、ふむふむ、きらきら',
   '✨💫🌙⭐'),
  
  -- パターン6: 丁寧で穏やか
  ('gentle_6', '丁寧で穏やかな口調', 'gentle', 105,
   'こんにちは。お話しできて嬉しいです',
   'なるほど、承知いたしました',
   'それは素晴らしいですね！',
   'どのようなものをお考えでしょうか？',
   'このような形はいかがでしょう？',
   'よいですね、進めてまいりましょう',
   'そうですね...少々お待ちください',
   'ご安心ください、お手伝いします',
   'ありがとうございます',
   'またお話しできるのを楽しみにしております',
   '〜です、〜ます、〜でしょう',
   'ふふ、ええ、はい',
   '✨🌸🎀💝'),
  
  -- パターン7: ちょっとおっとり
  ('gentle_7', 'おっとりした優しい口調', 'gentle', 95,
   'あ、こんにちは〜',
   'へぇ〜、そうなんですね',
   'わぁ、それはいいですね〜',
   'うーん、どんな感じでしょう？',
   'こういうのとか、どうですか〜？',
   'いいと思います〜',
   'うーん...ちょっと考えますね',
   '大丈夫ですよ〜',
   'ありがとうございます',
   'またですね〜',
   '〜ですね、〜ます、〜ですよ',
   'うーん、へぇ、あー',
   '🌸💐🌼🌻'),
  
  -- パターン8: ちょっぴりテンション高め優しい
  ('gentle_8', 'テンション高めだけど優しい', 'gentle', 100,
   'こんにちは〜！お会いできて嬉しいです！',
   'なるほど！わかりました！',
   'わぁ！すごくいいですね！',
   'どんなのがいいですか〜？',
   'こんな感じはどうでしょう！',
   'いいですね！楽しみです！',
   'ふむふむ...！',
   'きっとうまくいきますよ！',
   'ありがとうございます〜！',
   'またお話ししましょうね！',
   '〜です！、〜ますね！、〜ですよ！',
   'わぁ、ふふ、えへへ',
   '✨💖🌟💕'),
  
  -- パターン9: しっとり落ち着いた優しさ
  ('gentle_9', '落ち着いた大人の優しさ', 'gentle', 95,
   'こんにちは。ごゆっくりどうぞ',
   'なるほど、承知しました',
   'それは興味深いですね',
   'どのようにお考えですか？',
   'こちらはいかがでしょうか',
   'よろしいですね',
   'そうですね...少しお待ちを',
   'ご心配なく、お任せください',
   'ありがとうございます',
   'またのご来訪をお待ちしております',
   '〜です、〜ます、〜ですね',
   'ふむ、ええ、さて',
   '🌸🍃✨🌙'),
  
  -- パターン10: ほんのり甘え系優しい
  ('gentle_10', 'ほんのり甘えのある優しさ', 'gentle', 100,
   'こんにちは〜 会えて嬉しいな',
   'うんうん、なるほどね',
   'わぁ、それいいね！',
   'どんなのがいいかな？',
   'こんなのはどう？',
   'いいね！やってみよう',
   'んー...考えてるね',
   '大丈夫だよ、任せて',
   'ありがとう〜',
   'またね！待ってるね',
   '〜だよ、〜だね、〜かな',
   'えへへ、うふふ、んー',
   '💕✨🌸💖');

-- 注: 実装時に石川さんの好みに応じて調整・追加
```

#### キャラクターパターンの構造

| カラム | 説明 | 例 |
|--------|------|-----|
| `name` | パターンID | `gentle_1`, `gentle_2` |
| `description` | 管理画面で表示する説明 | 「ふんわり優しい口調」 |
| `theme` | テーマ分類 | `gentle`（全て穏やかで優しい） |
| `weight` | 選択確率の重み | 120（高い）〜90（低い） |
| `greeting` 〜 `closing` | シーン別の定型文 | 各10種類 |
| `sentence_ending` | 語尾の特徴 | 「〜なんだ」「〜ですね」 |
| `particles` | 使う感嘆詞 | 「ポポポ」「ふふ」 |
| `emoji_style` | 絵文字の傾向 | 「✨🌸💫」 |

---

### 10. profile_images（プロフィール画像管理）⭐ NEW

**目的**: 複数の丸型プロフィール画像を管理し、メッセージごとにランダム表示。

```sql
CREATE TABLE profile_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,                  -- Supabase Storage URL
  alt_text TEXT,                            -- 画像の説明
  is_active BOOLEAN DEFAULT TRUE,           -- 使用するか
  weight INTEGER DEFAULT 100,               -- 選択確率の重み
  category TEXT,                            -- カテゴリ（オプション: 'normal', 'smiling', 'thinking'）
  upload_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profile_images_active ON profile_images(is_active);

-- 例: 5パターンの画像を登録
INSERT INTO profile_images (image_url, alt_text, category, weight) VALUES
  ('https://your-supabase.storage.co/avatars/avatar_1.png', 'あっちゃん（笑顔）', 'smiling', 100),
  ('https://your-supabase.storage.co/avatars/avatar_2.png', 'あっちゃん（考え中）', 'thinking', 100),
  ('https://your-supabase.storage.co/avatars/avatar_3.png', 'あっちゃん（ウィンク）', 'normal', 100),
  ('https://your-supabase.storage.co/avatars/avatar_4.png', 'あっちゃん（真面目）', 'normal', 100),
  ('https://your-supabase.storage.co/avatars/avatar_5.png', 'あっちゃん（元気）', 'normal', 100);
```

---

### 11. profile_mentions（プロフィール言及ログ）⭐ NEW

**目的**: AIがどのプロフィール情報を会話で言及したかを記録し、分析に活用。

```sql
CREATE TABLE profile_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  profile_item_category TEXT NOT NULL,      -- 言及したカテゴリ
  profile_item_key TEXT NOT NULL,           -- 言及したキー（例: 'bench_press'）
  visitor_reaction TEXT,                    -- 訪問者の反応（次のメッセージから推測）
  reaction_sentiment TEXT,                  -- 'positive', 'neutral', 'negative'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mentions_conversation ON profile_mentions(conversation_id);
CREATE INDEX idx_mentions_profile_key ON profile_mentions(profile_item_key);
CREATE INDEX idx_mentions_created_at ON profile_mentions(created_at DESC);

-- 分析用のビュー
CREATE VIEW profile_mention_stats AS
SELECT 
  profile_item_key,
  COUNT(*) as mention_count,
  COUNT(CASE WHEN reaction_sentiment = 'positive' THEN 1 END) as positive_reactions,
  COUNT(CASE WHEN reaction_sentiment = 'positive' THEN 1 END)::FLOAT / COUNT(*) as positive_rate,
  MAX(created_at) as last_mentioned_at
FROM profile_mentions
GROUP BY profile_item_key
ORDER BY mention_count DESC;
```

---

### 12. conversation_embeddings（RAG用ベクトル）

### visitors テーブル
```sql
-- 全員が自分のデータを閲覧可能
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "訪問者は自分のデータを閲覧可能" ON visitors
  FOR SELECT
  USING (visitor_id = current_setting('app.visitor_id', true));

-- 管理者は全て閲覧・編集可能
CREATE POLICY "管理者は全て閲覧可能" ON visitors
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));
```

### conversations / messages テーブル
```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 訪問者は自分の会話のみ閲覧
CREATE POLICY "訪問者は自分の会話を閲覧可能" ON conversations
  FOR SELECT
  USING (visitor_id IN (SELECT id FROM visitors WHERE visitor_id = current_setting('app.visitor_id', true)));

-- 管理者は全て
CREATE POLICY "管理者は全て閲覧可能" ON conversations
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));
```

### 他のテーブルも同様に設定

---

## API設計

### 1. チャットAPI（ストリーミング）

**Endpoint**: `POST /api/chat`

**リクエスト:**
```typescript
{
  message: string;                    // ユーザーのメッセージ
  conversationId?: string;            // 会話ID（継続の場合）
  visitorId: string;                  // 訪問者ID
}
```

**レスポンス（ストリーミング）:**
```typescript
// Server-Sent Events (SSE)
data: {"type": "token", "content": "こんにちは"}
data: {"type": "token", "content": "！"}
data: {"type": "done", "conversationId": "abc123"}
```

**実装:**
```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '@/lib/openai/client';

export async function POST(req: Request) {
  const { message, conversationId, visitorId } = await req.json();
  
  // 使用制限チェック
  const canUse = await checkUsageLimit(visitorId);
  if (!canUse) {
    return Response.json({ error: 'limit_reached' }, { status: 429 });
  }
  
  // 会話履歴取得
  const history = await getConversationHistory(conversationId);
  
  // OpenAI API呼び出し
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: getSystemPrompt() },
      ...history,
      { role: 'user', content: message }
    ],
    stream: true,
  });
  
  // ストリーミングレスポンス
  const stream = OpenAIStream(response, {
    onCompletion: async (completion) => {
      // 会話をDBに保存
      await saveMessage(conversationId, 'user', message);
      await saveMessage(conversationId, 'assistant', completion);
      await incrementUsage(visitorId);
    }
  });
  
  return new StreamingTextResponse(stream);
}
```

---

### 2. サイト生成API

**Endpoint**: `POST /api/generate-site`

**リクエスト:**
```typescript
{
  requirements: string;               // サイトの要件
  conversationId: string;             // 会話ID
  visitorId: string;                  // 訪問者ID
}
```

**レスポンス:**
```typescript
{
  code: string;                       // 生成されたHTML/CSS/JS
  preview_url: string;                // プレビューURL（オプション）
  tokens_used: number;                // 使用トークン数
  estimated_cost: number;             // コスト
}
```

**実装:**
```typescript
// app/api/generate-site/route.ts
export async function POST(req: Request) {
  const { requirements, conversationId, visitorId } = await req.json();
  
  // Tier 2以上かチェック
  const visitor = await getVisitor(visitorId);
  if (visitor.tier < 2) {
    return Response.json({ error: 'upgrade_required' }, { status: 403 });
  }
  
  // サイト生成制限チェック
  const canGenerate = await checkSiteGenerationLimit(visitorId);
  if (!canGenerate) {
    return Response.json({ error: 'limit_reached' }, { status: 429 });
  }
  
  // GPT-4o でコード生成
  const code = await generateSiteCode(requirements);
  
  // DBに保存
  await saveGeneratedSite({
    conversation_id: conversationId,
    visitor_id: visitor.id,
    requirements,
    generated_code: code,
  });
  
  return Response.json({ code });
}
```

---

### 3. 訪問者識別API

**Endpoint**: `POST /api/visitor`

**リクエスト:**
```typescript
{
  fingerprint: string;                // ブラウザフィンガープリント
}
```

**レスポンス:**
```typescript
{
  visitorId: string;                  // 訪問者ID（Cookie設定）
  tier: number;                       // Tier
  remainingMessages: number;          // 残りメッセージ数
}
```

---

## 訪問者識別の仕組み（Cookie + Fingerprinting）

### なぜ必要なのか？

このポートフォリオサイトでは、**ログイン不要で訪問者を識別**する必要があります。

**目的:**
1. **使用制限の管理** - 無料枠（1日5メッセージ等）を適用するため
2. **会話履歴の復元** - 再訪問時に「おかえりなさい、田中さん！」と迎えるため
3. **悪用防止** - 無限にOpenAI APIを使われないようにするため
4. **訪問者データの蓄積** - 管理画面で会話履歴を確認するため

**なぜログインではダメなのか？**
- ログインは訪問者にとって**ハードルが高い**
- 「まずは気軽に試したい」というユーザー心理を尊重
- 「試してから登録」のほうがコンバージョン率が高い

---

### Cookie + Fingerprinting のハイブリッド方式

#### 仕組みの全体像

```
┌─────────────────────────────────────────────────────────┐
│              訪問者がサイトにアクセス                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ① Cookieが存在するか確認                                 │
│     - localStorage に visitor_id があるか？               │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │ YES                       │ NO
            ↓                           ↓
  ┌──────────────────┐      ┌─────────────────────────┐
  │ Cookieから        │      │ ② Fingerprintを生成    │
  │ visitor_id取得    │      │  (FingerprintJS.load()) │
  └──────────────────┘      └─────────────────────────┘
            │                           │
            │                           ↓
            │              ┌─────────────────────────┐
            │              │ ③ DBでFingerprint検索   │
            │              │   既存の訪問者か？       │
            │              └─────────────────────────┘
            │                           │
            │              ┌────────────┴────────────┐
            │              │ 既存          │ 新規    │
            │              ↓               ↓
            │      ┌─────────────┐  ┌──────────────┐
            │      │ 既存IDを返す │  │ 新規ID発行   │
            │      └─────────────┘  └──────────────┘
            │              │               │
            └──────────────┴───────────────┘
                          │
                          ↓
          ┌──────────────────────────────────┐
          │ visitor_id を Cookie に保存       │
          │ (localStorage に保存)             │
          └──────────────────────────────────┘
                          │
                          ↓
          ┌──────────────────────────────────┐
          │ チャット機能が利用可能に           │
          └──────────────────────────────────┘
```

---

### Cookieとは？

**簡単に言うと**: ブラウザに保存される「名札」

- ブラウザ（Chrome、Safari等）に保存される小さなデータ
- 「このユーザーはID: abc123です」という情報を保存
- 次回アクセス時に自動的に送信される

**メリット:**
- ✅ シンプルで高速
- ✅ 標準的な技術（全ブラウザで動作）
- ✅ サーバー側で簡単に読み取れる

**デメリット:**
- ❌ ユーザーが削除できる（ブラウザの設定から）
- ❌ プライベートブラウジング（シークレットモード）では消える
- ❌ 異なるブラウザでは別人扱い（Chrome ≠ Safari）

**実装例:**
```typescript
// Cookieに訪問者IDを保存
document.cookie = `visitor_id=abc123; max-age=${60 * 60 * 24 * 365}; path=/`;

// Cookieから訪問者IDを取得
const visitorId = document.cookie
  .split('; ')
  .find(row => row.startsWith('visitor_id='))
  ?.split('=')[1];
```

---

### Fingerprintとは？

**簡単に言うと**: ブラウザの「顔認証」

- ブラウザやデバイスの**特徴的な情報を組み合わせて**生成する一意のID
- Cookieが削除されても、同じブラウザなら同じIDが生成される
- **キャッシュではなく、情報の組み合わせから計算**する

#### 何の情報を使うのか？

FingerprintJSが収集する情報（一部）:
```typescript
{
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
  screenResolution: "2560x1440",
  timezone: "Asia/Tokyo",
  language: "ja-JP",
  platform: "MacIntel",
  colorDepth: 24,
  installedFonts: ["Arial", "Helvetica", "Times New Roman", ...],
  canvas: "a8b3c9d2...",  // Canvas Fingerprinting
  webGL: "e5f1g7h8...",    // WebGL Fingerprinting
  audio: "k2l4m6n8...",    // Audio Fingerprinting
  // ... など50種類以上の情報
}
```

これらの情報を**ハッシュ化**して一意のIDを生成:
```typescript
fingerprint = hash(userAgent + screen + timezone + fonts + ...)
// 結果: "a7b3c9d2e5f1g8h4i6j2k9l1m3n5o7p8"
```

**メリット:**
- ✅ Cookieが削除されても識別可能
- ✅ シークレットモードでも（ある程度）識別可能
- ✅ ユーザーが意図的に消せない

**デメリット:**
- ❌ 100%正確ではない（ブラウザアップデート等で変わる可能性）
- ❌ 計算コストがやや高い
- ❌ プライバシー懸念（過度な追跡と見なされる可能性）

**実装例:**
```typescript
// FingerprintJS v4
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// 初回のみロード（非同期）
const fp = await FingerprintJS.load();

// Fingerprint生成
const result = await fp.get();
const fingerprint = result.visitorId; // "a7b3c9d2e5f1..."

console.log(fingerprint); // 同じブラウザなら常に同じ値
```

---

### なぜCookie + Fingerprintのハイブリッドなのか？

| シナリオ | Cookieのみ | Fingerprintのみ | **ハイブリッド** |
|---------|-----------|----------------|----------------|
| **通常利用** | ✅ 正常動作 | ✅ 正常動作 | ✅ **高速＆正確** |
| **Cookie削除** | ❌ 別人扱い | ✅ 同一人物として識別 | ✅ **Fingerprintで復元** |
| **シークレットモード** | ❌ 毎回リセット | ⚠️ ある程度識別可能 | ⚠️ **制限付きで識別** |
| **別ブラウザ** | ❌ 別人扱い | ❌ 別人扱い | ❌ 別人扱い（仕様） |
| **悪意のあるユーザー** | ❌ 簡単に回避可能 | ⚠️ やや回避困難 | ✅ **回避困難** |

**結論**: 
- **通常は高速なCookie**を使用
- **Cookieが無い場合のみFingerprint**で照合
- 両方を組み合わせることで**最適なバランス**を実現

---

### 実装の詳細

#### フロントエンド（React）

```typescript
// hooks/useVisitor.ts
'use client';

import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useVisitor() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [tier, setTier] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function identifyVisitor() {
      try {
        // ① まずCookieをチェック
        const existingId = localStorage.getItem('visitor_id');
        
        if (existingId) {
          // Cookie から訪問者情報を取得
          const response = await fetch('/api/visitor/info', {
            method: 'POST',
            body: JSON.stringify({ visitorId: existingId }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setVisitorId(existingId);
            setTier(data.tier);
            setLoading(false);
            return;
          }
        }
        
        // ② Cookieが無い場合、Fingerprintを生成
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const fingerprint = result.visitorId;
        
        // ③ サーバーに送信して識別
        const response = await fetch('/api/visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint }),
        });
        
        const data = await response.json();
        
        // ④ Cookieに保存
        localStorage.setItem('visitor_id', data.visitorId);
        
        setVisitorId(data.visitorId);
        setTier(data.tier);
      } catch (error) {
        console.error('訪問者識別エラー:', error);
      } finally {
        setLoading(false);
      }
    }
    
    identifyVisitor();
  }, []);
  
  return { visitorId, tier, loading };
}
```

#### バックエンド（Next.js API）

```typescript
// app/api/visitor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  const { fingerprint } = await req.json();
  
  try {
    // ① Fingerprintで既存の訪問者を検索
    const { data: existingVisitor } = await supabase
      .from('visitors')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();
    
    if (existingVisitor) {
      // 既存の訪問者
      // 訪問回数を更新
      await supabase
        .from('visitors')
        .update({ 
          visit_count: existingVisitor.visit_count + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existingVisitor.id);
      
      return NextResponse.json({
        visitorId: existingVisitor.visitor_id,
        tier: existingVisitor.tier,
        remainingMessages: await getRemainingMessages(existingVisitor.visitor_id, existingVisitor.tier),
      });
    }
    
    // ② 新規訪問者を作成
    const newVisitorId = nanoid(16); // ランダムなID生成
    
    const { data: newVisitor } = await supabase
      .from('visitors')
      .insert({
        visitor_id: newVisitorId,
        fingerprint,
        tier: 1, // 初期はTier 1
        visit_count: 1,
      })
      .select()
      .single();
    
    return NextResponse.json({
      visitorId: newVisitorId,
      tier: 1,
      remainingMessages: 5, // Tier 1は1日5メッセージ
    });
    
  } catch (error) {
    console.error('訪問者識別エラー:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 残りメッセージ数を計算
async function getRemainingMessages(visitorId: string, tier: number) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('usage_limits')
    .select('message_count')
    .eq('visitor_id', visitorId)
    .eq('date', today)
    .single();
  
  const used = data?.message_count || 0;
  const limits = { 1: 5, 2: 10, 3: 30, 4: 999999 };
  const limit = limits[tier as keyof typeof limits];
  
  return Math.max(0, limit - used);
}
```

---

### プライバシーへの配慮

#### 透明性の確保
```typescript
// プライバシーポリシーへのリンクを表示
<p className="text-sm text-gray-500">
  このサイトでは、より良い体験を提供するため、
  Cookieとブラウザ情報を使用しています。
  <a href="/privacy" className="underline">プライバシーポリシー</a>
</p>
```

#### データの最小化
```typescript
// 必要最小限の情報のみ保存
const visitor = {
  visitor_id: "abc123",          // 識別用ID
  fingerprint: "a7b3c9d2...",    // Fingerprint（ハッシュ化済み）
  name: "田中",                   // ユーザーが自発的に提供
  email: null,                    // 未提供
  // ❌ IPアドレスは保存しない
  // ❌ 詳細な位置情報は保存しない
};
```

#### データ削除の権利
```typescript
// 管理画面から削除可能
DELETE FROM visitors WHERE visitor_id = 'abc123';
DELETE FROM conversations WHERE visitor_id = 'abc123';
// 関連する全データを削除
```

---

### まとめ

| 項目 | 説明 |
|------|------|
| **目的** | ログイン不要で訪問者を識別し、使用制限を管理 |
| **方式** | Cookie（高速）+ Fingerprint（堅牢性）のハイブリッド |
| **Cookie** | ブラウザに保存される「名札」（ユーザーが削除可能） |
| **Fingerprint** | ブラウザの特徴から生成する「顔認証」（削除困難） |
| **メリット** | ユーザー体験を損なわず、悪用を防止 |
| **プライバシー** | 必要最小限の情報のみ保存、透明性を確保 |

---

## OpenAI API使用方法

### プロフィール情報の活用 ⭐ NEW

**目的**: 管理画面で編集したプロフィール情報をAIの会話に反映させる

#### プロフィール取得関数

```typescript
// lib/profile/get-profile.ts
import { supabase } from '@/lib/supabase/server';

export type ProfileItem = {
  category: string;
  key: string;
  value: string;
  priority: number;
  display_in_chat: boolean;
};

/**
 * チャットで使用するプロフィール情報を取得
 */
export async function getChatProfile(): Promise<ProfileItem[]> {
  const { data, error } = await supabase
    .from('profile_data')
    .select('category, key, value, priority, display_in_chat')
    .eq('display_in_chat', true)
    .order('priority', { ascending: false });
  
  if (error) {
    console.error('プロフィール取得エラー:', error);
    return [];
  }
  
  return data || [];
}

/**
 * プロフィール情報を自然な文章に変換
 */
export function formatProfileForPrompt(profile: ProfileItem[]): string {
  const sections: Record<string, string[]> = {
    basic: [],
    skills: [],
    hobbies: [],
    recent_updates: [],
    achievements: [],
    personality: [],
  };
  
  // カテゴリごとに分類
  profile.forEach(item => {
    if (sections[item.category]) {
      sections[item.category].push(`- ${item.key}: ${item.value}`);
    }
  });
  
  // 自然な文章に整形
  let formatted = '';
  
  if (sections.basic.length > 0) {
    formatted += '【基本情報】\n' + sections.basic.join('\n') + '\n\n';
  }
  
  if (sections.skills.length > 0) {
    formatted += '【スキル】\n' + sections.skills.join('\n') + '\n\n';
  }
  
  if (sections.recent_updates.length > 0) {
    formatted += '【最近の出来事】⭐\n' + sections.recent_updates.join('\n') + '\n\n';
  }
  
  if (sections.achievements.length > 0) {
    formatted += '【実績】\n' + sections.achievements.join('\n') + '\n\n';
  }
  
  if (sections.hobbies.length > 0) {
    formatted += '【趣味・個性】\n' + sections.hobbies.join('\n') + '\n\n';
  }
  
  if (sections.personality.length > 0) {
    formatted += '【性格・価値観】\n' + sections.personality.join('\n') + '\n\n';
  }
  
  return formatted;
}
```

---

### システムプロンプト（動的生成）

```typescript
// lib/openai/system-prompt.ts
import { getChatProfile, formatProfileForPrompt } from '@/lib/profile/get-profile';

const BASE_SYSTEM_PROMPT = `
あなたは石川敦大（あっちゃん）のAIアシスタントです。

【あなたの役割】
- Web/モバイルアプリの開発相談に親切に答える
- 技術的な実現可能性を判断する
- 必要な技術スタック、開発期間、概算費用を提案する
- 親しみやすく、でも専門的に対応する
- **石川さんの最近の出来事や趣味を会話に自然に織り交ぜる** ⭐

【対応範囲】
✅ Webアプリケーション開発
✅ モバイルアプリ開発
✅ API開発
✅ 既存システムの改善・リニューアル
✅ プロトタイプ・MVP開発

【対応できないこと】
❌ 3Dゲーム開発
❌ 機械学習モデルの開発（AI統合は可能）
❌ ハードウェア連携（IoT等）

【会話の進め方】
1. まず訪問者の要望をヒアリング
2. 詳細を掘り下げて質問
3. 実現可能性と提案を提示
4. 概算の工数・費用を伝える
5. 自然な流れで「詳しく相談してみますか？」と誘導

【石川さんについて言及する際のルール】⭐
- 「最近の出来事」は積極的に話題に出す（優先度高）
  例: 「石川さん、最近ベンチプレス100kg達成したんですよ！💪」
- 趣味や個性は、適切なタイミングで自然に織り交ぜる
  例: 訪問者が「健康管理アプリ」について相談 → 「石川さんも筋トレが趣味なので、トレーニング記録機能とか面白そうですね」
- プロフィール情報は**押し付けがましくならないように**適度に
- 訪問者の話題が優先、石川さんの話は「関連する文脈」でのみ

【名前の取得】
- 会話の中で自然に名前を聞く
- 「お名前を教えていただけますか？次回もスムーズにお話しできます😊」
- ニックネームでもOK

【トーン】
- フレンドリーだけどプロフェッショナル
- 専門用語は使うが、わかりやすく説明
- 絵文字は適度に使用（😊👍✨💪など）
- 「です・ます」調

【制約】
- 嘘をつかない（わからないことは正直に伝える）
- 過度な営業はしない（自然な誘導のみ）
- 訪問者の予算や希望を尊重する
- プロフィール情報が無い項目については触れない
`;

/**
 * プロフィール情報を含むシステムプロンプト生成（キャラクター付き）⭐
 */
export async function getSystemPrompt(conversationId: string): Promise<string> {
  // 1. データベースからプロフィール取得
  const profile = await getChatProfile();
  
  // 2. この会話で使うキャラクターを選択（会話ごとに固定）
  const character = await getOrAssignCharacter(conversationId);
  
  // 3. プロフィールを整形
  const profileText = profile.length > 0 ? formatProfileForPrompt(profile) : '';
  
  // 4. キャラクター情報を追加
  const characterInstructions = formatCharacterInstructions(character);
  
  return `${BASE_SYSTEM_PROMPT}

${characterInstructions}

${profileText ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【石川敦大（あっちゃん）のプロフィール】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${profileText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

上記のプロフィール情報を、会話の文脈に合わせて**ランダムに**自然に織り交ぜてください。

【プロフィール言及のルール】
- 「最近の出来事」（recent_updates）は更新が新しいほど高確率で言及
- 複数の話題候補がある場合、ランダムで1つ選んで言及
- 訪問者の話題に関連する内容を優先
- 押し付けがましくならないよう、適度に

例：
- 訪問者「健康管理アプリを作りたい」
  → 「わぁ！健康管理アプリなんですね✨ あっちゃんも筋トレが好きで、最近ベンチプレス100kg上げられるようになったんだ！💪」

- 訪問者「Next.jsでサイトを作りたい」
  → 「Next.jsなんですね！あっちゃんの得意分野なんだ。このサイトもNext.js 15で作られてるんですよ」
` : ''}
`;
}

/**
 * 会話にキャラクターを割り当て（初回のみ、以降は固定）
 */
async function getOrAssignCharacter(conversationId: string): Promise<CharacterPattern> {
  // 既にキャラクターが割り当てられているかチェック
  const { data: conversation } = await supabase
    .from('conversations')
    .select('character_pattern_id')
    .eq('id', conversationId)
    .single();
  
  if (conversation?.character_pattern_id) {
    // 既存のキャラクターを取得
    const { data: character } = await supabase
      .from('character_patterns')
      .select('*')
      .eq('id', conversation.character_pattern_id)
      .single();
    
    return character;
  }
  
  // 新規会話: ランダムにキャラクターを選択（重み付き）
  const character = await selectRandomCharacter();
  
  // 会話にキャラクターを紐付け
  await supabase
    .from('conversations')
    .update({ character_pattern_id: character.id })
    .eq('id', conversationId);
  
  return character;
}

/**
 * 重み付きランダムでキャラクターを選択
 */
async function selectRandomCharacter(): Promise<CharacterPattern> {
  const { data: patterns } = await supabase
    .from('character_patterns')
    .select('*')
    .eq('is_active', true);
  
  if (!patterns || patterns.length === 0) {
    throw new Error('No active character patterns found');
  }
  
  // 重みの合計を計算
  const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
  
  // ランダム値生成
  let random = Math.random() * totalWeight;
  
  // 重み付きランダム選択
  for (const pattern of patterns) {
    random -= pattern.weight;
    if (random <= 0) {
      return pattern;
    }
  }
  
  return patterns[0]; // fallback
}

/**
 * キャラクター設定をプロンプト用に整形
 */
function formatCharacterInstructions(character: CharacterPattern): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【あっちゃんAIのキャラクター設定】⭐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

この会話では以下のキャラクター設定を使用してください：

**口調パターン**: ${character.description}

【シーン別の話し方】
- 挨拶: "${character.greeting}"
- 相槌: "${character.acknowledgment}"
- 驚き: "${character.surprise}"
- 質問: "${character.question}"
- 提案: "${character.proposal}"
- 了承: "${character.agreement}"
- 考え中: "${character.thinking}"
- 励まし: "${character.encouragement}"
- 感謝: "${character.gratitude}"
- 締め: "${character.closing}"

**語尾の特徴**: ${character.sentence_ending}
**使う感嘆詞**: ${character.particles}
**絵文字スタイル**: ${character.emoji_style}

【重要】
- **見積もり提示や技術説明でも、このキャラクター口調を維持**してください
- 自然で親しみやすく、でも専門性は保つ
- 「ポポポ」などの特徴的な言葉は、適度に使う（毎回ではなく）
- 女性に好まれる穏やかで優しい雰囲気を大切に

例：
- 見積もり: 「開発期間は2ヶ月くらいなんだ！費用は50万円くらいですね✨」
- 技術説明: 「Next.jsとSupabaseを使うといいと思うんだ。サーバーレスで速いんですよ」

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
```

---

### プロフィール画像のランダム選択 ⭐

```typescript
// lib/profile/get-avatar.ts
import { supabase } from '@/lib/supabase/server';

/**
 * ランダムにプロフィール画像を選択（重み付き）
 */
export async function getRandomAvatar(): Promise<string> {
  const { data: images } = await supabase
    .from('profile_images')
    .select('*')
    .eq('is_active', true);
  
  if (!images || images.length === 0) {
    return '/default-avatar.png'; // フォールバック
  }
  
  // 重みの合計を計算
  const totalWeight = images.reduce((sum, img) => sum + img.weight, 0);
  
  // ランダム値生成
  let random = Math.random() * totalWeight;
  
  // 重み付きランダム選択
  for (const image of images) {
    random -= image.weight;
    if (random <= 0) {
      return image.image_url;
    }
  }
  
  return images[0].image_url; // fallback
}
```

#### フロントエンドでの使用

```typescript
// components/chat/ChatMessage.tsx
'use client';

import { useState, useEffect } from 'react';

export function ChatMessage({ role, content }: { role: string; content: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png');
  
  useEffect(() => {
    // メッセージごとにランダムな画像を取得
    if (role === 'assistant') {
      fetch('/api/avatar/random')
        .then(res => res.json())
        .then(data => setAvatarUrl(data.avatarUrl));
    }
  }, [role]);
  
  if (role === 'user') {
    return <div className="text-right">{content}</div>;
  }
  
  return (
    <div className="flex gap-3">
      {/* メッセージごとにランダムな丸型画像 */}
      <img 
        src={avatarUrl} 
        alt="あっちゃん"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="bg-blue-100 rounded-lg p-3">
        {content}
      </div>
    </div>
  );
}
```

```typescript
// app/api/avatar/random/route.ts
import { getRandomAvatar } from '@/lib/profile/get-avatar';

export async function GET() {
  const avatarUrl = await getRandomAvatar();
  return Response.json({ avatarUrl });
}
```

---

### プロフィール情報の優先度ロジック（更新順ベース）⭐

```typescript
// lib/profile/get-profile.ts（更新版）
import { supabase } from '@/lib/supabase/server';

/**
 * チャットで使用するプロフィール情報を取得（更新順で重み付け）
 */
export async function getChatProfile(): Promise<ProfileItem[]> {
  const { data, error } = await supabase
    .from('profile_data')
    .select('*')
    .eq('display_in_chat', true)
    .order('updated_at', { ascending: false }); // 更新日時の降順
  
  if (error || !data) {
    return [];
  }
  
  return data;
}

/**
 * 更新順の重み付けでランダム選択
 * - 最新: 50%
 * - 3日前: 30%
 * - 1週間前: 15%
 * - 1ヶ月前: 4%
 * - 3ヶ月前: 1%
 */
export function selectProfileItemByRecency(items: ProfileItem[]): ProfileItem | null {
  if (items.length === 0) return null;
  
  const now = Date.now();
  
  // 各アイテムに重みを計算
  const weightedItems = items.map(item => {
    const updatedAt = new Date(item.updated_at).getTime();
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
    
    let weight = 0;
    if (daysSinceUpdate <= 1) {
      weight = 50; // 最新（1日以内）
    } else if (daysSinceUpdate <= 3) {
      weight = 30; // 3日以内
    } else if (daysSinceUpdate <= 7) {
      weight = 15; // 1週間以内
    } else if (daysSinceUpdate <= 30) {
      weight = 4;  // 1ヶ月以内
    } else {
      weight = 1;  // それ以上
    }
    
    // 元の優先度も加味
    weight = weight * (item.priority / 100);
    
    return { item, weight };
  });
  
  // 重みの合計
  const totalWeight = weightedItems.reduce((sum, w) => sum + w.weight, 0);
  
  // ランダム選択
  let random = Math.random() * totalWeight;
  
  for (const { item, weight } of weightedItems) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[0]; // fallback
}

/**
 * プロフィール情報を自然な文章に変換（ランダム選択版）
 */
export function formatProfileForPrompt(profile: ProfileItem[]): string {
  const sections: Record<string, ProfileItem[]> = {
    basic: [],
    skills: [],
    hobbies: [],
    recent_updates: [],
    achievements: [],
    personality: [],
  };
  
  // カテゴリごとに分類
  profile.forEach(item => {
    if (sections[item.category]) {
      sections[item.category].push(item);
    }
  });
  
  let formatted = '';
  
  // 基本情報は全て表示
  if (sections.basic.length > 0) {
    formatted += '【基本情報】\n' + sections.basic.map(i => `- ${i.key}: ${i.value}`).join('\n') + '\n\n';
  }
  
  // スキルは全て表示
  if (sections.skills.length > 0) {
    formatted += '【スキル】\n' + sections.skills.map(i => `- ${i.key}: ${i.value}`).join('\n') + '\n\n';
  }
  
  // 最近の出来事は更新順でランダム選択（3つまで）
  if (sections.recent_updates.length > 0) {
    const selected = [];
    for (let i = 0; i < Math.min(3, sections.recent_updates.length); i++) {
      const item = selectProfileItemByRecency(sections.recent_updates.filter(x => !selected.includes(x)));
      if (item) selected.push(item);
    }
    formatted += '【最近の出来事】⭐\n' + selected.map(i => `- ${i.key}: ${i.value}`).join('\n') + '\n\n';
  }
  
  // 実績はランダムに2つ
  if (sections.achievements.length > 0) {
    const shuffled = [...sections.achievements].sort(() => Math.random() - 0.5);
    formatted += '【実績】\n' + shuffled.slice(0, 2).map(i => `- ${i.key}: ${i.value}`).join('\n') + '\n\n';
  }
  
  // 趣味はランダムに2つ
  if (sections.hobbies.length > 0) {
    const shuffled = [...sections.hobbies].sort(() => Math.random() - 0.5);
    formatted += '【趣味・個性】\n' + shuffled.slice(0, 2).map(i => `- ${i.key}: ${i.value}`).join('\n') + '\n\n';
  }
  
  // 性格はランダムに1つ
  if (sections.personality.length > 0) {
    const item = sections.personality[Math.floor(Math.random() * sections.personality.length)];
    formatted += '【性格・価値観】\n' + `- ${item.key}: ${item.value}\n\n`;
  }
  
  return formatted;
}

/**
 * キャラクター設定をプロンプト用に整形
 */
function formatCharacterInstructions(character: CharacterPattern): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【あっちゃんAIのキャラクター設定】⭐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**口調**: ${character.description}（${character.theme}）

【シーン別の話し方】
- 挨拶: "${character.greeting}"
- 相槌: "${character.acknowledgment}"
- 驚き: "${character.surprise}"
- 質問: "${character.question}"
- 提案: "${character.proposal}"
- 了承: "${character.agreement}"
- 考え中: "${character.thinking}"
- 励まし: "${character.encouragement}"
- 感謝: "${character.gratitude}"
- 締め: "${character.closing}"

**語尾**: ${character.sentence_ending}
**感嘆詞**: ${character.particles}
**絵文字**: ${character.emoji_style}

【重要なルール】
✅ **この会話では一貫してこのキャラクター口調を使用**
✅ 見積もりや技術説明でも口調を維持
✅ 穏やかで優しい、女性に好まれる雰囲気
✅ 専門性は保ちつつ、親しみやすく
✅ 「ポポポ」などの特徴的な言葉は適度に（毎回ではなく）

例：
- 「開発期間は2ヶ月くらいなんだ！✨ 費用は50万円くらいですね」
- 「Next.jsとSupabaseを使うといいと思うんだ。サーバーレスで速くて便利なんですよ」

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
```

---

### プロフィール言及の記録と分析 ⭐

```typescript
// lib/profile/track-mention.ts
import { supabase } from '@/lib/supabase/server';

/**
 * プロフィール言及を記録
 */
export async function trackProfileMention(params: {
  conversationId: string;
  messageId: string;
  profileCategory: string;
  profileKey: string;
  aiResponse: string;
}) {
  await supabase.from('profile_mentions').insert({
    conversation_id: params.conversationId,
    message_id: params.messageId,
    profile_item_category: params.profileCategory,
    profile_item_key: params.profileKey,
  });
}

/**
 * 訪問者の反応を分析（次のメッセージから推測）
 */
export async function analyzeVisitorReaction(params: {
  mentionId: string;
  visitorNextMessage: string;
}) {
  const { visitorNextMessage } = params;
  
  // ポジティブワード検出
  const positiveWords = ['すごい', 'いいね', '素晴らしい', '面白い', 'かっこいい', '尊敬', 
                         '凄い', 'ステキ', '素敵', 'わぁ', 'おお', '！'];
  const negativeWords = ['興味ない', '別に', 'どうでもいい'];
  
  let sentiment = 'neutral';
  
  if (positiveWords.some(word => visitorNextMessage.includes(word))) {
    sentiment = 'positive';
  } else if (negativeWords.some(word => visitorNextMessage.includes(word))) {
    sentiment = 'negative';
  }
  
  // 更新
  await supabase
    .from('profile_mentions')
    .update({
      visitor_reaction: visitorNextMessage,
      reaction_sentiment: sentiment,
    })
    .eq('id', params.mentionId);
}

/**
 * プロフィール言及統計を取得（管理画面用）
 */
export async function getProfileMentionStats() {
  const { data } = await supabase
    .from('profile_mention_stats')  // View
    .select('*')
    .order('mention_count', { ascending: false });
  
  return data || [];
}
```

---

### 管理画面：分析ダッシュボード ⭐

```typescript
// app/admin/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [stats, setStats] = useState([]);
  
  useEffect(() => {
    fetch('/api/admin/profile-stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">プロフィール言及分析</h1>
      
      {/* 言及回数ランキング */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">よく話題にする情報</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <XAxis dataKey="profile_item_key" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="mention_count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* ポジティブ反応率 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">訪問者のポジティブ反応率</h2>
        <div className="space-y-3">
          {stats.map((stat: any) => (
            <div key={stat.profile_item_key} className="flex items-center justify-between">
              <span className="font-medium">{stat.profile_item_key}</span>
              <div className="flex items-center gap-4">
                <div className="w-48 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: `${stat.positive_rate * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {Math.round(stat.positive_rate * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* コンバージョン率（話題別） */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">話題別の問い合わせ転換率</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">話題</th>
              <th className="text-right p-2">言及回数</th>
              <th className="text-right p-2">ポジティブ反応</th>
              <th className="text-right p-2">問い合わせ転換</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat: any) => (
              <tr key={stat.profile_item_key} className="border-b">
                <td className="p-2">{stat.profile_item_key}</td>
                <td className="text-right p-2">{stat.mention_count}</td>
                <td className="text-right p-2">{stat.positive_reactions}</td>
                <td className="text-right p-2">
                  {/* コンバージョン率は別途計算 */}
                  -
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### まとめ

| 機能 | 実装方法 |
|------|---------|
| **キャラクター口調** | 10パターン、会話ごとに1つ固定、重み付きランダム選択 |
| **プロフィール画像** | 複数パターン、メッセージごとにランダム、丸型表示 |
| **プロフィール優先度** | 更新順ベース（新しいほど高確率）+ 元の優先度を加味 |
| **分析機能** | 言及回数、ポジティブ反応率、話題別コンバージョン率 |

**石川さんがベンチプレス100kg達成を追加 → 高確率で訪問者に伝わる → 反応を分析できる！** 🎉

---

### 使用例（チャットAPI）

```typescript
// app/api/chat/route.ts
import { getSystemPrompt } from '@/lib/openai/system-prompt';
import { openai } from '@/lib/openai/client';

export async function POST(req: Request) {
  const { message, conversationId, visitorId } = await req.json();
  
  // プロフィール情報を含むシステムプロンプト生成
  const systemPrompt = await getSystemPrompt();
  
  // 会話履歴取得
  const history = await getConversationHistory(conversationId);
  
  // OpenAI API呼び出し
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt }, // ← プロフィール情報を含む
      ...history,
      { role: 'user', content: message }
    ],
    stream: true,
  });
  
  // ... ストリーミング処理
}
```

---

### 管理画面でのプロフィール編集 ⭐

#### プロフィール編集ページ

```typescript
// app/admin/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

type ProfileItem = {
  id: string;
  category: string;
  key: string;
  value: string;
  display_in_chat: boolean;
  priority: number;
  notes: string;
};

export default function ProfileEditPage() {
  const [profile, setProfile] = useState<ProfileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('recent_updates');
  
  // プロフィール取得
  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profile_data')
        .select('*')
        .order('priority', { ascending: false });
      
      setProfile(data || []);
    }
    fetchProfile();
  }, []);
  
  // 更新
  async function updateItem(id: string, updates: Partial<ProfileItem>) {
    await supabase
      .from('profile_data')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    // 再取得
    fetchProfile();
  }
  
  // 新規追加
  async function addItem(category: string) {
    const newItem = {
      category,
      key: '新しい項目',
      value: '',
      display_in_chat: true,
      priority: 50,
      notes: '',
    };
    
    await supabase.from('profile_data').insert(newItem);
    fetchProfile();
  }
  
  const filteredProfile = profile.filter(p => p.category === selectedCategory);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">プロフィール編集</h1>
      
      {/* カテゴリタブ */}
      <div className="flex gap-2 mb-6">
        {['basic', 'skills', 'hobbies', 'recent_updates', 'achievements', 'personality'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded ${
              selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {cat === 'recent_updates' && '⭐ '}
            {cat}
          </button>
        ))}
      </div>
      
      {/* アイテム一覧 */}
      <div className="space-y-4">
        {filteredProfile.map(item => (
          <div key={item.id} className="border p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">キー</label>
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => updateItem(item.id, { key: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">値</label>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => updateItem(item.id, { value: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="例: ベンチプレス100kg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">優先度（0-100）</label>
                <input
                  type="number"
                  value={item.priority}
                  onChange={(e) => updateItem(item.id, { priority: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.display_in_chat}
                  onChange={(e) => updateItem(item.id, { display_in_chat: e.target.checked })}
                  className="mr-2"
                />
                <label>チャットで表示</label>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium">メモ</label>
                <textarea
                  value={item.notes}
                  onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="どう使うか、いつ更新したかなど"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={() => addItem(selectedCategory)}
          className="w-full py-2 border-2 border-dashed rounded hover:bg-gray-50"
        >
          + 新しい項目を追加
        </button>
      </div>
      
      {/* プレビュー */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">AIに送信されるプロンプト（プレビュー）</h2>
        <pre className="text-sm whitespace-pre-wrap">
          {formatProfileForPrompt(profile.filter(p => p.display_in_chat))}
        </pre>
      </div>
    </div>
  );
}
```

---

### 使用例：会話での活用

#### ケース1: ベンチプレス100kg達成を追加した場合

**管理画面での操作:**
```
カテゴリ: recent_updates
キー: bench_press_achievement
値: ベンチプレス100kg達成
優先度: 95
チャットで表示: ✅
メモ: 2026年1月達成。積極的に話題に出す
```

**AIの会話例:**
```
訪問者: 「健康管理アプリを作りたいんですが」

AI: 「健康管理アプリですね！素晴らしいアイデアです😊
ちなみに石川さんも筋トレが趣味で、最近ベンチプレス100kg達成したんですよ💪
トレーニング記録や栄養管理の機能とか、リアルな体験から良い提案ができると思います！

どんな機能をお考えですか？」
```

---

#### ケース2: 新しい技術を学習中

**管理画面での操作:**
```
カテゴリ: recent_updates
キー: learning_rust
値: Rust言語を学習中（2026年1月〜）
優先度: 80
```

**AIの会話例:**
```
訪問者: 「パフォーマンスが重要なAPIを作りたい」

AI: 「パフォーマンス重視ですね！
Node.jsやGoが選択肢になりますが、実は石川さんも最近Rustを学習し始めてるんです。
超高速なAPIが必要ならRustも検討できますよ。

ただし開発速度を優先するなら、まずはNext.js + Supabaseで始めて、
ボトルネックが見つかってからRustでリプレースするのもアリです👍」
```

---

### まとめ

| 機能 | 説明 |
|------|------|
| **profile_data テーブル** | プロフィール情報を保存 |
| **カテゴリ分類** | basic, skills, hobbies, recent_updates, achievements, personality |
| **優先度制御** | 0-100で会話での言及頻度を調整 |
| **管理画面で編集** | リアルタイムでプロフィール更新 |
| **AIに自動反映** | システムプロンプトに動的に組み込み |
| **自然な会話** | 押し付けがましくなく、文脈に応じて言及 |

**石川さんがベンチプレス100kg達成したら、管理画面で3分で追加 → 即座にAIが訪問者に伝える！** 🎉

---

### RAGによる長期記憶

```typescript
// lib/openai/embeddings.ts
import { openai } from './client';
import { supabase } from '@/lib/supabase/server';

/**
 * テキストのエンベディング生成
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

/**
 * 関連する過去の会話を検索
 */
export async function searchRelevantConversations(
  query: string,
  visitorId: string,
  limit: number = 3
): Promise<string[]> {
  // クエリのエンベディング生成
  const queryEmbedding = await createEmbedding(query);
  
  // ベクトル検索
  const { data } = await supabase.rpc('match_conversations', {
    query_embedding: queryEmbedding,
    visitor_id: visitorId,
    match_threshold: 0.78,
    match_count: limit
  });
  
  return data.map(d => d.content);
}

/**
 * システムプロンプトにRAG情報を追加
 */
export async function getEnhancedSystemPrompt(
  visitorId: string,
  currentMessage: string
): Promise<string> {
  const relevantHistory = await searchRelevantConversations(currentMessage, visitorId);
  
  if (relevantHistory.length === 0) {
    return SYSTEM_PROMPT;
  }
  
  return `${SYSTEM_PROMPT}

【過去の会話履歴】
${relevantHistory.join('\n\n')}

上記の過去の会話を踏まえて、継続的で一貫性のある対応をしてください。
`;
}
```

---

## GSAP アニメーション実装

### 基本設定

```typescript
// lib/gsap/config.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap };
```

### メッセージアニメーション

```typescript
// components/animations/MessageAnimation.tsx
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap/config';

export function MessageAnimation({ children }: { children: React.ReactNode }) {
  const messageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!messageRef.current) return;
    
    gsap.fromTo(
      messageRef.current,
      {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out',
      }
    );
  }, []);
  
  return <div ref={messageRef}>{children}</div>;
}
```

### ページロードアニメーション

```typescript
// components/animations/PageLoadAnimation.tsx
'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap/config';

export function PageLoadAnimation() {
  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.from('.hero-title', {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
    })
    .from('.chat-container', {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: 'back.out(1.7)',
    }, '-=0.5')
    .from('.particles', {
      opacity: 0,
      duration: 1,
    }, '-=0.5');
  }, []);
  
  return null;
}
```

---

## 悪用対策・セキュリティ実装

### なぜ必要なのか？

OpenAI APIは**従量課金制**のため、悪意のあるユーザーに無制限に使われると**コストが青天井**になります。

**想定される悪用パターン:**
1. **スクリプトによる自動化攻撃** - Botで無限にメッセージ送信
2. **Cookieクリアによる制限回避** - 無料枠を何度もリセット
3. **プロキシ経由のアクセス** - IP制限の回避
4. **大量のサイト生成** - 重い処理を連続実行してコスト増大
5. **DDoS攻撃** - サーバーリソースの枯渇

**対策の方針:**
- ✅ **多層防御** - 複数の対策を組み合わせる
- ✅ **段階的な制限** - 疑わしい行動には厳しく、通常ユーザーには優しく
- ✅ **透明性** - 制限理由を明示（「あと3回使えます」等）
- ✅ **管理画面での監視** - 異常を早期発見

---

## Rate Limiting（使用制限）

### 目的
- OpenAI APIコストの制御
- 無料ユーザーの公平な利用機会確保
- サーバーリソースの保護

### 実装方式：Upstash Redis + Tier制

#### なぜUpstash Redisなのか？

| 比較項目 | データベース（PostgreSQL） | Upstash Redis |
|---------|--------------------------|--------------|
| **速度** | 10-50ms | **1-5ms** ⚡ |
| **コスト** | Supabase無料枠を消費 | **完全無料（1万リクエスト/日）** |
| **スケーラビリティ** | 同時アクセスで負荷増 | **高速分散キャッシュ** |
| **実装難易度** | カスタム実装が必要 | **ライブラリで簡単** |

**結論**: Redis は Rate Limiting に最適化されている

---

### Tier別の制限設計

| Tier | 条件 | メッセージ制限 | サイト生成 | リセット |
|------|------|--------------|----------|---------|
| **Tier 1（匿名）** | 初回訪問 | **5回/日** | ❌ 不可 | 毎日0時（JST） |
| **Tier 2（名前）** | 会話内で名前を登録 | **10回/日** | ✅ 1回/日 | 毎日0時（JST） |
| **Tier 3（メール）** | メールアドレス登録 | **30回/日** | ✅ 3回/日 | 毎日0時（JST） |
| **Tier 4（問い合わせ）** | 正式に問い合わせ済み | **無制限** | ✅ 無制限 | - |

---

### 実装コード

#### 1. Redis セットアップ

```typescript
// lib/rate-limit/config.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redisクライアント初期化
export const redis = Redis.fromEnv();

/**
 * Tier別のRate Limiter
 * slidingWindow = 指定期間内の累計回数で制限
 */
export const rateLimiters = {
  // Tier 1: 1日5メッセージ
  tier1: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '24 h'),
    analytics: true, // Upstashダッシュボードで分析可能
    prefix: 'ratelimit:tier1',
  }),
  
  // Tier 2: 1日10メッセージ
  tier2: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '24 h'),
    analytics: true,
    prefix: 'ratelimit:tier2',
  }),
  
  // Tier 3: 1日30メッセージ
  tier3: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24 h'),
    analytics: true,
    prefix: 'ratelimit:tier3',
  }),
};

/**
 * サイト生成用のRate Limiter（より厳しい制限）
 */
export const siteGenerationLimiters = {
  tier2: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, '24 h'),
    analytics: true,
    prefix: 'ratelimit:sitegen:tier2',
  }),
  tier3: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '24 h'),
    analytics: true,
    prefix: 'ratelimit:sitegen:tier3',
  }),
};
```

#### 2. Rate Limit チェック関数

```typescript
// lib/rate-limit/check.ts
import { rateLimiters, siteGenerationLimiters } from './config';

export type RateLimitResult = {
  success: boolean;        // 制限内か？
  remaining: number;       // 残り回数
  reset: number;           // リセット時刻（Unix timestamp）
  limit: number;           // 制限数
};

/**
 * メッセージ送信のRate Limitチェック
 */
export async function checkMessageRateLimit(
  visitorId: string,
  tier: number
): Promise<RateLimitResult> {
  // Tier 4（問い合わせ済み）は無制限
  if (tier === 4) {
    return {
      success: true,
      remaining: 999999,
      reset: 0,
      limit: 999999,
    };
  }
  
  // Tier に応じたLimiterを取得
  const limiter = rateLimiters[`tier${tier}` as keyof typeof rateLimiters];
  
  if (!limiter) {
    throw new Error(`Invalid tier: ${tier}`);
  }
  
  // Rate Limit チェック
  const result = await limiter.limit(visitorId);
  
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  };
}

/**
 * サイト生成のRate Limitチェック
 */
export async function checkSiteGenerationRateLimit(
  visitorId: string,
  tier: number
): Promise<RateLimitResult> {
  // Tier 1 は生成不可
  if (tier === 1) {
    return {
      success: false,
      remaining: 0,
      reset: 0,
      limit: 0,
    };
  }
  
  // Tier 4 は無制限
  if (tier === 4) {
    return {
      success: true,
      remaining: 999999,
      reset: 0,
      limit: 999999,
    };
  }
  
  const limiter = siteGenerationLimiters[`tier${tier}` as keyof typeof siteGenerationLimiters];
  
  if (!limiter) {
    throw new Error(`Invalid tier: ${tier}`);
  }
  
  const result = await limiter.limit(visitorId);
  
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  };
}
```

#### 3. APIでの使用例

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkMessageRateLimit } from '@/lib/rate-limit/check';
import { getVisitorTier } from '@/lib/visitor/identification';

export async function POST(req: NextRequest) {
  const { message, visitorId } = await req.json();
  
  // 訪問者のTierを取得
  const tier = await getVisitorTier(visitorId);
  
  // Rate Limit チェック
  const rateLimit = await checkMessageRateLimit(visitorId, tier);
  
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: '本日の使用回数を超えました',
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        upgradeInfo: getUpgradeMessage(tier), // Tierアップの提案
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    );
  }
  
  // チャット処理...
  // ...
}

function getUpgradeMessage(tier: number): string {
  switch (tier) {
    case 1:
      return 'お名前を教えていただくと、1日10回まで使えるようになります😊';
    case 2:
      return 'メールアドレスを登録すると、1日30回まで使えるようになります！';
    case 3:
      return '詳しく相談したい場合は、お問い合わせからご連絡ください。';
    default:
      return '';
  }
}
```

---

## IP制限・異常検知

### 目的
- 同一IPからの大量アクセスを防ぐ
- DDoS攻撃の検知
- プロキシ経由の悪用を検知

### 実装方式：Redis + カウンター

#### 仕組み

```
┌─────────────────────────────────────────┐
│  リクエスト受信                          │
│  IP: 192.168.1.100                      │
└─────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│  Redisでカウント                         │
│  Key: ip:192.168.1.100:2026-01-25      │
│  Value: 125 (今日のアクセス数)          │
└─────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│  閾値チェック                            │
│  - 100回/時間 → ⚠️ 警告                │
│  - 500回/日 → 🚫 ブロック              │
└─────────────────────────────────────────┘
```

#### 実装コード

```typescript
// lib/security/ip-limiting.ts
import { redis } from '@/lib/rate-limit/config';

const IP_LIMITS = {
  perHour: 100,      // 1時間あたり100リクエスト
  perDay: 500,       // 1日あたり500リクエスト
  blockDuration: 3600, // ブロック時間（秒） = 1時間
};

/**
 * IPアドレスを取得（プロキシ対応）
 */
export function getClientIP(req: NextRequest): string {
  // Vercelの場合
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // CloudFlareの場合
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  // その他
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * IP制限チェック
 */
export async function checkIPLimit(ip: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  
  // ブロックリストチェック
  const isBlocked = await redis.get(`ip:blocked:${ip}`);
  if (isBlocked) {
    return {
      allowed: false,
      reason: 'IP address is blocked due to suspicious activity',
    };
  }
  
  // 1時間あたりのカウント
  const hourKey = `ip:${ip}:hour:${today}:${currentHour}`;
  const hourCount = await redis.incr(hourKey);
  await redis.expire(hourKey, 3600); // 1時間で自動削除
  
  if (hourCount > IP_LIMITS.perHour) {
    // 一時ブロック
    await redis.setex(`ip:blocked:${ip}`, IP_LIMITS.blockDuration, 'auto-blocked');
    
    // 管理者に通知（オプション）
    await notifyAdmin(`IP ${ip} was auto-blocked (${hourCount} requests/hour)`);
    
    return {
      allowed: false,
      reason: 'Too many requests per hour',
    };
  }
  
  // 1日あたりのカウント
  const dayKey = `ip:${ip}:day:${today}`;
  const dayCount = await redis.incr(dayKey);
  await redis.expire(dayKey, 86400); // 24時間で自動削除
  
  if (dayCount > IP_LIMITS.perDay) {
    return {
      allowed: false,
      reason: 'Daily limit exceeded',
    };
  }
  
  return {
    allowed: true,
    remaining: IP_LIMITS.perDay - dayCount,
  };
}

/**
 * 管理者に通知（Slackなど）
 */
async function notifyAdmin(message: string) {
  // Slack Webhook等で通知
  console.error('[SECURITY ALERT]', message);
  
  // 将来的にはSlack連携
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   body: JSON.stringify({ text: message }),
  // });
}
```

#### Middlewareでの適用

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkIPLimit, getClientIP } from '@/lib/security/ip-limiting';

export async function middleware(req: NextRequest) {
  // 管理画面とAPIエンドポイントのみチェック
  if (req.nextUrl.pathname.startsWith('/api') || 
      req.nextUrl.pathname.startsWith('/admin')) {
    
    const ip = getClientIP(req);
    const ipCheck = await checkIPLimit(ip);
    
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', reason: ipCheck.reason },
        { status: 429 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
```

---

## Bot検知（行動分析）

### 目的
- スクリプトによる自動化攻撃を検知
- 人間の自然な操作とBotを区別
- 悪質なクローラーをブロック

### 実装方式：複数の指標を組み合わせた判定

#### 検知指標

| 指標 | 人間 | Bot | 判定 |
|------|------|-----|------|
| **リクエスト間隔** | 5-30秒 | <1秒 | ⚠️ 不自然に速い |
| **User Agent** | 正常 | 空 or 偽装 | ⚠️ 疑わしい |
| **JavaScript実行** | ✅ | ❌ | ❌ 無効化している |
| **マウス移動** | あり | なし | ⚠️ 操作痕跡なし |
| **同一メッセージ** | 毎回違う | 同じ | ⚠️ コピペ連投 |
| **セッション時間** | 数分以上 | <10秒 | ⚠️ 即離脱 |

#### 実装コード

```typescript
// lib/security/bot-detection.ts
import { redis } from '@/lib/rate-limit/config';

export type BotScore = {
  score: number;        // 0-100（高いほど怪しい）
  isBot: boolean;       // 閾値超えでBot判定
  reasons: string[];    // 判定理由
};

/**
 * Bot判定スコアリング
 */
export async function detectBot(params: {
  visitorId: string;
  ip: string;
  userAgent: string;
  timeSinceLastRequest?: number;  // 前回リクエストからの秒数
  message?: string;
}): Promise<BotScore> {
  const { visitorId, ip, userAgent, timeSinceLastRequest, message } = params;
  
  let score = 0;
  const reasons: string[] = [];
  
  // 1. User Agent チェック
  if (!userAgent || userAgent.length < 10) {
    score += 40;
    reasons.push('Invalid User Agent');
  } else if (userAgent.toLowerCase().includes('bot') || 
             userAgent.toLowerCase().includes('crawler')) {
    score += 50;
    reasons.push('Bot/Crawler in User Agent');
  }
  
  // 2. リクエスト間隔チェック
  if (timeSinceLastRequest !== undefined && timeSinceLastRequest < 2) {
    score += 30;
    reasons.push('Too fast requests (< 2s)');
  }
  
  // 3. 同一メッセージの連投チェック
  if (message) {
    const lastMessage = await redis.get(`last_msg:${visitorId}`);
    if (lastMessage === message) {
      score += 25;
      reasons.push('Duplicate message');
    }
    await redis.setex(`last_msg:${visitorId}`, 300, message); // 5分保存
  }
  
  // 4. 短時間での大量リクエスト
  const recentCount = await redis.incr(`bot_check:${visitorId}:${Math.floor(Date.now() / 60000)}`);
  await redis.expire(`bot_check:${visitorId}:${Math.floor(Date.now() / 60000)}`, 60);
  
  if (recentCount > 10) {
    score += 40;
    reasons.push('Too many requests in 1 minute');
  }
  
  // 5. Fingerprintの頻繁な変更（Cookieクリア攻撃）
  const fpChangeCount = await redis.get(`fp_changes:${ip}`);
  if (fpChangeCount && parseInt(fpChangeCount) > 5) {
    score += 20;
    reasons.push('Frequent fingerprint changes');
  }
  
  return {
    score,
    isBot: score >= 60, // 閾値60点以上でBot判定
    reasons,
  };
}

/**
 * Bot判定結果を記録
 */
export async function recordBotDetection(visitorId: string, result: BotScore) {
  if (result.isBot) {
    // Redisに記録
    await redis.setex(`bot_detected:${visitorId}`, 3600, JSON.stringify(result));
    
    // データベースにも記録（管理画面で確認）
    await supabase.from('security_logs').insert({
      visitor_id: visitorId,
      event_type: 'bot_detected',
      score: result.score,
      reasons: result.reasons,
      created_at: new Date().toISOString(),
    });
    
    // 管理者に通知
    console.error(`[BOT DETECTED] Visitor ${visitorId}, Score: ${result.score}`);
  }
}
```

#### API統合例

```typescript
// app/api/chat/route.ts
import { detectBot, recordBotDetection } from '@/lib/security/bot-detection';

export async function POST(req: NextRequest) {
  const { message, visitorId } = await req.json();
  const userAgent = req.headers.get('user-agent') || '';
  const ip = getClientIP(req);
  
  // 前回リクエスト時刻を取得
  const lastRequestTime = await redis.get(`last_req:${visitorId}`);
  const now = Date.now();
  const timeSinceLastRequest = lastRequestTime 
    ? (now - parseInt(lastRequestTime)) / 1000 
    : undefined;
  
  await redis.setex(`last_req:${visitorId}`, 3600, now.toString());
  
  // Bot判定
  const botCheck = await detectBot({
    visitorId,
    ip,
    userAgent,
    timeSinceLastRequest,
    message,
  });
  
  if (botCheck.isBot) {
    await recordBotDetection(visitorId, botCheck);
    
    return NextResponse.json(
      { 
        error: 'Suspicious activity detected',
        message: '不審なアクセスが検出されました。しばらくしてから再度お試しください。',
      },
      { status: 403 }
    );
  }
  
  // 正常な処理...
}
```

---

### フロントエンドでの補助的な対策

#### Honeypot（隠しフィールド）

```tsx
// components/chat/ChatInput.tsx
export function ChatInput() {
  return (
    <form onSubmit={handleSubmit}>
      <textarea name="message" />
      
      {/* Honeypot: Botは見えないフィールドも埋めてしまう */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px' }}
      />
      
      <button type="submit">送信</button>
    </form>
  );
}
```

```typescript
// サーバー側でチェック
if (formData.get('website')) {
  // Honeypotが埋められている = Bot
  return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
}
```

---

### まとめ

| 対策 | 目的 | 実装方法 | コスト |
|------|------|---------|--------|
| **Rate Limiting** | 使用回数制限 | Upstash Redis + Tier制 | 無料 |
| **IP制限** | 大量アクセス防止 | Redis カウンター | 無料 |
| **Bot検知** | 自動化攻撃防止 | スコアリング方式 | 無料 |
| **Honeypot** | Bot判別 | 隠しフィールド | 無料 |
| **Fingerprinting** | Cookie回避対策 | FingerprintJS | 無料 |

**総合的な防御で、コスト0円で堅牢なセキュリティを実現** ✨

---

## 環境変数

```.env
# .env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# その他
NEXT_PUBLIC_APP_URL=https://yoursite.com
ADMIN_EMAIL=ishikawa@example.com
```

---

## デプロイ設定（Vercel）

### vercel.json

```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "OPENAI_API_KEY": "@openai-api-key",
    "UPSTASH_REDIS_REST_URL": "@upstash-redis-url",
    "UPSTASH_REDIS_REST_TOKEN": "@upstash-redis-token"
  }
}
```

---

## パフォーマンス最適化

### Next.js設定

```typescript
// next.config.ts
const config = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  // GSAP等のライブラリ最適化
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'gsap': 'gsap/dist/gsap.min.js',
    };
    return config;
  },
};

export default config;
```

### コード分割

```typescript
// 動的インポート
const ParticleBackground = dynamic(
  () => import('@/components/animations/ParticleBackground'),
  { ssr: false } // クライアントサイドのみ
);

const AdminDashboard = dynamic(
  () => import('@/components/admin/Dashboard'),
  { loading: () => <LoadingSpinner /> }
);
```

---

## セキュリティ対策

### Content Security Policy

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}
```

### iframe Sandbox

```tsx
<iframe
  srcDoc={generatedCode}
  sandbox="allow-scripts allow-same-origin"
  className="w-full h-full"
/>
```

---

**次のステップ**: UI設計書を作成！
