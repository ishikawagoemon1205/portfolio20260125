# 記事機能設計書 v1.0

**最終更新**: 2026年1月26日  
**ステータス**: 🎯 設計完了・実装待ち

---

## 📋 概要

note風の技術ブログ機能を追加し、訪問者に有益なコンテンツを提供しながら、
AIが記事を提案することで自然な問い合わせ誘導を実現する。

### 目的

1. **技術力の証明**: 実装事例や学習内容を記事化
2. **SEO強化**: 技術記事でオーガニック流入を獲得
3. **AI提案**: チャット中に関連記事をAIが自動提案
4. **問い合わせ誘導**: 記事からチャット・問い合わせへの動線確保

---

## 🎨 UI/UX設計

### ホーム画面からの導線（カードスライダー方式）

```
┌─────────────────────────────────────────┐
│  💬 あっちゃんAI                        │
│  ┌────────────────────────────────┐    │
│  │ チャットエリア                 │    │
│  └────────────────────────────────┘    │
│                                         │
│  📚 最近の記事                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │📝  │ │💻  │ │🚀  │ │📖  │  ←スワイプ│
│  │記事│ │記事│ │記事│ │記事│         │
│  └────┘ └────┘ └────┘ └────┘         │
└─────────────────────────────────────────┘
```

**実装技術**:
- Swiper.js or Embla Carousel
- GSAP でカードアニメーション
- Intersection Observer でビューポート検知

### 記事一覧ページ (`/articles`)

```
┌─────────────────────────────────────────┐
│  📚 技術記事                            │
│                                         │
│  🏷️ タグフィルター                      │
│  [React] [Next.js] [TypeScript] [全て] │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📝 Next.jsでフルスタック開発       │  │
│  │ Supabase + Next.js + TypeScript    │  │
│  │ 2026/01/20 · 10分 · 💻React        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🚀 TypeScriptの型安全設計         │  │
│  │ 実務で役立つ型定義のベスト...      │  │
│  │ 2026/01/15 · 15分 · 💻TypeScript  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 記事詳細ページ (`/articles/[slug]`)

**PC表示（未ログイン）**:
```
┌─────────────────────────────────────────┐
│  📝 Next.jsでフルスタック開発入門       │
│  Supabase + Next.js + TypeScriptで...  │
│                                         │
│  2026/01/20 · 10分 · 👁️ 123回         │
│  🏷️ React, Next.js, TypeScript         │
│                                         │
│  ─────────────────────────────────────  │
│  ## はじめに                            │
│  この記事では...                        │
│                                         │
│  ## 実装手順                            │
│  1. プロジェクトの作成                  │
│  ...                                    │
│                                         │
│  ─────────────────────────────────────  │
│  💼 関連する業務経験                    │
│  - SMS配信SaaS開発（2024/06〜）        │
│                                         │
│  💬 この記事について質問する            │
│  📧 仕事を依頼する                      │
└─────────────────────────────────────────┘
```

**PC表示（ログイン時）**:
```
┌─────────────────────────────────────────┐
│  📝 Next.jsでフルスタック開発入門       │
│  [✏️ 編集] [🗑️ 削除] [👁️ 公開/非公開]  │
│                                         │
│  （記事内容は同じ）                     │
└─────────────────────────────────────────┘
```

### 記事編集画面 (`/articles/[slug]/edit`)

**PC表示（Split View）**:
```
┌─────────────────────┬───────────────────┐
│  📝 Markdown        │  👁️ Preview      │
│                     │                   │
│  # はじめに         │  はじめに         │
│  この記事では...    │  この記事では...  │
│                     │                   │
│  ## 実装手順        │  実装手順         │
│  1. プロジェクト... │  1. プロジェクト..│
│                     │                   │
│  ```typescript      │  typescript       │
│  const app = ...    │  const app = ...  │
│  ```                │                   │
└─────────────────────┴───────────────────┘
```

**モバイル表示（タブ切り替え）**:
```
┌─────────────────────────────────────────┐
│  [✏️ 編集] [👁️ プレビュー]              │
│                                         │
│  # はじめに                             │
│  この記事では...                        │
│                                         │
│  ## 実装手順                            │
│  1. プロジェクトの作成                  │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

## 🗄️ データベース設計

