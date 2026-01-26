/**
 * 分析・モニタリングページ
 */

import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface AnalyticsData {
  totalVisitors: number;
  totalConversations: number;
  totalMessages: number;
  totalInquiries: number;
  totalSites: number;
  recentActivity: ActivityItem[];
  dailyStats: DailyStat[];
  apiUsage: APIUsage;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

interface DailyStat {
  date: string;
  visitors: number;
  conversations: number;
  messages: number;
}

interface APIUsage {
  totalTokens: number;
  estimatedCost: number;
}

async function AnalyticsContent() {
  const supabase = await createAdminClient();

  // 各種統計を取得
  const [
    visitorsResult,
    conversationsResult,
    messagesResult,
    inquiriesResult,
    sitesResult,
  ] = await Promise.all([
    (supabase as any).from('visitors').select('*', { count: 'exact', head: true }),
    (supabase as any).from('conversations').select('*', { count: 'exact', head: true }),
    (supabase as any).from('messages').select('*', { count: 'exact', head: true }),
    (supabase as any).from('inquiries').select('*', { count: 'exact', head: true }),
    (supabase as any).from('generated_sites').select('*', { count: 'exact', head: true }),
  ]);

  // 最近のアクティビティを取得
  const { data: recentConversations } = await (supabase as any)
    .from('conversations')
    .select('id, started_at')
    .order('started_at', { ascending: false })
    .limit(10);

  const { data: recentInquiries } = await (supabase as any)
    .from('inquiries')
    .select('id, created_at, name')
    .order('created_at', { ascending: false })
    .limit(5);

  // API使用量を取得（generated_sitesのtokens_usedを合計）
  const { data: tokenData } = await (supabase as any)
    .from('generated_sites')
    .select('tokens_used');

  const totalTokens = tokenData?.reduce((sum: number, item: { tokens_used: number | null }) => 
    sum + (item.tokens_used || 0), 0) || 0;

  // 最近のアクティビティを構築
  const recentActivity: ActivityItem[] = [
    ...(recentConversations || []).map((c: { id: string; started_at: string }) => ({
      type: 'conversation',
      description: '新しい会話が開始されました',
      timestamp: c.started_at,
    })),
    ...(recentInquiries || []).map((i: { id: string; created_at: string; name: string }) => ({
      type: 'inquiry',
      description: `${i.name}さんから問い合わせがありました`,
      timestamp: i.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 10);

  const analyticsData: AnalyticsData = {
    totalVisitors: visitorsResult.count || 0,
    totalConversations: conversationsResult.count || 0,
    totalMessages: messagesResult.count || 0,
    totalInquiries: inquiriesResult.count || 0,
    totalSites: sitesResult.count || 0,
    recentActivity,
    dailyStats: [], // TODO: 日別統計を実装
    apiUsage: {
      totalTokens,
      estimatedCost: totalTokens * 0.00001, // GPT-4o-miniの概算コスト
    },
  };

  return <AnalyticsDashboard data={analyticsData} />;
}

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="分析・モニタリング"
        description="サイトの利用状況やAPI使用量を確認できます"
      />
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
