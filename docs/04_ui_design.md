# UI設計書 v2.0 - 超こだわりUI

## デザインコンセプト

### テーマ
**「未来的でミニマル、でも温かみのあるAI体験」**

- **ミニマリズム**: 余計な要素を削ぎ落とし、本質的な機能に集中
- **モダン**: GSAP、パーティクル効果で最先端の印象
- **親しみやすさ**: あっちゃんAIのフレンドリーなキャラクター
- **プロフェッショナル**: 技術力を感じさせる洗練されたデザイン

---

## カラーパレット

### メインカラー
```css
/* プライマリ（アクセント） */
--primary: #3B82F6;           /* Blue-500 - 信頼感・プロフェッショナル */
--primary-light: #60A5FA;     /* Blue-400 */
--primary-dark: #2563EB;      /* Blue-600 */

/* セカンダリ（AI関連） */
--secondary: #8B5CF6;         /* Purple-500 - AI・未来的 */
--secondary-light: #A78BFA;   /* Purple-400 */

/* アクセント（強調） */
--accent: #10B981;            /* Emerald-500 - ポジティブ */
--accent-warning: #F59E0B;    /* Amber-500 - 注意 */
--accent-danger: #EF4444;     /* Red-500 - エラー */

/* ニュートラル */
--background: #FFFFFF;        /* 背景（ライトモード） */
--background-secondary: #F9FAFB; /* Gray-50 */
--text-primary: #111827;      /* Gray-900 */
--text-secondary: #6B7280;    /* Gray-500 */
--border: #E5E7EB;            /* Gray-200 */

/* ダークモード（管理画面） */
--dark-bg: #0F172A;           /* Slate-900 */
--dark-bg-secondary: #1E293B; /* Slate-800 */
--dark-text: #F1F5F9;         /* Slate-100 */
--dark-border: #334155;       /* Slate-700 */
```

### グラデーション
```css
--gradient-primary: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
--gradient-hero: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
--gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
```

---

## タイポグラフィ

### フォントファミリー
```css
/* 見出し・UI */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 日本語 */
--font-ja: 'Noto Sans JP', sans-serif;

/* コード */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### フォントサイズ（Tailwind準拠）
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

---

## 画面設計

### 📱 公開ページ（1画面のみ）

## 1. トップページ（チャット画面） - `/`

### レイアウト（デスクトップ）

```
+──────────────────────────────────────────────────────────────+
│                      ✨ パーティクル背景 ✨                    │
│                                                              │
│                                                              │
│           +──────────────────────────────────+               │
│           │                                  │               │
│           │       あっちゃんAI 💬            │               │
│           │  石川敦大のAIコンシェルジュ       │               │
│           │                                  │               │
│           │  「何を作りたいですか？」         │               │
│           │   気軽に相談してください 😊       │               │
│           │                                  │               │
│           └──────────────────────────────────┘               │
│                                                              │
│                                                              │
│           +──────────────────────────────────+               │
│           │  チャットメッセージエリア          │               │
│           │                                  │               │
│           │  👤 ユーザー:                    │               │
│           │  ECサイトを作りたいです           │               │
│           │                            12:34 │               │
│           │                                  │               │
│           │  🤖 あっちゃん:                  │               │
│           │  いいですね！どんな商品を          │               │
│           │  扱う予定ですか？                 │               │
│           │                            12:34 │               │
│           │                                  │               │
│           │  [あっちゃんが入力中... ●●●]     │               │
│           │                                  │               │
│           └──────────────────────────────────┘               │
│                                                              │
│           +──────────────────────────────────+               │
│           │ [メッセージを入力...]       [📤] │               │
│           │                                  │               │
│           │ 💬 残り: 8回 (今日の無料枠)      │               │
│           └──────────────────────────────────┘               │
│                                                              │
+──────────────────────────────────────────────────────────────+
```

### コンポーネント詳細

#### ヒーローセクション
```tsx
<div className="hero-section">
  {/* パーティクル背景（GSAP + tsparticles） */}
  <ParticleBackground />
  
  {/* タイトル */}
  <h1 className="hero-title text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
    あっちゃんAI 💬
  </h1>
  
  <p className="hero-subtitle text-xl text-gray-600">
    石川敦大のAIコンシェルジュ
  </p>
  
  {/* タイピングエフェクト */}
  <TypeAnimation
    sequence={[
      '「何を作りたいですか？」',
      2000,
      '「どんなサイトが必要ですか？」',
      2000,
      '「アイデアを聞かせてください！」',
      2000,
    ]}
    wrapper="p"
    repeat={Infinity}
    className="hero-message text-2xl"
  />
