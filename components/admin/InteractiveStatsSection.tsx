'use client';

import { useState } from 'react';
import { StatsCard } from './StatsCard';
import { StatsChartModal } from './StatsChartModal';

type StatType = 'visitors' | 'conversations' | 'inquiries' | 'sites';

interface StatsData {
  visitorCount: number;
  conversationCount: number;
  inquiryCount: number;
  siteCount: number;
  todayVisitors: number;
  todayConversations: number;
  newInquiries: number;
}

interface InteractiveStatsSectionProps {
  stats: StatsData;
}

const statConfigs: {
  type: StatType;
  title: string;
  icon: string;
  getDescription: (stats: StatsData) => string | undefined;
  getValue: (stats: StatsData) => number;
}[] = [
  {
    type: 'visitors',
    title: '総訪問者数',
    icon: '👤',
    getDescription: (stats) => `今日: ${stats.todayVisitors}人`,
    getValue: (stats) => stats.visitorCount,
  },
  {
    type: 'conversations',
    title: '総会話数',
    icon: '💬',
    getDescription: (stats) => `今日: ${stats.todayConversations}件`,
    getValue: (stats) => stats.conversationCount,
  },
  {
    type: 'inquiries',
    title: '問い合わせ',
    icon: '📧',
    getDescription: (stats) => `未対応: ${stats.newInquiries}件`,
    getValue: (stats) => stats.inquiryCount,
  },
  {
    type: 'sites',
    title: 'サイト生成',
    icon: '🌐',
    getDescription: () => undefined,
    getValue: (stats) => stats.siteCount,
  },
];

export function InteractiveStatsSection({ stats }: InteractiveStatsSectionProps) {
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (statType: StatType) => {
    setSelectedStat(statType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStat(null);
  };

  const selectedConfig = selectedStat
    ? statConfigs.find((c) => c.type === selectedStat)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statConfigs.map((config) => (
          <StatsCard
            key={config.type}
            title={config.title}
            value={config.getValue(stats)}
            icon={config.icon}
            description={config.getDescription(stats)}
            onClick={() => handleCardClick(config.type)}
          />
        ))}
      </div>

      <StatsChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedConfig?.title || ''}
        metric={selectedStat || 'visitors'}
        icon={selectedConfig?.icon || '📊'}
      />
    </>
  );
}
