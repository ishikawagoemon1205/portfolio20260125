# AIコンシェルジュ搭載の次世代ポートフォリオサイトを作った

こんにちは、石川敦大です。今回は、従来の「見るだけ」のポートフォリオから一歩進んだ、**「使える・体験できる」ポートフォリオサイト**を開発しました。訪問者が私のAIアバター「あっちゃんAI」と対話しながら、開発相談からサイト生成まで体験できる、インタラクティブな開発者ポートフォリオです。

## はじめに

### なぜこのプロダクトを作ったのか

エンジニアのポートフォリオサイトは数多く存在しますが、そのほとんどが静的な情報の羅列です。私は**「技術力を見せるだけでなく、体験してもらう」**ことを重視しました。

**主な目的：**
1. 受託開発案件の獲得 - AIとの対話を通じた自然なリード獲得
2. 訪問者への価値提供 - 開発相談をその場で解決
3. 圧倒的な差別化 - 「また別のポートフォリオか」と思わせない

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** - ユーティリティファーストCSS
- **GSAP** - 高度なアニメーション
- **@uiw/react-md-editor** - Markdown エディタ

### バックエンド
- **Next.js API Routes** - RESTful API
- **Supabase** - PostgreSQL データベース + 認証 + ストレージ
- **OpenAI API** (GPT-4o-mini) - AIチャット機能
- **Vercel AI SDK** - ストリーミングレスポンス

### インフラ
- **Vercel** - ホスティング・デプロイ
- **Supabase** - データベース・認証・ストレージ
- **Upstash Redis** - Rate Limiting

## 主要機能

### 1. AIチャット機能（コア機能）

訪問者が「あっちゃんAI」と自然言語で対話できます。

**特徴：**
- リアルタイムストリーミング表示
- 会話履歴の保存と復元
- 要件ヒアリング・技術スタック提案
- 工数・概算見積もり提示

**実装のポイント：**

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';

export async function POST(request: NextRequest) {
  const { message, conversationId } = await request.json();
  
  // OpenAI APIでストリーミングレスポンス
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: chatHistory,
    stream: true,
  });
  
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

### 2. 訪問者識別とパーソナライゼーション

**Cookie + Fingerprinting** で訪問者を識別し、再訪時に会話を復元します。

**実装のポイント：**

```typescript
// lib/visitor.ts
export async function getOrCreateVisitor(
  visitorId: string, 
  fingerprint?: string
): Promise<Visitor> {
  // Cookieでvisitor_idを取得
  const cookies = await import('next/headers').then(m => m.cookies());
  let visitorId = cookies.get('visitor_id')?.value;
  
  if (!visitorId) {
    // 新規訪問者の場合、fingerprintで既存訪問者を検索
    const existingVisitor = await findVisitorByFingerprint(fingerprint);
    
    if (existingVisitor) {
      // 再訪問
      return existingVisitor;
    }
    
    // 新規作成
    visitorId = nanoid(16);
    await createVisitor(visitorId, fingerprint);
  }
  
  return await getVisitor(visitorId);
}
```

**ユニークな点：**
- **fingerprintとCookieの二重識別** - Cookieが削除されても再訪問を検知
- **「おかえりなさい」機能** - 過去の会話を踏まえた継続的な対話

### 3. サイト生成機能（差別化ポイント）

訪問者との対話内容を分析し、**パーソナライズされたHTML/CSS/JSサイト**を生成します。

**実装のポイント：**

```typescript
// lib/openai/site-generator.ts
export async function generatePersonalizedSite(
  request: SiteGenerationRequest
): Promise<SiteGenerationResult> {
  // 会話履歴を取得
  const conversationSummary = await getConversationSummary(
    request.conversationId
  );
  
  // プロンプト生成
  const prompt = generateSiteGenerationPrompt(conversationSummary);
  
  // OpenAI APIでサイト生成
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: conversationSummary }
    ],
  });
  
  const htmlContent = extractHTMLFromResponse(response);
  
  // Supabaseに保存
  const uniqueUrl = generateUniqueUrl();
  await saveGeneratedSite({
    uniqueUrl,
    htmlContent,
    conversationId: request.conversationId,
  });
  
  return {
    htmlContent,
    previewUrl: `/sites/${uniqueUrl}`,
    tokensUsed: response.usage.total_tokens,
  };
}
```

**生成例：**
- Tailwind CSSベースのモダンデザイン
- レスポンシブ対応
- インタラクティブな要素（JavaScript使用）

### 4. Tier制の使用制限

悪用を防ぎつつ、段階的に機能を開放する仕組みです。

| Tier | 条件 | メッセージ制限 | サイト生成 |
|------|------|----------------|------------|
| 1 | 匿名 | 1日5回 | ❌ |
| 2 | 名前登録 | 1日10回 | ✅ |
| 3 | メール登録 | 1日30回 | ✅ |
| 4 | 問い合わせ済み | 無制限 | ✅ |