</div>
```

#### チャットコンテナ
```tsx
<div className="chat-container max-w-3xl mx-auto">
  {/* メッセージ一覧 */}
  <div className="messages-area h-[500px] overflow-y-auto">
    {messages.map((msg, i) => (
      <MessageAnimation key={i}>
        <ChatMessage message={msg} />
      </MessageAnimation>
    ))}
    
    {/* 入力中インジケーター */}
    {isTyping && <TypingIndicator />}
  </div>
  
  {/* 入力欄 */}
  <ChatInput 
    onSend={handleSend}
    remaining={remainingMessages}
  />
</div>
```

#### メッセージコンポーネント
```tsx
// ユーザーメッセージ
<div className="flex justify-end mb-4">
  <div className="bg-primary text-white rounded-2xl rounded-tr-none px-6 py-3 max-w-[70%] shadow-lg">
    <p className="text-base">{content}</p>
    <span className="text-xs opacity-75">{time}</span>
  </div>
</div>

// AIメッセージ
<div className="flex justify-start mb-4">
  <div className="flex gap-3">
    {/* アバター */}
    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
      🤖
    </div>
    
    {/* メッセージ */}
    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-6 py-3 max-w-[70%] shadow-md">
      <ReactMarkdown>{content}</ReactMarkdown>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  </div>
</div>
```

---

### サイト生成プレビュー（モーダル展開）

```
+──────────────────────────────────────────────────────────────+
│  [×]                  サイトプレビュー                         │
+──────────────────────────────────────────────────────────────+
│                                                              │
│  +─────────────────────+  +─────────────────────────────+    │
│  │  生成コード         │  │  プレビュー                  │    │
│  │                    │  │                             │    │
│  │  <!DOCTYPE html>   │  │  [実際のサイト表示]          │    │
│  │  <html>            │  │                             │    │
│  │  <head>            │  │   ┌─────────────┐          │    │
│  │    <style>         │  │   │ ヘッダー    │          │    │
│  │      ...           │  │   └─────────────┘          │    │
│  │    </style>        │  │                             │    │
│  │  </head>           │  │   商品一覧                   │    │
│  │  <body>            │  │   ┌───┐ ┌───┐ ┌───┐       │    │
│  │    ...             │  │   │   │ │   │ │   │       │    │
│  │  </body>           │  │   └───┘ └───┘ └───┘       │    │
│  │  </html>           │  │                             │    │
│  │                    │  │                             │    │
│  │                    │  │                             │    │
│  └─────────────────────┘  └─────────────────────────────┘    │
│                                                              │
│  [📋 コピー] [⬇️ ダウンロード] [🔄 別案を生成] [💬 調整依頼]  │
│                                                              │
+──────────────────────────────────────────────────────────────+
```

#### 実装
```tsx
<Dialog open={isPreviewOpen}>
  <DialogContent className="max-w-7xl w-full h-[80vh]">
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* 左: コードエディタ */}
      <div className="relative">
        <CodeMirror
          value={generatedCode}
          height="100%"
          theme="dark"
          extensions={[html()]}
          readOnly
        />
        
        {/* コピーボタン */}
        <button 
          onClick={() => copyToClipboard(generatedCode)}
          className="absolute top-4 right-4 btn-secondary"
        >
          📋 コピー
        </button>
      </div>
      
      {/* 右: プレビュー */}
      <div className="border rounded-lg overflow-hidden">
        {/* デバイス切り替え */}
        <div className="flex gap-2 p-2 border-b bg-gray-50">
          <button onClick={() => setDevice('desktop')}>🖥️</button>
          <button onClick={() => setDevice('tablet')}>📱</button>
          <button onClick={() => setDevice('mobile')}>📱</button>
        </div>
        
        {/* iframe */}
        <iframe
          srcDoc={generatedCode}
          sandbox="allow-scripts allow-same-origin"
          className={cn(
            'w-full h-full',
            device === 'mobile' && 'max-w-[375px] mx-auto'
          )}
        />
      </div>
    </div>
    
    {/* アクションボタン */}
    <div className="flex justify-center gap-4 mt-4">
      <button className="btn-primary">📋 コピー</button>
      <button className="btn-secondary">⬇️ ダウンロード</button>
      <button className="btn-secondary">🔄 別案を生成</button>
      <button className="btn-secondary">💬 調整依頼</button>
    </div>
  </DialogContent>
