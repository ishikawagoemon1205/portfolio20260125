import { createAdminClient } from '@/lib/supabase/server';
import type { ProfileImage } from '@/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export interface AvatarInfo {
  url: string;
  altText: string;
}

/**
 * アクティブなプロフィール画像一覧を取得
 */
export async function getActiveAvatars(): Promise<ProfileImage[]> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data, error } = await supabase
    .from('profile_images')
    .select('*')
    .eq('is_active', true)
    .order('weight', { ascending: false });

  if (error) {
    console.error('Failed to fetch profile images:', error);
    return [];
  }

  return data || [];
}

/**
 * 重み付きランダムでアバター画像を選択
 * メッセージごとにランダム表示
 */
export async function getRandomAvatar(): Promise<AvatarInfo | null> {
  const avatars = await getActiveAvatars();

  if (avatars.length === 0) {
    return null;
  }

  // 重み付きランダム選択
  const totalWeight = avatars.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;

  for (const avatar of avatars) {
    random -= avatar.weight;
    if (random <= 0) {
      return {
        url: avatar.image_url,
        altText: avatar.alt_text || 'あっちゃん',
      };
    }
  }

  // フォールバック
  return {
    url: avatars[0].image_url,
    altText: avatars[0].alt_text || 'あっちゃん',
  };
}

/**
 * カテゴリ指定でアバターを取得
 */
export async function getAvatarByCategory(
  category: 'normal' | 'smiling' | 'thinking'
): Promise<AvatarInfo | null> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data, error } = await supabase
    .from('profile_images')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .order('weight', { ascending: false });

  if (error || !data || data.length === 0) {
    // フォールバック: 全カテゴリからランダム
    return getRandomAvatar();
  }

  // 重み付きランダム選択
  const totalWeight = data.reduce((sum: number, a: ProfileImage) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;

  for (const avatar of data) {
    random -= avatar.weight;
    if (random <= 0) {
      return {
        url: avatar.image_url,
        altText: avatar.alt_text || 'あっちゃん',
      };
    }
  }

  return {
    url: data[0].image_url,
    altText: data[0].alt_text || 'あっちゃん',
  };
}