### articles テーブル

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,              -- URL用（例: "nextjs-tutorial"）
  title TEXT NOT NULL,                    -- タイトル
  subtitle TEXT,                          -- サブタイトル
  content TEXT NOT NULL,                  -- Markdown形式本文
  tags TEXT[],                            -- 技術タグ（例: ['TypeScript', 'React']）
  related_experience_ids TEXT[],          -- 職務経歴との紐付け（タイトルベース）
  thumbnail_url TEXT,                     -- サムネイル画像URL
  estimated_reading_time INTEGER,         -- 推定読了時間（分）
  is_published BOOLEAN DEFAULT false,     -- 公開/非公開
  published_at TIMESTAMP,                 -- 公開日時
  view_count INTEGER DEFAULT 0,           -- 閲覧数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);

-- RLS (Row Level Security)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 公開記事は全員が閲覧可能
CREATE POLICY "公開記事は誰でも閲覧可能"
  ON articles FOR SELECT
  USING (is_published = true);

-- 認証済みユーザーはすべての記事を閲覧・編集可能
CREATE POLICY "認証済みユーザーは全記事を操作可能"
  ON articles FOR ALL
  USING (auth.role() = 'authenticated');
```

### article_views テーブル（閲覧数トラッキング）

```sql
CREATE TABLE article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_article_views_article_id ON article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON article_views(viewed_at DESC);
```

---

## 🔌 API設計

### 記事CRUD API

#### `GET /api/articles` - 記事一覧取得

**クエリパラメータ**:
- `tag`: タグフィルター
- `limit`: 取得件数（デフォルト: 10）
- `offset`: オフセット

**レスポンス例**:
```json
{
  "articles": [
    {
      "id": "xxx",
      "slug": "nextjs-tutorial",
      "title": "Next.jsでフルスタック開発入門",
      "subtitle": "Supabase + Next.js + TypeScript",
      "tags": ["React", "Next.js", "TypeScript"],
      "thumbnail_url": "/images/articles/nextjs.jpg",
      "estimated_reading_time": 10,
      "published_at": "2026-01-20T10:00:00Z",
      "view_count": 123
    }
  ],
  "total": 15
}
```

#### `GET /api/articles/[slug]` - 記事詳細取得

**レスポンス例**:
```json
{
  "article": {
    "id": "xxx",
    "slug": "nextjs-tutorial",
    "title": "Next.jsでフルスタック開発入門",
    "subtitle": "Supabase + Next.js + TypeScript",
    "content": "# はじめに\nこの記事では...",
    "tags": ["React", "Next.js", "TypeScript"],
    "related_experiences": [
      {
        "title": "SMS配信SaaS開発",
        "period": "2024年6月〜"
      }
    ],
    "published_at": "2026-01-20T10:00:00Z",
    "view_count": 123
  }
}
```

#### `POST /api/admin/articles` - 記事作成（認証必須）

**リクエストボディ**:
```json
{
  "slug": "nextjs-tutorial",
  "title": "Next.jsでフルスタック開発入門",
  "subtitle": "Supabase + Next.js + TypeScript",
  "content": "# はじめに\n...",
  "tags": ["React", "Next.js"],
  "related_experience_ids": ["SMS配信SaaS開発"],
  "is_published": true
}
```

#### `PUT /api/admin/articles/[id]` - 記事更新（認証必須）

#### `DELETE /api/admin/articles/[id]` - 記事削除（認証必須）

---

## 🤖 AI提案機能の実装

### システムプロンプトへの記事一覧埋め込み

```typescript
// lib/openai/system-prompt.ts

async function getArticlesList() {
  const supabase = await createAdminClient();
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, tags')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20);
  
  return articles;
}

export async function generateSystemPrompt(context: SystemPromptContext) {
  const articles = await getArticlesList();
  
  const articlesPrompt = articles.map(a => 
    `- ${a.title} (タグ: ${a.tags.join(', ')}) → /articles/${a.slug}`
  ).join('\n');
  
  const systemPrompt = `
...（既存のプロンプト）

## 📚 参考記事（関連する質問が出たら提案してください）
${articlesPrompt}

**提案の仕方**:
- ユーザーの質問に関連する記事があれば、自然に提案してください
- 例: 「Next.jsについてお答えしますね。こちらの記事も参考になるかもしれません: [Next.jsでフルスタック開発入門](/articles/nextjs-tutorial)」
- 押し付けがましくならないよう、会話の流れで自然に紹介してください
`;
  
  return systemPrompt;
}
```

---

## 🎯 技術タグとスキルの連動

### プロフィールスキルと記事タグの同期

**仕組み**:
1. プロフィール編集で `skills: ['TypeScript', 'React', 'Next.js']` を設定
2. 記事作成時、これらのスキルをタグの選択肢として表示
3. スキルが削除されたら、該当記事のタグも自動で非選択状態に（削除はしない）
4. 同名のスキルが再登録されたら、自動で再リンク

**実装方法**:

```typescript
// app/api/admin/articles/sync-tags/route.ts

