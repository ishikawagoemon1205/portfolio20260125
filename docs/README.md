# 設計資料 v2.0 - あっちゃんAI

**AIコンシェルジュ搭載の次世代ポートフォリオサイト**

---

## 🚀 プロジェクト概要

訪問者が「あっちゃんAI」と対話することで、開発相談からサイト生成まで体験できる、
インタラクティブな開発者ポートフォリオ。

### コンセプト
> 「見るだけ」のポートフォリオから、「使える・体験できる」ポートフォリオへ

---

## 📁 ドキュメント構成

### ✅ 完成した設計書

| ファイル | 内容 | 重要度 |
|---------|------|-------|
| **[01_requirements_v2.md](./01_requirements_v2.md)** | 要件定義書 | ⭐⭐⭐ |
| **[02_technical_specification_v2.md](./02_technical_specification_v2.md)** | 技術仕様書 | ⭐⭐⭐ |
| **[04_ui_design_v2.md](./04_ui_design_v2.md)** | UI設計書 | ⭐⭐⭐ |

### 📝 旧バージョン（参考）
- `01_requirements.md` - 旧要件定義書
- `02_technical_specification.md` - 旧技術仕様書
- `03_profile_content.md` - プロフィール内容（参考）
- `04_ui_design.md` - 旧UI設計書
- `05_implementation_plan.md` - 旧実装計画

---

## 🎯 主要機能

### 1. あっちゃんAI（メイン機能）
- ✅ リアルタイムチャット（ストリーミング）
- ✅ 訪問者ごとの会話記憶
- ✅ 名前でパーソナライズ（「田中さん、おかえりなさい！」）
- ✅ HTML/CSS/JavaScript コード生成
- ✅ リアルタイムプレビュー表示
- ✅ Tier制使用制限（悪用対策）

### 2. 超こだわりUI
- ✅ **GSAP** による滑らかなアニメーション
- ✅ パーティクルエフェクト背景
- ✅ タイピングエフェクト
- ✅ マイクロインタラクション
- ✅ グラスモーフィズム × ニューロモルフィズム

### 3. 管理画面（「あっちゃんの中身」）
- ✅ 会話履歴の閲覧・管理
- ✅ 訪問者情報の確認
- ✅ サイト生成ログ（創作ギャラリー）
- ✅ AI設定編集
- ✅ コスト・使用量モニタリング
- ✅ サイバーパンク風ダークモードUI

---

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **GSAP** ⭐（アニメーション）
- **tsparticles**（パーティクル効果）
- **shadcn/ui**（UIコンポーネント）
- **CodeMirror**（コードエディタ）

### バックエンド
- **Next.js API Routes / Server Actions**
- **Supabase**（PostgreSQL + 認証）
- **Supabase Vector**（RAG）
- **OpenAI API**（GPT-4o / GPT-4o-mini）
- **Vercel AI SDK**
- **Upstash Redis**（Rate Limiting）

### インフラ
- **Vercel**（ホスティング）
- **Supabase**（データベース）
- **Upstash**（Redis）

---

## 💰 コスト試算

### 開発コスト
- **時間**: 4-6週間（フルタイム）
- **金銭**: $0（自己開発）

### 運用コスト（月額）
| 項目 | コスト |
|------|-------|
| OpenAI API | ¥1,500-3,000 |
| Supabase | ¥0（無料枠） |
| Vercel | ¥0（無料枠） |
| Upstash Redis | ¥0（無料枠） |
| **合計** | **¥1,500-3,000** |

制限機能により、予算内に収まるよう管理！

---

## 📊 開発フェーズ

### Phase 1: MVP（2-3週間）
1. 基本チャット機能
2. 訪問者識別（Cookie）
3. 使用制限（シンプル版）
4. サイト生成（HTML/CSS/JS）
5. プレビュー表示
6. 管理画面（基本）

### Phase 2: UI強化（1-2週間）
1. GSAP アニメーション実装
2. パーティクルエフェクト
3. タイピングエフェクト
4. マイクロインタラクション
5. レスポンシブ対応

### Phase 3: 高度化（1-2週間）
1. RAG実装（長期記憶）
2. Tier制の完全実装
3. 管理画面UI強化
4. データビジュアライゼーション
5. モニタリング機能

### Phase 4: 最適化（1週間）
1. パフォーマンスチューニング
2. SEO対策
3. エラーハンドリング
4. テスト
5. デプロイ

---

## 🎨 デザインの方向性

### 公開ページ
- **テーマ**: 未来的でミニマル、でも温かみのあるAI体験
- **カラー**: ブルー系（#3B82F6）+ パープル（#8B5CF6）
- **エフェクト**: パーティクル、タイピング、GSAP
- **フォント**: Inter, Noto Sans JP, JetBrains Mono

