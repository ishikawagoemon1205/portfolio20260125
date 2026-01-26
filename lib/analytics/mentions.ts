/**
 * 会話分析・言及記録
 * 
 * チャット内でのプロフィール項目への言及を追跡し、
 * どの話題が反応が良いか分析するための機能
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { ProfileMention } from '@/types/database.types';

/**
 * 言及記録リクエスト
 */
export interface RecordMentionRequest {
  conversationId: string;
  messageId: string;
  profileItemCategory: string;
  profileItemKey: string;
  visitorReaction?: string;
  reactionSentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * 言及を記録
 */
export async function recordMention(request: RecordMentionRequest): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { error } = await (supabase as any)
    .from('profile_mentions')
    .insert({
      conversation_id: request.conversationId,
      message_id: request.messageId,
      profile_item_category: request.profileItemCategory,
      profile_item_key: request.profileItemKey,
      visitor_reaction: request.visitorReaction,
      reaction_sentiment: request.reactionSentiment,
    });
  
  if (error) {
    console.error('言及記録エラー:', error);
    return false;
  }
  
  return true;
}

/**
 * プロフィール項目ごとの言及統計
 */
export interface MentionStats {
  category: string;
  key: string;
  totalMentions: number;
  positiveReactions: number;
  negativeReactions: number;
  neutralReactions: number;
  reactionRate: number; // 言及に対する反応率
  positiveRate: number; // 反応のうちポジティブの割合
}

/**
 * 言及統計を取得
 */
export async function getMentionStats(): Promise<MentionStats[]> {
  const supabase = createAdminClient();
  
  // 言及データを取得
  const { data: mentions, error: mentionError } = await (supabase as any)
    .from('profile_mentions')
    .select('profile_item_category, profile_item_key, reaction_sentiment');
  
  if (mentionError) {
    console.error('言及データ取得エラー:', mentionError);
    return [];
  }
  
  if (!mentions || mentions.length === 0) {
    return [];
  }
  
  // 統計を計算（category + key でグループ化）
  const statsMap = new Map<string, MentionStats>();
  
  // 言及をカウント
  for (const mention of mentions as ProfileMention[]) {
    const mapKey = `${mention.profile_item_category}:${mention.profile_item_key}`;
    
    let stats = statsMap.get(mapKey);
    if (!stats) {
      stats = {
        category: mention.profile_item_category,
        key: mention.profile_item_key,
        totalMentions: 0,
        positiveReactions: 0,
        negativeReactions: 0,
        neutralReactions: 0,
        reactionRate: 0,
        positiveRate: 0,
      };
      statsMap.set(mapKey, stats);
    }
    
    stats.totalMentions++;
    
    if (mention.reaction_sentiment) {
      switch (mention.reaction_sentiment) {
        case 'positive':
          stats.positiveReactions++;
          break;
        case 'negative':
          stats.negativeReactions++;
          break;
        case 'neutral':
          stats.neutralReactions++;
          break;
      }
    }
  }
  
  // 率を計算
  const result: MentionStats[] = [];
  for (const stats of statsMap.values()) {
    const totalReactions = stats.positiveReactions + stats.negativeReactions + stats.neutralReactions;
    stats.reactionRate = stats.totalMentions > 0 ? totalReactions / stats.totalMentions : 0;
    stats.positiveRate = totalReactions > 0 ? stats.positiveReactions / totalReactions : 0;
    result.push(stats);
  }
  
  // ポジティブ率でソート
  result.sort((a, b) => b.positiveRate - a.positiveRate);
  
  return result;
}

/**
 * 人気のプロフィール項目を取得
 */
export async function getPopularProfileItems(limit: number = 5): Promise<MentionStats[]> {
  const stats = await getMentionStats();
  
  // ポジティブ反応数 × ポジティブ率 でスコア計算
  const scored = stats.map(s => ({
    ...s,
    score: s.positiveReactions * s.positiveRate,
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit);
}

/**
 * 改善が必要なプロフィール項目を取得
 */
export async function getUnderperformingProfileItems(limit: number = 5): Promise<MentionStats[]> {
  const stats = await getMentionStats();
  
  // 言及されているがネガティブ率が高いもの
  const underperforming = stats.filter(s => 
    s.totalMentions >= 3 && 
    s.negativeReactions > s.positiveReactions
  );
  
  underperforming.sort((a, b) => b.negativeReactions - a.negativeReactions);
  
  return underperforming.slice(0, limit);
}

/**
 * カテゴリごとの言及サマリー
 */
export interface CategorySummary {
  category: string;
  totalMentions: number;
  positiveReactions: number;
  avgPositiveRate: number;
}

export async function getCategorySummary(): Promise<CategorySummary[]> {
  const stats = await getMentionStats();
  
  const categoryMap = new Map<string, CategorySummary>();
  
  for (const stat of stats) {
    const existing = categoryMap.get(stat.category);
    if (existing) {
      existing.totalMentions += stat.totalMentions;
      existing.positiveReactions += stat.positiveReactions;
    } else {
      categoryMap.set(stat.category, {
        category: stat.category,
        totalMentions: stat.totalMentions,
        positiveReactions: stat.positiveReactions,
        avgPositiveRate: 0,
      });
    }
  }
  
  const result: CategorySummary[] = [];
  for (const summary of categoryMap.values()) {
    // 同じカテゴリのポジティブ率の平均を計算
    const categoryStats = stats.filter(s => s.category === summary.category);
    const avgRate = categoryStats.reduce((sum, s) => sum + s.positiveRate, 0) / categoryStats.length;
    summary.avgPositiveRate = avgRate;
    result.push(summary);
  }
  
  result.sort((a, b) => b.avgPositiveRate - a.avgPositiveRate);
  
  return result;
}
