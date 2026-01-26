/**
 * コスト・使用量追跡
 * 
 * OpenAI APIの使用量とコストを追跡
 */

import { createAdminClient } from '@/lib/supabase/server';
import { estimateCost, type AIModel } from '@/lib/openai/client';

/**
 * 使用量記録リクエスト
 */
export interface UsageRecord {
  messageId?: string;
  conversationId?: string;
  visitorId?: string;
  model: AIModel;
  promptTokens: number;
  completionTokens: number;
  purpose: 'chat' | 'site_generation' | 'embedding';
}

/**
 * 使用量を記録
 */
export async function recordUsage(record: UsageRecord): Promise<void> {
  const supabase = createAdminClient();
  
  const totalTokens = record.promptTokens + record.completionTokens;
  const costUsd = estimateCost(record.promptTokens, record.completionTokens, record.model);
  
  // メッセージに関連付けられている場合は更新
  if (record.messageId) {
    await (supabase as any)
      .from('messages')
      .update({
        tokens_used: totalTokens,
        cost_usd: costUsd,
      })
      .eq('id', record.messageId);
  }
  
  // サイト生成の場合も更新
  if (record.conversationId && record.purpose === 'site_generation') {
    await (supabase as any)
      .from('generated_sites')
      .update({
        tokens_used: totalTokens,
        cost_usd: costUsd,
      })
      .eq('conversation_id', record.conversationId)
      .is('tokens_used', null);
  }
}

/**
 * コスト統計
 */
export interface CostStats {
  totalCostUsd: number;
  totalTokens: number;
  chatCostUsd: number;
  chatTokens: number;
  siteGenerationCostUsd: number;
  siteGenerationTokens: number;
  avgCostPerConversation: number;
}

/**
 * コスト統計を取得
 */
export async function getCostStats(period: 'today' | 'week' | 'month' | 'all' = 'month'): Promise<CostStats> {
  const supabase = createAdminClient();
  
  let startDate: string | null = null;
  const now = new Date();
  
  switch (period) {
    case 'today':
      now.setHours(0, 0, 0, 0);
      startDate = now.toISOString();
      break;
    case 'week':
      now.setDate(now.getDate() - 7);
      startDate = now.toISOString();
      break;
    case 'month':
      now.setMonth(now.getMonth() - 1);
      startDate = now.toISOString();
      break;
  }
  
  // メッセージのコストを取得
  let messagesQuery = (supabase as any)
    .from('messages')
    .select('tokens_used, cost_usd');
  if (startDate) {
    messagesQuery = messagesQuery.gte('created_at', startDate);
  }
  const { data: messages } = await messagesQuery;
  
  // サイト生成のコストを取得
  let sitesQuery = (supabase as any)
    .from('generated_sites')
    .select('tokens_used, cost_usd');
  if (startDate) {
    sitesQuery = sitesQuery.gte('created_at', startDate);
  }
  const { data: sites } = await sitesQuery;
  
  // 会話数を取得
  let conversationsQuery = (supabase as any)
    .from('conversations')
    .select('id', { count: 'exact' });
  if (startDate) {
    conversationsQuery = conversationsQuery.gte('created_at', startDate);
  }
  const { count: conversationCount } = await conversationsQuery;
  
  // 集計
  let chatTokens = 0;
  let chatCostUsd = 0;
  
  if (messages) {
    for (const msg of messages) {
      chatTokens += msg.tokens_used || 0;
      chatCostUsd += msg.cost_usd || 0;
    }
  }
  
  let siteTokens = 0;
  let siteCostUsd = 0;
  
  if (sites) {
    for (const site of sites) {
      siteTokens += site.tokens_used || 0;
      siteCostUsd += site.cost_usd || 0;
    }
  }
  
  const totalTokens = chatTokens + siteTokens;
  const totalCostUsd = chatCostUsd + siteCostUsd;
  
  return {
    totalCostUsd,
    totalTokens,
    chatCostUsd,
    chatTokens,
    siteGenerationCostUsd: siteCostUsd,
    siteGenerationTokens: siteTokens,
    avgCostPerConversation: conversationCount && conversationCount > 0 
      ? totalCostUsd / conversationCount 
      : 0,
  };
}

/**
 * 日別コスト推移
 */
export interface DailyCost {
  date: string;
  costUsd: number;
  tokens: number;
}

export async function getDailyCosts(days: number = 30): Promise<DailyCost[]> {
  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data: messages } = await (supabase as any)
    .from('messages')
    .select('created_at, tokens_used, cost_usd')
    .gte('created_at', startDate.toISOString());
  
  const { data: sites } = await (supabase as any)
    .from('generated_sites')
    .select('created_at, tokens_used, cost_usd')
    .gte('created_at', startDate.toISOString());
  
  // 日別に集計
  const dailyMap = new Map<string, DailyCost>();
  
  // 日付を初期化
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      costUsd: 0,
      tokens: 0,
    });
  }
  
  // メッセージを集計
  if (messages) {
    for (const msg of messages) {
      const dateStr = new Date(msg.created_at).toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.costUsd += msg.cost_usd || 0;
        entry.tokens += msg.tokens_used || 0;
      }
    }
  }
  
  // サイトを集計
  if (sites) {
    for (const site of sites) {
      const dateStr = new Date(site.created_at).toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.costUsd += site.cost_usd || 0;
        entry.tokens += site.tokens_used || 0;
      }
    }
  }
  
  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 予算アラートチェック
 */
export interface BudgetAlert {
  isOverBudget: boolean;
  currentCost: number;
  budgetLimit: number;
  percentageUsed: number;
  daysRemaining: number;
  projectedMonthlyTotal: number;
}

export async function checkBudgetAlert(monthlyBudgetUsd: number = 50): Promise<BudgetAlert> {
  const stats = await getCostStats('month');
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;
  
  // 現在のペースで月末まで使った場合の予測
  const dailyAverage = daysPassed > 0 ? stats.totalCostUsd / daysPassed : 0;
  const projectedMonthlyTotal = dailyAverage * daysInMonth;
  
  const percentageUsed = monthlyBudgetUsd > 0 ? (stats.totalCostUsd / monthlyBudgetUsd) * 100 : 0;
  
  return {
    isOverBudget: stats.totalCostUsd > monthlyBudgetUsd,
    currentCost: stats.totalCostUsd,
    budgetLimit: monthlyBudgetUsd,
    percentageUsed,
    daysRemaining,
    projectedMonthlyTotal,
  };
}
