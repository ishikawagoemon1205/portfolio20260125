import { createAdminClient } from '@/lib/supabase/server';
import type { CharacterPattern } from '@/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export interface CharacterInfo {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  greeting: string | null;
  acknowledgment: string | null;
  surprise: string | null;
  question: string | null;
  proposal: string | null;
  agreement: string | null;
  thinking: string | null;
  encouragement: string | null;
  gratitude: string | null;
  closing: string | null;
  sentenceEnding: string | null;
  particles: string | null;
  emojiStyle: string | null;
}

/**
 * アクティブなキャラクターパターン一覧を取得
 */
export async function getActiveCharacterPatterns(): Promise<CharacterPattern[]> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data, error } = await supabase
    .from('character_patterns')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch character patterns:', error);
    return [];
  }

  return data || [];
}

/**
 * ランダムでキャラクターパターンを選択
 */
export async function selectRandomCharacter(): Promise<CharacterInfo | null> {
  const patterns = await getActiveCharacterPatterns();

  if (patterns.length === 0) {
    return null;
  }

  // ランダム選択（均等な確率）
  const randomIndex = Math.floor(Math.random() * patterns.length);
  return mapToCharacterInfo(patterns[randomIndex]);
}

/**
 * IDでキャラクターパターンを取得
 */
export async function getCharacterById(id: string): Promise<CharacterInfo | null> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data, error } = await supabase
    .from('character_patterns')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Failed to fetch character by id:', error);
    return null;
  }

  return mapToCharacterInfo(data);
}

/**
 * 会話に割り当てられたキャラクターを取得、なければ新規割り当て
 */
export async function getOrAssignCharacter(
  conversationId: string
): Promise<CharacterInfo | null> {
  const supabase: AnySupabaseClient = await createAdminClient();

  // まず既存の割り当てをチェック
  const { data: conversation } = await supabase
    .from('conversations')
    .select('character_pattern_id')
    .eq('id', conversationId)
    .single();

  if (conversation?.character_pattern_id) {
    // 既に割り当て済み
    return getCharacterById(conversation.character_pattern_id);
  }

  // 新規割り当て
  const character = await selectRandomCharacter();
  if (!character) {
    return null;
  }

  // 会話に紐づけ
  await supabase
    .from('conversations')
    .update({ character_pattern_id: character.id })
    .eq('id', conversationId);

  return character;
}

/**
 * CharacterPattern → CharacterInfo に変換
 */
function mapToCharacterInfo(pattern: CharacterPattern): CharacterInfo {
  return {
    id: pattern.id,
    name: pattern.name,
    description: pattern.description || '',
    theme: pattern.tone || 'friendly',
    greeting: 'こんにちは！',
    acknowledgment: 'なるほど',
    surprise: 'おお！',
    question: 'ですか？',
    proposal: 'いかがでしょうか',
    agreement: 'そうですね',
    thinking: 'うーん',
    encouragement: '頑張りましょう！',
    gratitude: 'ありがとうございます',
    closing: 'よろしくお願いします',
    sentenceEnding: 'です・ます',
    particles: 'よ・ね・な',
    emojiStyle: pattern.emoji_usage || 'moderate',
  };
}

/**
 * キャラクターパターンをプロンプト用に変換
 */
export function formatCharacterForPrompt(character: CharacterInfo): string {
  const lines: string[] = [
    '【あなたのキャラクター設定】',
    `テーマ: ${character.theme || '穏やかで優しい'}`,
    '',
    '【シーン別の話し方の例】',
  ];

  if (character.greeting) {
    lines.push(`挨拶: 「${character.greeting}」`);
  }
  if (character.acknowledgment) {
    lines.push(`相槌: 「${character.acknowledgment}」`);
  }
  if (character.surprise) {
    lines.push(`驚き: 「${character.surprise}」`);
  }
  if (character.question) {
    lines.push(`質問: 「${character.question}」`);
  }
  if (character.proposal) {
    lines.push(`提案: 「${character.proposal}」`);
  }
  if (character.agreement) {
    lines.push(`了承: 「${character.agreement}」`);
  }
  if (character.thinking) {
    lines.push(`考え中: 「${character.thinking}」`);
  }
  if (character.encouragement) {
    lines.push(`励まし: 「${character.encouragement}」`);
  }
  if (character.gratitude) {
    lines.push(`感謝: 「${character.gratitude}」`);
  }
  if (character.closing) {
    lines.push(`締め: 「${character.closing}」`);
  }

  lines.push('');
  lines.push('【口調の特徴】');

  if (character.sentenceEnding) {
    lines.push(`語尾: ${character.sentenceEnding}`);
  }
  if (character.particles) {
    lines.push(`感嘆詞: ${character.particles}`);
  }
  if (character.emojiStyle) {
    lines.push(`使う絵文字: ${character.emojiStyle}`);
  }

  return lines.join('\n');
}