</Dialog>
```

---

### モバイルレイアウト

```
+──────────────────────+
│  あっちゃんAI 💬      │
│                      │
│  ┌────────────────┐  │
│  │ ✨ パーティクル │  │
│  │                │  │
│  │ 「何を作りたい  │  │
│  │  ですか？」     │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ 👤 ユーザー     │  │
│  │ ECサイト作成... │  │
│  │          12:34  │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ 🤖 あっちゃん   │  │
│  │ いいですね！    │  │
│  │          12:34  │  │
│  └────────────────┘  │
│                      │
│  [メッセージ...][📤]  │
│  💬 残り: 8回        │
└──────────────────────┘
```

---

## 🔐 管理画面

### デザインテーマ: サイバーパンク × ニューロモルフィズム

#### カラーパレット（ダークモード）
```css
--admin-bg: #0F172A;           /* Slate-900 */
--admin-card: #1E293B;         /* Slate-800 */
--admin-accent: #3B82F6;       /* Blue-500 */
--admin-text: #F1F5F9;         /* Slate-100 */
--admin-neon: #00F0FF;         /* ネオンブルー */
```

---

### 1. ログインページ - `/admin/secret-entrance`

```
+──────────────────────────────────────────+
│                                          │
│                                          │
│         ┌─────────────────────┐          │
│         │    🧠                │          │
│         │                     │          │
│         │  あっちゃんの中身を   │          │
│         │    覗いてみる？      │          │
│         │                     │          │
│         │  ┌───────────────┐  │          │
│         │  │ Email         │  │          │
│         │  │ [__________]  │  │          │
│         │  │               │  │          │
│         │  │ Password      │  │          │
│         │  │ [__________]  │  │          │
│         │  │               │  │          │
│         │  │ [  Enter  ]   │  │          │
│         │  └───────────────┘  │          │
│         │                     │          │
│         └─────────────────────┘          │
│                                          │
│                                          │
+──────────────────────────────────────────+
```

#### デザイン特徴
- **グラスモーフィズム**のログインカード
- **ネオン風グロー**エフェクト
- **パルスアニメーション**（脳のアイコン）

```tsx
<div className="login-page min-h-screen bg-admin-bg flex items-center justify-center">
  {/* 背景アニメーション */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="neural-network-animation" />
  </div>
  
  {/* ログインカード */}
  <div className="glass-card relative z-10 p-8 rounded-2xl backdrop-blur-lg border border-admin-neon/20 shadow-[0_0_50px_rgba(0,240,255,0.3)]">
    {/* 脳のアイコン（パルスアニメーション） */}
    <div className="text-center mb-8">
      <div className="text-6xl animate-pulse-glow">🧠</div>
      <h1 className="text-2xl font-bold text-admin-text mt-4">
        あっちゃんの中身を覗いてみる？
      </h1>
    </div>
    
    {/* フォーム */}
    <form className="space-y-4">
      <input 
        type="email" 
        placeholder="Email"
        className="w-full bg-admin-card border border-admin-neon/30 rounded-lg px-4 py-3 text-admin-text focus:border-admin-neon focus:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
      />
      <input 
        type="password" 
        placeholder="Password"
        className="w-full bg-admin-card border border-admin-neon/30 rounded-lg px-4 py-3 text-admin-text"
      />
      <button className="w-full bg-gradient-to-r from-admin-accent to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all">
        Enter
      </button>
    </form>
  </div>
</div>
```

---

### 2. ダッシュボード - `/admin/dashboard`

```
+────────────────────────────────────────────────────────────────────+
│ [🧠 あっちゃん] │ Dashboard │ Conversations │ Visitors │ Settings │
+────────────────────────────────────────────────────────────────────+
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ 👥 今日の訪問  │  │ 💬 チャット数  │  │ 🎨 サイト生成  │            │
│  │              │  │              │  │              │            │
│  │     42       │  │     127      │  │     18       │            │
│  │   (+12 ↗)   │  │   (+23 ↗)   │  │   (+3 ↗)    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ 📧 問い合わせ  │  │ 💰 API コスト  │  │ ⚡ 応答速度   │            │
│  │              │  │              │  │              │            │
│  │      8       │  │  ¥1,234     │  │   1.2s      │            │
│  │   (+2 ↗)    │  │ (残り¥1,766)│  │   (Good)    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  📊 チャット数の推移                                         │  │
│  │                                                             │  │
│  │   [グラフ: 過去30日間のチャット数]                           │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────┐  ┌────────────────────────────┐    │
│  │ 🔥 人気の相談内容          │  │ 🎯 リアルタイム活動         │    │
│  │                          │  │                            │    │
│  │ [ワードクラウド]          │  │ • 田中さんがチャット中...   │    │
│  │                          │  │ • 佐藤さんがサイト生成中... │    │
│  │                          │  │                            │    │
│  └──────────────────────────┘  └────────────────────────────┘    │
│                                                                    │
+────────────────────────────────────────────────────────────────────+
```

#### 統計カード
```tsx
<div className="stats-card bg-admin-card border border-admin-neon/20 rounded-xl p-6 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all">
  <div className="flex items-center justify-between mb-4">
    <div className="text-4xl">👥</div>
    <div className="text-green-400 text-sm flex items-center gap-1">
      +12 <span className="text-lg">↗</span>
    </div>
  </div>
  
  <h3 className="text-admin-text/60 text-sm mb-2">今日の訪問</h3>
  <p className="text-4xl font-bold text-admin-text">42</p>
</div>
```

---

### 3. 会話履歴 - `/admin/conversations`

```
+────────────────────────────────────────────────────────────────────+
│ 🧠 脳内データベース - 会話履歴                                       │
+────────────────────────────────────────────────────────────────────+
│                                                                    │
│  [🔍 検索] [📅 日付] [🏷️ フラグ] [👤 訪問者]                        │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 訪問者    │ 要約           │ メッセージ │ 日時       │ フラグ │ │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ 田中さん  │ ECサイト相談   │ 12件      │ 2026/01/25 │ 🟢    │ │  │
│  │ 佐藤さん  │ アプリ開発     │ 8件       │ 2026/01/25 │ 🔴    │ │  │
│  │ 匿名#123  │ 技術相談       │ 5件       │ 2026/01/24 │ ⚪    │ │  │
│  │ 鈴木さん  │ サイトリニューアル │ 15件  │ 2026/01/24 │ 🟢    │ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [1] [2] [3] ... [10]                                              │
│                                                                    │
+────────────────────────────────────────────────────────────────────+
```

#### 会話詳細（クリック時）
```
+────────────────────────────────────────────────────────────────────+
│ ← 戻る    田中さんとの会話 - ECサイト相談                           │
+────────────────────────────────────────────────────────────────────+
│                                                                    │
│  [🟢 見込みあり]  [メモを追加]                                      │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 👤 田中さん (12:30)                                          │  │
│  │ ECサイトを作りたいです                                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 🤖 あっちゃん (12:31)                                        │  │
│  │ いいですね！どんな商品を扱う予定ですか？                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ...                                                               │
│                                                                    │
│  📝 管理者メモ:                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 予算50万円程度。来月から開発希望。フォローアップ必要。        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
+────────────────────────────────────────────────────────────────────+
```

---

### 4. サイト生成ログ（創作ギャラリー） - `/admin/generated-sites`

```
+────────────────────────────────────────────────────────────────────+
│ 🎨 創作ギャラリー - 生成されたサイト                                 │
+────────────────────────────────────────────────────────────────────+
│                                                                    │
│  [❤️ いいねのみ] [📅 最新順] [👤 訪問者順]                           │
│                                                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │      │
│  │ │[画像] │ │  │ │[画像] │ │  │ │[画像] │ │  │ │[画像] │ │      │
│  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │      │
│  │           │  │           │  │           │  │           │      │
│  │ ECサイト   │  │ カフェHP  │  │ ポートフォリオ │ │ LP      │      │
│  │ 田中さん   │  │ 佐藤さん  │  │ 鈴木さん  │  │ 匿名#123  │      │
│  │           │  │           │  │           │  │           │      │
│  │ [❤️ 5]    │  │ [❤️]      │  │ [❤️ 3]    │  │ [❤️]      │      │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘      │
│                                                                    │
+────────────────────────────────────────────────────────────────────+
```

---

## アニメーション仕様（GSAP）

### 1. ページロードアニメーション
```typescript
// トップページ
gsap.timeline()
  .from('.hero-title', {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: 'power3.out'
  })
  .from('.hero-subtitle', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=0.5')
  .from('.chat-container', {
    opacity: 0,
    scale: 0.95,
    duration: 1,
    ease: 'back.out(1.2)'
  }, '-=0.5');
```

### 2. メッセージ追加アニメーション
```typescript
gsap.from('.new-message', {
  opacity: 0,
  y: 20,
  scale: 0.95,
  duration: 0.4,
  ease: 'power2.out'
});
```

### 3. プレビューモーダル展開
```typescript
gsap.timeline()
  .from('.preview-modal', {
    opacity: 0,
    scale: 0.8,
    duration: 0.5,
    ease: 'back.out(1.5)'
  })
  .from('.preview-code', {
    x: -50,
    opacity: 0,
    duration: 0.4
  }, '-=0.2')
  .from('.preview-frame', {
    x: 50,
    opacity: 0,
    duration: 0.4
  }, '-=0.4');
```

### 4. ホバーエフェクト
```typescript
// ボタンホバー
gsap.to('.btn-primary:hover', {
  scale: 1.05,
  boxShadow: '0 10px 30px rgba(59,130,246,0.4)',
  duration: 0.3,
  ease: 'power2.out'
});

// カードホバー
gsap.to('.card:hover', {
  y: -5,
  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  duration: 0.3
});
```

---

## レスポンシブブレークポイント

```typescript
const breakpoints = {
  sm: '640px',   // モバイル（大）
  md: '768px',   // タブレット
  lg: '1024px',  // デスクトップ（小）
  xl: '1280px',  // デスクトップ（大）
  '2xl': '1536px' // ワイドスクリーン
};
```

### モバイル最適化
- チャット入力欄を画面下部に固定
- サイトプレビューはタブ切り替え（コード/プレビュー）
- 統計カードは1カラム表示
- テーブルはカード形式に変更

---

## アクセシビリティ

### キーボード操作
- `Tab`: フォーカス移動
- `Enter`: メッセージ送信
- `Ctrl + /`: 検索フォーカス（管理画面）
- `Esc`: モーダルを閉じる

### ARIA属性
```tsx
<button 
  aria-label="メッセージを送信"
  aria-disabled={!message}
>
  送信
</button>

<div 
  role="region" 
  aria-label="チャットメッセージ"
  aria-live="polite"
>
  {messages}
</div>
```

---

## パフォーマンス最適化

### 画像最適化
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="あっちゃんAI"
  width={100}
  height={100}
  priority
/>
```

### コード分割
```tsx
// 重いコンポーネントは動的インポート
const ParticleBackground = dynamic(
  () => import('@/components/animations/ParticleBackground'),
  { ssr: false }
);
```

### メモ化
```tsx
const MemoizedMessage = React.memo(ChatMessage);
```

---

**完成！** これで完全に作り直した設計書が揃いました！ 🎉

次は実装に移りますか？それとも何か調整したいところはありますか？