### 管理画面
- **テーマ**: サイバーパンク × ニューロモルフィズム
- **カラー**: ダークモード（#0F172A）+ ネオンブルー（#00F0FF）
- **エフェクト**: グロー、パルス、グラスモーフィズム

---

## 🔐 セキュリティ

### 訪問者識別
- Cookie + Browser Fingerprint
- ログイン不要でパーソナライズ

### 使用制限
- **Tier 1（匿名）**: 1日5メッセージ
- **Tier 2（名前登録）**: 1日10メッセージ + サイト生成
- **Tier 3（メール登録）**: 1日30メッセージ
- **Tier 4（問い合わせ済み）**: 無制限

### 悪用対策
- Upstash Redis による Rate Limiting
- IP制限・異常検知
- Bot検知（行動分析）
- Row Level Security（RLS）

---

## 📚 各ドキュメントの概要

### 1. [要件定義書 v2.0](./01_requirements_v2.md)

**内容:**
- プロジェクト概要・コンセプト
- 目的（受託案件獲得、訪問者への価値提供、差別化）
- 機能要件
  - あっちゃんAI（チャット、識別、サイト生成、制限）
  - UI/UX（GSAP、パーティクル、アニメーション）
  - 管理画面（会話履歴、訪問者管理、サイト生成ログ、AI設定）
- 非機能要件（パフォーマンス、セキュリティ、スケーラビリティ）
- ユーザーストーリー

**こんな人におすすめ:**
- プロジェクト全体を理解したい
- 何を作るのか知りたい
- ステークホルダーへの説明資料として

---

### 2. [技術仕様書 v2.0](./02_technical_specification_v2.md)

**内容:**
- 技術スタック（詳細）
- システム構成図
- ディレクトリ構造
- データベース設計（8テーブル + RLS設定）
- API設計（チャット、サイト生成、訪問者識別）
- OpenAI API使用方法（システムプロンプト、RAG）
- GSAP アニメーション実装
- Rate Limiting（Upstash Redis）
- 環境変数設定
- デプロイ設定

**こんな人におすすめ:**
- 実装を始める前に読む
- 技術的な詳細を知りたい
- データベース設計を確認したい

---

### 3. [UI設計書 v2.0](./04_ui_design_v2.md)

**内容:**
- デザインコンセプト
- カラーパレット
- タイポグラフィ
- 画面設計（ワイヤーフレーム）
  - トップページ（チャット画面）
  - サイト生成プレビュー
  - 管理画面（ログイン、ダッシュボード、会話履歴、サイト生成ログ）
- アニメーション仕様（GSAP）
- レスポンシブ設計
- アクセシビリティ
- パフォーマンス最適化

**こんな人におすすめ:**
- デザイン・UI実装を担当する
- アニメーションの仕様を知りたい
- ユーザー体験を理解したい

---

## 🚦 次のステップ

### 1. 環境構築（今すぐできる！）
```bash
# パッケージインストール
npm install

# 必要なライブラリ追加
npm install @supabase/supabase-js @supabase/ssr
npm install openai ai
npm install gsap @gsap/react
npm install @tsparticles/react @tsparticles/slim
npm install @uiw/react-codemirror
npm install @upstash/redis @upstash/ratelimit
```

### 2. Supabase セットアップ
1. [Supabase](https://supabase.com/) でプロジェクト作成
2. データベーステーブル作成（SQL実行）
3. Row Level Security（RLS）設定
4. 環境変数設定

### 3. OpenAI API セットアップ
1. [OpenAI Platform](https://platform.openai.com/) でAPIキー取得
2. `.env.local` に追加

### 4. Upstash Redis セットアップ
1. [Upstash](https://upstash.com/) でRedis作成
2. REST URL・Token取得
3. `.env.local` に追加

### 5. 実装開始！
- Phase 1から順番に進める
- または、特定の機能から実装

---

## 💡 Tips

### デバッグ・開発時
```bash
# 開発サーバー起動
npm run dev

# TypeScript型チェック
npm run type-check

# Linter
npm run lint
```

### 本番デプロイ（Vercel）
```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ
vercel

# 本番環境
vercel --prod
```

---

## 📞 サポート・質問

設計について不明点があれば、各ドキュメントを参照してください：

- **要件がわからない** → [要件定義書](./01_requirements_v2.md)
- **技術的な実装方法** → [技術仕様書](./02_technical_specification_v2.md)
- **UIデザイン・アニメーション** → [UI設計書](./04_ui_design_v2.md)

---

## 🎉 Let's Build!

すべての設計が完了しました！
あとは実装するだけです。

**素晴らしいプロジェクトを作りましょう！** 🚀✨

---

**作成日**: 2026年1月25日  
**バージョン**: 2.0  
**作成者**: GitHub Copilot × 石川敦大
