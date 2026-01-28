/**
 * サジェスト質問取得API
 * 
 * 動的プロフィールからランダムに1つの質問を生成
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// 質問テンプレート（カテゴリに応じた質問文を生成）
const questionTemplates: Record<string, string[]> = {
  food: [
    '🍽 {key}について教えて！',
    '🍽 {key}が気になります！',
  ],
  hobbies: [
    '🎮 {key}について聞きたい！',
    '🎮 {key}のこと教えて！',
  ],
  recent_updates: [
    '⭐ {key}について詳しく！',
    '⭐ 最近の{key}は？',
  ],
  achievements: [
    '🏆 {key}について教えて！',
    '🏆 {key}のこと聞きたい！',
  ],
  personality: [
    '💭 {key}について聞きたい！',
  ],
  skills: [
    '💻 {key}について教えて！',
  ],
  skill: [
    '💻 {key}について教えて！',
  ],
  experience: [
    '📈 {key}について詳しく！',
  ],
  work: [
    '💼 {key}について教えて！',
  ],
};

// デフォルトテンプレート
const defaultTemplates = [
  '🎯 {key}について教えて！',
  '💡 {key}のこと聞きたい！',
];

// カテゴリごとの絵文字
const categoryEmojis: Record<string, string> = {
  food: '🍽',
  hobbies: '🎮',
  recent_updates: '⭐',
  achievements: '🏆',
  personality: '💭',
  skills: '💻',
  skill: '💻',
  experience: '📈',
  work: '💼',
};

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // 有効な動的プロフィールを取得（ランダムに1件）
    const { data: items, error } = await (supabase as any)
      .from('profile_data')
      .select('category, key')
      .eq('is_active', true);
    
    if (error || !items || items.length === 0) {
      return NextResponse.json({ question: null });
    }
    
    // ランダムに1件選択
    const randomIndex = Math.floor(Math.random() * items.length);
    const selectedItem = items[randomIndex];
    
    // 質問文を生成
    const templates = questionTemplates[selectedItem.category] || defaultTemplates;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // keyが質問形式の場合はそのまま使用、そうでなければテンプレートを適用
    let question: string;
    if (selectedItem.key.includes('？') || selectedItem.key.includes('?')) {
      // 質問形式のkeyはそのまま使用（絵文字は削除）
      question = selectedItem.key.replace(/^[\p{Emoji}\p{Emoji_Component}\s]+/u, '').trim();
    } else {
      // テンプレートを適用（テンプレート内の絵文字も削除）
      const questionText = template.replace('{key}', selectedItem.key);
      question = questionText.replace(/^[\p{Emoji}\p{Emoji_Component}\s]+/u, '').trim();
    }
    
    return NextResponse.json({ 
      question,
      category: selectedItem.category,
    });
  } catch (error) {
    console.error('サジェスト質問取得エラー:', error);
    return NextResponse.json({ question: null });
  }
}
