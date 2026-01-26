/**
 * 管理画面ダッシュボード
 */

import { Suspense } from 'react';
import { PageHeader, StatsCard } from '@/components/admin';
import { createAdminClient } from '@/lib/supabase/server';

async function getStats() {
  const supabase = await createAdminClient();
  
  // 訪問者数
  const { count: visitorCount } = await (supabase as any)
    .from('visitors')
    .select('*', { count: 'exact', head: true });
  
  // 会話数
  const { count: conversationCount } = await (supabase as any)
    .from('conversations')
    .select('*', { count: 'exact', head: true });
  
  // 問い合わせ数
  const { count: inquiryCount } = await (supabase as any)
    .from('inquiries')
    .select('*', { count: 'exact', head: true });
  
  // サイト生成数
  const { count: siteCount } = await (supabase as any)
    .from('generated_sites')
    .select('*', { count: 'exact', head: true });
  
  // 今日の訪問者
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayVisitors } = await (supabase as any)
    .from('visitors')
    .select('*', { count: 'exact', head: true })
    .gte('last_visit_at', today.toISOString());
  
  // 今日の会話
  const { count: todayConversations } = await (supabase as any)
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', today.toISOString());
  
  // 新規問い合わせ
  const { count: newInquiries } = await (supabase as any)
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  return {
    visitorCount: visitorCount || 0,
    conversationCount: conversationCount || 0,
    inquiryCount: inquiryCount || 0,
    siteCount: siteCount || 0,
    todayVisitors: todayVisitors || 0,
    todayConversations: todayConversations || 0,
    newInquiries: newInquiries || 0,
  };
}

async function getRecentInquiries() {
  const supabase = await createAdminClient();
  
  const { data } = await (supabase as any)
    .from('inquiries')
    .select('id, email, name, summary, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  return data || [];
}

async function getRecentConversations() {
  const supabase = await createAdminClient();
  
  const { data } = await (supabase as any)
    .from('conversations')
    .select('id, visitor_id, message_count, started_at, status')
    .order('started_at', { ascending: false })
    .limit(5);
  
  return data || [];
}

function StatsSection({ stats }: { stats: Awaited<ReturnType<typeof getStats>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        title="総訪問者数"
        value={stats.visitorCount}
        icon="👤"
        description={`今日: ${stats.todayVisitors}人`}
      />
      <StatsCard
        title="総会話数"
        value={stats.conversationCount}
        icon="💬"
        description={`今日: ${stats.todayConversations}件`}
      />
      <StatsCard
        title="問い合わせ"
        value={stats.inquiryCount}
        icon="📧"
        description={`未対応: ${stats.newInquiries}件`}
      />
      <StatsCard
        title="サイト生成"
        value={stats.siteCount}
        icon="🌐"
      />
    </div>
  );
}

function RecentInquiriesSection({ inquiries }: { inquiries: any[] }) {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const statusLabels: Record<string, string> = {
    new: '新規',
    contacted: '連絡済み',
    in_progress: '進行中',
    completed: '完了',
    cancelled: 'キャンセル',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📧 最近の問い合わせ
      </h2>
      {inquiries.length === 0 ? (
        <p className="text-gray-500 text-sm">問い合わせはまだありません</p>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry: any) => (
            <li key={inquiry.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {inquiry.name || inquiry.email}
                </p>
                <p className="text-sm text-gray-500 truncate max-w-xs">
                  {inquiry.summary}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inquiry.status] || statusColors.new}`}>
                {statusLabels[inquiry.status] || inquiry.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentConversationsSection({ conversations }: { conversations: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        💬 最近の会話
      </h2>
      {conversations.length === 0 ? (
        <p className="text-gray-500 text-sm">会話はまだありません</p>
      ) : (
        <ul className="space-y-3">
          {conversations.map((conv: any) => (
            <li key={conv.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {conv.visitor_id.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(conv.started_at).toLocaleString('ja-JP')}
                </p>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {conv.message_count}件のメッセージ
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const inquiries = await getRecentInquiries();
  const conversations = await getRecentConversations();

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        description="サイトの統計情報と最近のアクティビティ"
      />

      <Suspense fallback={<div>読み込み中...</div>}>
        <StatsSection stats={stats} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>読み込み中...</div>}>
          <RecentInquiriesSection inquiries={inquiries} />
        </Suspense>
        
        <Suspense fallback={<div>読み込み中...</div>}>
          <RecentConversationsSection conversations={conversations} />
        </Suspense>
      </div>
    </div>
  );
}
