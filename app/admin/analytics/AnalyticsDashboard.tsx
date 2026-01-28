/**
 * 分析ダッシュボードコンポーネント
 * 
 * クリックでグラフ表示が可能なインタラクティブな統計カード
 */

'use client';

import { useState } from 'react';
import { StatsCard } from '@/components/admin';
import { StatsChartModal } from '@/components/admin/StatsChartModal';

type MetricType = 'visitors' | 'conversations' | 'inquiries' | 'sites' | 'messages' | 'tokens' | 'cost';

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

interface StatConfig {
  type: MetricType;
  title: string;
  icon: string;
  getValue: (data: AnalyticsData) => string;
  getDescription: (data: AnalyticsData) => string;
  unit?: string;
  valueFormatter?: (value: number) => string;
}

const statConfigs: StatConfig[] = [
  {
    type: 'visitors',
    title: '総訪問者数',
    icon: '👥',
    getValue: (data) => data.totalVisitors.toLocaleString(),
    getDescription: () => 'これまでの総訪問者数',
    unit: '人',
  },
  {
    type: 'conversations',
    title: '総会話数',
    icon: '💬',
    getValue: (data) => data.totalConversations.toLocaleString(),
    getDescription: (data) => `メッセージ数: ${data.totalMessages.toLocaleString()}`,
    unit: '件',
  },
  {
    type: 'inquiries',
    title: '問い合わせ数',
    icon: '📧',
    getValue: (data) => data.totalInquiries.toLocaleString(),
    getDescription: () => '受信した問い合わせ',
    unit: '件',
  },
  {
    type: 'sites',
    title: '生成サイト数',
    icon: '🌐',
    getValue: (data) => data.totalSites.toLocaleString(),
    getDescription: () => 'AIが生成したサイト',
    unit: '件',
  },
  {
    type: 'messages',
    title: 'メッセージ数',
    icon: '✉️',
    getValue: (data) => data.totalMessages.toLocaleString(),
    getDescription: () => 'チャットメッセージ総数',
    unit: '件',
  },
  {
    type: 'tokens',
    title: 'API使用量',
    icon: '🔧',
    getValue: (data) => data.apiUsage.totalTokens.toLocaleString(),
    getDescription: () => '使用したトークン数',
    unit: 'トークン',
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  {
    type: 'cost',
    title: '推定コスト',
    icon: '💰',
    getValue: (data) => `$${data.apiUsage.estimatedCost.toFixed(3)}`,
    getDescription: () => 'OpenAI API推定費用',
    unit: '',
    valueFormatter: (value: number) => `$${value.toFixed(3)}`,
  },
];

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (metric: MetricType) => {
    setSelectedMetric(metric);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMetric(null);
  };

  const selectedConfig = selectedMetric
    ? statConfigs.find((c) => c.type === selectedMetric)
    : null;

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
        {statConfigs.map((config) => (
          <StatsCard
            key={config.type}
            title={config.title}
            value={config.getValue(data)}
            icon={config.icon}
            description={config.getDescription(data)}
            onClick={() => handleCardClick(config.type)}
          />
        ))}
      </div>

      {/* グラフモーダル */}
      <StatsChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedConfig?.title || ''}
        metric={selectedMetric || 'visitors'}
        icon={selectedConfig?.icon || '�'}
        unit={selectedConfig?.unit}
        valueFormatter={selectedConfig?.valueFormatter}
      />

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
