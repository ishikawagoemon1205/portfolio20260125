/**
 * 分析ダッシュボードコンポーネント
 */

'use client';

import { StatsCard } from '@/components/admin';

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

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return '💬';
      case 'inquiry':
        return '📧';
      case 'site':
        return '🌐';
      default:
        return '📌';
    }
  };

  return (
    <div className="space-y-8">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="総訪問者数"
          value={data.totalVisitors.toLocaleString()}
          icon="👥"
          description="これまでの総訪問者数"
        />
        <StatsCard
          title="総会話数"
          value={data.totalConversations.toLocaleString()}
          icon="💬"
          description={`メッセージ数: ${data.totalMessages.toLocaleString()}`}
        />
        <StatsCard
          title="問い合わせ数"
          value={data.totalInquiries.toLocaleString()}
          icon="📧"
          description="受信した問い合わせ"
        />
        <StatsCard
          title="生成サイト数"
          value={data.totalSites.toLocaleString()}
          icon="🌐"
          description="AIが生成したサイト"
        />
        <StatsCard
          title="API使用量"
          value={data.apiUsage.totalTokens.toLocaleString()}
          icon="🔧"
          description="使用したトークン数"
        />
        <StatsCard
          title="推定コスト"
          value={`$${data.apiUsage.estimatedCost.toFixed(2)}`}
          icon="💰"
          description="OpenAI API推定費用"
        />
      </div>

      {/* 最近のアクティビティ */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          最近のアクティビティ
        </h2>

        {data.recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            アクティビティがありません
          </p>
        ) : (
          <div className="space-y-4">
            {data.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-xl">
                  {getActivityIcon(activity.type)}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* システム情報 */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          システム情報
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <dt className="text-xs text-gray-500 uppercase">フレームワーク</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              Next.js 16 + React 19
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <dt className="text-xs text-gray-500 uppercase">データベース</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              Supabase (PostgreSQL)
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <dt className="text-xs text-gray-500 uppercase">AIモデル（チャット）</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              GPT-4o-mini
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <dt className="text-xs text-gray-500 uppercase">AIモデル（サイト生成）</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              GPT-4o
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <dt className="text-xs text-gray-500 uppercase">レート制限</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              Upstash Redis
            </dd>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <dt className="text-xs text-gray-500 uppercase">デプロイ</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              Vercel
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