**実装のポイント：**

```typescript
// lib/rate-limit.ts
export async function checkMessageRateLimit(
  visitorId: string,
  tier: number,
  ip: string
): Promise<RateLimitResult> {
  const limits = {
    1: 5,
    2: 10,
    3: 30,
    4: Infinity,
  };
  
  const limit = limits[tier] || limits[1];
  const key = `msg_limit:${visitorId}:${getToday()}`;
  
  const count = await redis.incr(key);
  await redis.expire(key, 86400); // 24時間
  
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    reset: getNextMidnight(),
  };
}
```

### 5. セキュリティ・悪用対策

**実装した対策：**

#### Rate Limiting（Upstash Redis）
```typescript
// lib/rate-limit.ts
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<boolean> {
  const key = `rate:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  return count <= limit;
}
```

#### Bot検知（スコアリング方式）
```typescript
// lib/security/bot-detection.ts
export async function detectBot(): Promise<BotDetectionResult> {
  let score = 0;
  const reasons: string[] = [];
  
  // ① User-Agent チェック
  const userAgent = headers().get('user-agent') || '';
  if (BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
    score += 50;
    reasons.push('Known bot user-agent');
  }
  
  // ② リクエスト間隔チェック
  if (timeSinceLastRequest < 2) {
    score += 30;
    reasons.push('Too fast requests');
  }
  
  // ③ メッセージ内容チェック
  if (message.length < 3 || /^[a-zA-Z0-9]+$/.test(message)) {
    score += 20;
    reasons.push('Suspicious message content');
  }
  
  return {
    isBot: score >= 60,
    score,
    reasons,
  };
}
```

### 6. 管理画面

Next.js Middlewareで認証を強制し、本番環境でも安全です。

**認証Middleware：**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Supabase セッション更新
  const { supabaseResponse, user } = await updateSession(request);
  
  // 管理者ページの認証チェック
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return supabaseResponse;
}
```

**管理機能：**
- 会話履歴の閲覧
- 訪問者管理
- サイト生成ログ
- AI設定
- プロフィール編集
- キャラクター口調設定
- 分析ダッシュボード
- **記事管理（note風ブログ）** ← 今回追加！

### 7. 記事機能（新機能）

技術記事をnote風のUIで公開できる機能を追加しました。

**特徴：**
- Markdownエディタ（@uiw/react-md-editor）
- 画像アップロード（Supabase Storage）
- タグ管理とオートコンプリート
- 閲覧数トラッキング
- 下書き・公開状態管理

**ユニークな実装：フルスクリーンモーダルエディタ**

```typescript
// app/admin/articles/new/page.tsx
export default function NewArticlePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  
  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex">
      {/* 折りたたみ可能なサイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all`}>
        <input 
          type="text" 
          placeholder="記事のタイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="サブタイトル"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />
        {/* サムネイル画像アップロード */}
        <ImageUploader onUpload={setThumbnailUrl} />
        {/* タグ入力 */}
        <TagInput tags={tags} onChange={setTags} />
      </div>
      
      {/* Markdownエディタ */}
      <div className="flex-1">
        <MDEditor
          value={content}
          onChange={setContent}
          height="100%"
        />
      </div>
    </div>
  );
}
```

**変更検知と確認モーダル：**

```typescript
// 変更を検知
const hasChanges = 
  title !== originalData.title ||
  content !== originalData.content ||
  tags.length !== originalData.tags.length;

// 閉じる時の確認
const handleClose = () => {
  if (hasChanges) {
    setShowExitConfirmation(true);
  } else {
    router.push('/admin/articles');
  }
};

// ブラウザの「戻る」も防止
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasChanges]);
```

## データベース設計

Supabase PostgreSQLで、以下の12テーブルを設計しました。

**主要テーブル：**

### visitors（訪問者情報）
```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,
  fingerprint TEXT,
  tier INTEGER DEFAULT 1,
  visit_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### conversations（会話セッション）
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);
```

### messages（個別メッセージ）
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### articles（記事）
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ユニークな実装のポイント

### 1. ストリーミングレスポンスによる自然な会話体験

従来のリクエスト/レスポンス方式ではなく、**OpenAI APIのストリーミング機能**を活用し、タイピングエフェクトのようなリアルタイム表示を実現しました。

```typescript
// Vercel AI SDKを使用
import { OpenAIStream, StreamingTextResponse } from 'ai';

const stream = OpenAIStream(response, {
  onStart: async () => {
    // ストリーミング開始時
  },
  onToken: async (token) => {
    // トークンごとに実行
  },
  onCompletion: async (completion) => {
    // 完了時にメッセージをDBに保存
    await saveMessage(completion);
  },
});

return new StreamingTextResponse(stream);
```

### 2. 訪問者識別の二重化

**CookieとFingerprintの両方**を使用することで、Cookieが削除されても訪問者を特定できます。

```typescript
// ① Cookieから取得
const visitorId = cookies.get('visitor_id')?.value;

