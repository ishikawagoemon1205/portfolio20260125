/**
 * 会話分析
 * 
 * 会話の傾向、コンバージョン率、ユーザー行動などを分析
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Conversation, Message, Visitor, GeneratedSite } from '@/types/database.types';

/**
 * 期間指定
 */
export type Period = 'today' | 'week' | 'month' | 'all';

/**
 * 期間の開始日を取得
 */
function getPeriodStartDate(period: Period): string | null {
  const now = new Date();
  
  switch (period) {
    case 'today':
      now.setHours(0, 0, 0, 0);
      return now.toISOString();
    case 'week':
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case 'month':
      now.setMonth(now.getMonth() - 1);
      return now.toISOString();
    case 'all':
      return null;
  }
}

/**
 * ダッシュボード統計
 */
export interface DashboardStats {
  totalVisitors: number;
  totalConversations: number;
  totalMessages: number;
  totalSitesGenerated: number;
  conversionsToInquiry: number;
  conversionRate: number;
  avgMessagesPerConversation: number;
  activeVisitors: number; // 24時間以内
}

/**
 * ダッシュボード統計を取得
 */
export async function getDashboardStats(period: Period = 'all'): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const startDate = getPeriodStartDate(period);
  
  // 各統計を並列で取得
  const [
    visitorsResult,
    conversationsResult,
    messagesResult,
    sitesResult,
    activeVisitorsResult,
  ] = await Promise.all([
    // 訪問者数
    startDate
      ? (supabase as any).from('visitors').select('id', { count: 'exact' }).gte('created_at', startDate)
      : (supabase as any).from('visitors').select('id', { count: 'exact' }),
    
    // 会話数
    startDate
      ? (supabase as any).from('conversations').select('id, converted_to_inquiry', { count: 'exact' }).gte('created_at', startDate)
      : (supabase as any).from('conversations').select('id, converted_to_inquiry', { count: 'exact' }),
    
    // メッセージ数
    startDate
      ? (supabase as any).from('messages').select('id', { count: 'exact' }).gte('created_at', startDate)
      : (supabase as any).from('messages').select('id', { count: 'exact' }),
    
    // 生成サイト数
    startDate
      ? (supabase as any).from('generated_sites').select('id', { count: 'exact' }).gte('created_at', startDate)
      : (supabase as any).from('generated_sites').select('id', { count: 'exact' }),
    
    // アクティブ訪問者（24時間以内）
    (supabase as any)
      .from('visitors')
      .select('id', { count: 'exact' })
      .gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);
  
  const totalVisitors = visitorsResult.count || 0;
  const totalConversations = conversationsResult.count || 0;
  const totalMessages = messagesResult.count || 0;
  const totalSitesGenerated = sitesResult.count || 0;
  const activeVisitors = activeVisitorsResult.count || 0;
  
  // コンバージョン数を計算（問い合わせ送信済みのステータスをカウント）
  const conversions = conversationsResult.data?.filter(
    (c: Conversation) => c.status === 'inquiry_submitted'
  ).length || 0;
  
  const conversionRate = totalConversations > 0 ? conversions / totalConversations : 0;
  const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
  
  return {
    totalVisitors,
    totalConversations,
    totalMessages,
    totalSitesGenerated,
    conversionsToInquiry: conversions,
    conversionRate,
    avgMessagesPerConversation,
    activeVisitors,
  };
}

/**
 * 時間帯別アクセス統計
 */
export interface HourlyStats {
  hour: number;
  messageCount: number;
  visitorCount: number;
}

export async function getHourlyStats(period: Period = 'week'): Promise<HourlyStats[]> {
  const supabase = createAdminClient();
  const startDate = getPeriodStartDate(period);
  
  // メッセージを取得
  let query = (supabase as any).from('messages').select('created_at');
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  
  const { data: messages, error } = await query;
  
  if (error || !messages) {
    return [];
  }
  
  // 時間帯別にカウント
  const hourlyMap = new Map<number, { messages: number; visitors: Set<string> }>();
  
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { messages: 0, visitors: new Set() });
  }
  
  for (const message of messages) {
    const date = new Date(message.created_at);
    const hour = date.getHours();
    const entry = hourlyMap.get(hour)!;
    entry.messages++;
  }
  
  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    messageCount: data.messages,
    visitorCount: data.visitors.size,
  }));
}

/**
 * 日別統計
 */
export interface DailyStats {
  date: string;
  conversations: number;
  messages: number;
  sitesGenerated: number;
  newVisitors: number;
}

export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // データを取得
  const [conversationsResult, messagesResult, sitesResult, visitorsResult] = await Promise.all([
    (supabase as any).from('conversations').select('created_at').gte('created_at', startDate.toISOString()),
    (supabase as any).from('messages').select('created_at').gte('created_at', startDate.toISOString()),
    (supabase as any).from('generated_sites').select('created_at').gte('created_at', startDate.toISOString()),
    (supabase as any).from('visitors').select('created_at').gte('created_at', startDate.toISOString()),
  ]);
  
  // 日別にカウント
  const dailyMap = new Map<string, DailyStats>();
  
  // 日付を初期化
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      conversations: 0,
      messages: 0,
      sitesGenerated: 0,
      newVisitors: 0,
    });
  }
  
  // カウント
  const countByDate = (data: any[] | null, key: keyof DailyStats) => {
    if (!data) return;
    for (const item of data) {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry && key !== 'date') {
        (entry[key] as number)++;
      }
    }
  };
  
  countByDate(conversationsResult.data, 'conversations');
  countByDate(messagesResult.data, 'messages');
  countByDate(sitesResult.data, 'sitesGenerated');
  countByDate(visitorsResult.data, 'newVisitors');
  
  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 人気の会話トピック（フラグ別）
 */
export interface TopicStats {
  flag: string;
  count: number;
  conversionRate: number;
}

export async function getTopicStats(): Promise<TopicStats[]> {
  const supabase = createAdminClient();
  
  const { data: conversations, error } = await (supabase as any)
    .from('conversations')
    .select('status, metadata');
  
  if (error || !conversations) {
    return [];
  }
  
  const topicMap = new Map<string, { count: number; conversions: number }>();
  
  for (const conv of conversations as Conversation[]) {
    // metadataからトピック/フラグを取得、なければ'untagged'
    const metadata = conv.metadata as Record<string, any> || {};
    const flag = metadata.topic || metadata.flag || 'untagged';
    const entry = topicMap.get(flag) || { count: 0, conversions: 0 };
    entry.count++;
    if (conv.status === 'inquiry_submitted') {
      entry.conversions++;
    }
    topicMap.set(flag, entry);
  }
  
  return Array.from(topicMap.entries())
    .map(([flag, data]) => ({
      flag,
      count: data.count,
      conversionRate: data.count > 0 ? data.conversions / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 訪問者ティア分布
 */
export interface TierDistribution {
  tier: number;
  count: number;
  percentage: number;
}

export async function getTierDistribution(): Promise<TierDistribution[]> {
  const supabase = createAdminClient();
  
  const { data: visitors, error } = await (supabase as any)
    .from('visitors')
    .select('tier');
  
  if (error || !visitors) {
    return [];
  }
  
  const tierCount = new Map<number, number>();
  let total = 0;
  
  for (const visitor of visitors as Visitor[]) {
    const count = tierCount.get(visitor.tier) || 0;
    tierCount.set(visitor.tier, count + 1);
    total++;
  }
  
  return [1, 2, 3, 4].map(tier => ({
    tier,
    count: tierCount.get(tier) || 0,
    percentage: total > 0 ? (tierCount.get(tier) || 0) / total : 0,
  }));
}
