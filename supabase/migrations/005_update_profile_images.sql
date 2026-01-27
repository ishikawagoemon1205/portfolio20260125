-- profile_imagesテーブルのカラム名を変更
-- url → image_url に変更し、storage_pathカラムを追加

-- カラム名変更（urlが存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_images' AND column_name = 'url'
  ) THEN
    ALTER TABLE profile_images RENAME COLUMN url TO image_url;
  END IF;
END $$;

-- storage_pathカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_images' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE profile_images ADD COLUMN storage_path TEXT;
  END IF;
END $$;

-- RLSポリシーを設定（まだ設定されていない場合）
ALTER TABLE profile_images ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除して再作成
DROP POLICY IF EXISTS "Public read access" ON profile_images;
DROP POLICY IF EXISTS "Authenticated write" ON profile_images;

CREATE POLICY "Public read access" ON profile_images
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write" ON profile_images
  FOR ALL USING (auth.role() = 'authenticated');

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profile_images_active ON profile_images(is_active);
CREATE INDEX IF NOT EXISTS idx_profile_images_category ON profile_images(category);