// ② Cookieがない場合、fingerprintで検索
if (!visitorId && fingerprint) {
  const existing = await supabase
    .from('visitors')
    .select()
    .eq('fingerprint', fingerprint)
    .single();
  
  if (existing.data) {
    // 再訪問として扱う
    return existing.data;
  }
}
```

### 3. Rate LimitingにUpstash Redisを採用

Vercelの制約上、サーバーレス環境でのステート管理が課題でしたが、**Upstash Redis**を使用することで、訪問者ごとの使用回数をリアルタイムで管理できます。

```typescript
const key = `msg_limit:${visitorId}:${getToday()}`;
const count = await redis.incr(key);
await redis.expire(key, 86400); // 24時間で自動削除
```

### 4. Bot検知のスコアリング方式

単一の条件ではなく、**複数の指標を組み合わせてスコアリング**することで、誤検知を減らしつつBot対策を実現しました。

**チェック項目：**
- User-Agent（既知のBot）
- リクエスト間隔（2秒未満は怪しい）
- メッセージ内容（短すぎる、ランダム文字列）
- IPアドレス（ブラックリスト）

### 5. Middlewareによる認証の一元管理

全ての管理画面ルートで認証をチェックし、**本番環境でもセキュリティを担保**しました。

```typescript
// middleware.ts
if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
  if (!user) {
    return NextResponse.redirect('/admin/login');
  }
}
```

### 6. 記事エディタのUX最適化

**フルスクリーンモーダル + 折りたたみサイドバー**で、執筆に集中できる環境を実現しました。

- 初期状態でサイドバーは閉じている
- エディタが画面全体を占有
- 未保存の変更を検知して確認モーダル表示
- ブラウザの「戻る」でも警告

## パフォーマンス最適化

### 1. Next.js App Routerの活用

Server ComponentとClient Componentを適切に分離し、初期ロードを高速化しました。

```typescript
// app/page.tsx (Server Component)
export default function HomePage() {
  // サーバーサイドでデータ取得
  const initialData = await fetchInitialData();
  
  return (
    <div>
      <ChatClient initialData={initialData} />
    </div>
  );
}

// components/ChatClient.tsx (Client Component)
'use client';
export function ChatClient({ initialData }) {
  // クライアント側のインタラクション
}
```

### 2. 画像最適化

Supabase Storageに画像をアップロードし、CDN経由で配信することで高速化しました。

```typescript
// 画像アップロード
const { data, error } = await supabase.storage
  .from('portfolio20260125')
  .upload(filePath, file, {
    contentType: file.type,
  });

// 公開URLを取得
const { data: { publicUrl } } = supabase.storage
  .from('portfolio20260125')
  .getPublicUrl(filePath);
```

### 3. データベースインデックス

頻繁にクエリされるカラムにインデックスを作成しました。

```sql
-- 訪問者IDでの検索を高速化
CREATE INDEX idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX idx_visitors_fingerprint ON visitors(fingerprint);

-- 会話履歴の取得を高速化
CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- 記事のslugでの検索を高速化
CREATE UNIQUE INDEX idx_articles_slug ON articles(slug);
```

## 今後の展開

### 実装予定の機能

1. **RAG（Retrieval-Augmented Generation）**
   - 会話履歴をベクトル化してSupabase Vectorに保存
   - 過去の会話から関連情報を取得してAIに渡す

2. **AI記事提案機能**
   - チャット中に関連記事をAIが自動提案
   - 「この記事が参考になるかもしれません」

3. **プロフィール言及分析**
   - AIとの会話で、どの経歴・スキルがよく話題になるか分析
   - データドリブンでプロフィールを改善

4. **サイト生成機能の強化**
   - デザインパターンの選択
   - 複数パターンの生成
   - 「別案を見せて」機能

## まとめ

このポートフォリオサイトは、単なる情報掲載ではなく、**訪問者に価値を提供しながら自然にリードを獲得する**ための営業ツールとして設計しました。

**技術的な学び：**
- OpenAI APIのストリーミング機能の活用
- Supabaseの認証・RLS・Storageの実践
- Upstash Redisによるサーバーレス環境でのステート管理
- Next.js 15のApp Routerの深い理解
- セキュリティ対策の重層化

**ビジネス的な学び：**
- AIを活用した営業の自動化
- 訪問者のニーズデータの蓄積
- 段階的な信頼構築（Tier制）

このプロダクトを通じて、「技術力を見せる」だけでなく「技術力を体験してもらう」ことの重要性を実感しました。

---

**ソースコード：** [GitHub](https://github.com/ishikawagoemon1205/portfolio20260125)  
**デモサイト：** [あっちゃんAI](https://your-portfolio-url.vercel.app)

**お問い合わせ：**
このようなAI統合システムの開発に興味がある方は、ぜひサイトで「あっちゃんAI」に話しかけてみてください！
