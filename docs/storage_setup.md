# Supabase Storage セットアップ手順

記事エディターで画像をアップロードするには、Supabase Storageにバケットを作成する必要があります。

## バケット作成手順

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニューから **Storage** を選択
4. **New bucket** ボタンをクリック
5. 以下の設定でバケットを作成：
   - **Name**: `portfolio20260125`
   - **Public bucket**: ✅ チェックを入れる（パブリックアクセスを有効化）
6. **Create bucket** をクリック

## RLS（Row Level Security）ポリシーの設定

バケット作成後、以下のポリシーを設定します：

### 1. 公開読み取りポリシー

1. 作成した `portfolio20260125` バケットをクリック
2. **Policies** タブを選択
3. **New policy** をクリック
4. **For full customization** を選択
5. 以下の内容で設定：
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: `true`
6. **Save policy** をクリック

### 2. 認証ユーザーの書き込みポリシー

1. **New policy** をクリック
2. **For full customization** を選択
3. 以下の内容で設定：
   - **Policy name**: `Authenticated users can upload`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**: `true`
4. **Save policy** をクリック

### 3. 認証ユーザーの削除ポリシー（オプション）

1. **New policy** をクリック
2. **For full customization** を選択
3. 以下の内容で設定：
   - **Policy name**: `Authenticated users can delete`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: `true`
4. **Save policy** をクリック

## 設定完了の確認

設定が完了したら、以下を確認してください：

1. バケット名が `portfolio20260125` であること
2. バケットが「Public」として表示されていること
3. 3つのRLSポリシーが設定されていること

これで記事エディターから画像をアップロードできるようになります。
