import { createAdminClient } from '@/lib/supabase/server';
import type { ProfileData } from '@/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

// プロフィールカテゴリの型定義
export type ProfileCategory = 'basic' | 'skills' | 'experience' | 'portfolio' | 'hobbies' | 'recent';

export interface ProfileItem {
  id: string;
  category: ProfileCategory;
  key: string;
  value: string;
  priority: number;
  updatedAt: Date;
}

/**
 * チャット表示用のプロフィールデータを取得
 */
export async function getChatProfile(): Promise<ProfileItem[]> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data, error } = await supabase
    .from('profile_data')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch profile data:', error);
    return [];
  }

  return (data || []).map((item: ProfileData) => ({
    id: item.id,
    category: item.category as ProfileCategory,
    key: item.key,
    value: item.value,
    priority: item.display_order || item.weight || 1,
    updatedAt: new Date(item.updated_at),
  }));
}

/**
 * カテゴリ別にプロフィールデータを取得
 */
export async function getProfileByCategory(
  category: ProfileCategory
): Promise<ProfileItem[]> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data, error } = await supabase
    .from('profile_data')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch profile by category:', error);
    return [];
  }

  return (data || []).map((item: ProfileData) => ({
    id: item.id,
    category: item.category as ProfileCategory,
    key: item.key,
    value: item.value,
    priority: item.display_order || item.weight || 1,
    updatedAt: new Date(item.updated_at),
  }));
}

/**
 * 更新順ベースの優先度計算
 * 確率配分:
 * - 最新（1日以内）: 50%
 * - 3日前: 30%
 * - 1週間前: 15%
 * - 1ヶ月前: 4%
 * - 3ヶ月前: 1%
 */
export function calculateRecencyWeight(updatedAt: Date): number {
  const now = Date.now();
  const updateTime = updatedAt.getTime();
  const daysSinceUpdate = (now - updateTime) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate <= 1) return 50;
  if (daysSinceUpdate <= 3) return 30;
  if (daysSinceUpdate <= 7) return 15;
  if (daysSinceUpdate <= 30) return 4;
  return 1;
}

/**
 * 更新順 + 優先度を考慮したプロフィールアイテム選択
 */
export function selectProfileItemByRecency(items: ProfileItem[]): ProfileItem | null {
  if (items.length === 0) return null;

  // 各アイテムに重みを計算
  const weightedItems = items.map(item => {
    const recencyWeight = calculateRecencyWeight(item.updatedAt);
    // 元の優先度（0-100）も加味
    const combinedWeight = recencyWeight * (item.priority / 100);
    return { item, weight: Math.max(combinedWeight, 0.1) }; // 最低0.1
  });

  // 重み付きランダム選択
  const totalWeight = weightedItems.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { item, weight } of weightedItems) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }

  // フォールバック
  return items[0];
}

/**
 * プロンプト用にプロフィールを自然言語形式に変換
 * カテゴリを動的に処理し、全てのカテゴリを出力
 */
export function formatProfileForPrompt(items: ProfileItem[]): string {
  const categories: Record<string, ProfileItem[]> = {};
  
  for (const item of items) {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  }

  // カテゴリ名の日本語マッピング
  const categoryLabels: Record<string, string> = {
    'basic': '基本情報',
    'skills': 'スキル',
    'hobbies': '趣味・個性',
    'recent_updates': '最近の出来事',
    'achievements': '実績',
    'personality': '性格・価値観',
    'food': '食べ物・飲み物',
    '食べ物・飲み物': '食べ物・飲み物',
    '趣味': '趣味',
    '仕事': '仕事',
    '学び': '学び',
  };

  const sections: string[] = [];

  // 全カテゴリを動的に処理
  for (const [categoryKey, categoryItems] of Object.entries(categories)) {
    const label = categoryLabels[categoryKey] || categoryKey;
    // keyが質問形式の場合、valueに実際の情報が含まれる
    // 知識判定では、どの話題について情報があるかを明示的にする
    const content = categoryItems.map(i => {
      // keyを話題として抽出、valueを内容として表示
      return `- ${i.key}\n  内容: ${i.value}`;
    }).join('\n');
    sections.push(`【${label}】\n${content}`);
  }

  return sections.join('\n\n');
}

/**
 * ランダムに話題にするプロフィール項目を選択
 */
export async function getRandomProfileTopic(): Promise<ProfileItem | null> {
  const items = await getChatProfile();
  return selectProfileItemByRecency(items);
}