export async function POST() {
  const supabase = await createAdminClient();
  
  // プロフィールからスキル一覧を取得
  const { data: profile } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'basic_profile')
    .single();
  
  const skills = profile?.value?.skills || [];
  
  // 全記事を取得してタグを検証
  const { data: articles } = await supabase
    .from('articles')
    .select('id, tags');
  
  for (const article of articles) {
    const validTags = article.tags.filter(tag => skills.includes(tag));
    
    if (validTags.length !== article.tags.length) {
      // タグを更新
      await supabase
        .from('articles')
        .update({ tags: validTags })
        .eq('id', article.id);
    }
  }
  
  return NextResponse.json({ success: true });
}
```

---

## 🎨 デザイン仕様

### カラーパレット（note風）

```css
:root {
  --article-bg: #ffffff;
  --article-text: #333333;
  --article-secondary: #666666;
  --article-border: #e5e5e5;
  --article-link: #41c9b4;
  --article-code-bg: #f5f5f5;
}

[data-theme='dark'] {
  --article-bg: #1a1a1a;
  --article-text: #e0e0e0;
  --article-secondary: #a0a0a0;
  --article-border: #333333;
  --article-link: #5ae0c8;
  --article-code-bg: #2a2a2a;
}
```

### タイポグラフィ

```css
.article-content {
  /* 見出し */
  h1 { font-size: 2rem; font-weight: 700; margin: 2rem 0 1rem; }
  h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
  h3 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
  
  /* 本文 */
  p { line-height: 1.8; margin: 1rem 0; }
  
  /* コードブロック */
  pre { background: var(--article-code-bg); padding: 1rem; border-radius: 8px; }
  code { font-family: 'Fira Code', monospace; font-size: 0.9em; }
}
```

---

## 📱 レスポンシブ対応

### ブレークポイント

- **Mobile**: 〜768px
- **Tablet**: 768px〜1024px
- **Desktop**: 1024px〜

### モバイル最適化

- カードスライダー: タッチ対応、スワイプジェスチャー
- 記事詳細: 1カラム、画像は100%幅
- 編集画面: タブ切り替え（編集 / プレビュー）

---

## 🔐 認証とセキュリティ

### Supabase Auth統合

```typescript
// middleware.ts

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 管理画面は認証必須
  if (pathname.startsWith('/admin')) {
    const supabase = createMiddlewareClient({ req: request });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### ログインページ (`/admin/login`)

```tsx
// app/admin/login/page.tsx

'use client';

export default function AdminLoginPage() {
  const handleLogin = async (email: string, password: string) => {
    const supabase = createClientComponentClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      router.push('/admin');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">ログイン</button>
      </form>
    </div>
  );
}
```

---

## 📦 必要なパッケージ

```bash
# Markdown処理
npm install react-markdown remark-gfm rehype-highlight

# Markdownエディタ
npm install @uiw/react-md-editor

# カルーセル
npm install swiper

# シンタックスハイライト
npm install shiki
```

---

## 🚀 実装優先度

### Phase 1: 基本機能（1週間）
1. ✅ データベーステーブル作成
2. ✅ 記事CRUD API実装
3. ✅ 記事一覧ページ (`/articles`)
4. ✅ 記事詳細ページ (`/articles/[slug]`)

### Phase 2: 編集機能（3日）
1. ✅ 認証機能（Supabase Auth）
2. ✅ ログインページ (`/admin/login`)
3. ✅ 記事編集画面（Split View）
4. ✅ 記事作成・更新・削除

### Phase 3: UI強化（3日）
1. ✅ ホーム画面にカードスライダー追加
2. ✅ GSAP アニメーション
3. ✅ Markdownスタイリング（note風）
4. ✅ レスポンシブ対応

### Phase 4: AI統合（2日）
1. ✅ 記事一覧をシステムプロンプトに埋め込み
2. ✅ AIが自然に記事を提案する仕組み
3. ✅ 記事下部のチャット誘導ボタン

### Phase 5: 高度化（1週間）
1. ✅ 技術タグとスキルの連動
2. ✅ 閲覧数トラッキング
3. ✅ 関連記事表示
4. ✅ SEO最適化（OGP、sitemap）

---

## 🎯 成功指標

- 記事経由のチャット開始率: 30%以上
- 記事からの問い合わせ率: 5%以上
- 平均滞在時間: 3分以上
- 記事のSNSシェア数: 月10件以上

---

**準備完了！実装を開始できます！** 🚀✨
