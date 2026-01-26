/**
 * 統計グラフモーダルコンポーネント
 * 
 * 時間軸を選択できるグラフを表示
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface StatsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  metric: 'visitors' | 'conversations' | 'inquiries' | 'sites';
  icon: string;
}

const timeRangeLabels: Record<TimeRange, string> = {
  '7d': '過去7日間',
  '30d': '過去30日間',
  '90d': '過去90日間',
  '1y': '過去1年間',
};

export function StatsChartModal({ isOpen, onClose, title, metric, icon }: StatsChartModalProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/stats/timeseries?metric=${metric}&range=${timeRange}`);
        if (!res.ok) throw new Error('データ取得に失敗しました');
        const result = await res.json();
        setData(result.data || []);
        setTotal(result.total || 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [isOpen, metric, timeRange]);

  // グラフの最大値
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '1y') {
      return `${date.getMonth() + 1}月`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // グラフに表示するデータ（間引き）
  const getDisplayData = () => {
    if (data.length <= 10) return data;
    
    // 表示するデータ点の数を決定
    const targetPoints = timeRange === '1y' ? 12 : timeRange === '90d' ? 15 : 10;
    const step = Math.ceil(data.length / targetPoints);
    
    return data.filter((_, index) => index % step === 0 || index === data.length - 1);
  };

  const displayData = getDisplayData();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  期間内合計: <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 期間選択 */}
          <div className="flex gap-2 p-6 pb-0">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>

          {/* グラフエリア */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">
                {error}
              </div>
            ) : (
              <div className="relative">
                {/* グラフコンテナ */}
                <div className="flex">
                  {/* Y軸ラベル */}
                  <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2 w-8 text-right" style={{ height: '256px' }}>
                    <span>{maxValue}</span>
                    <span>{Math.ceil(maxValue * 0.75)}</span>
                    <span>{Math.ceil(maxValue * 0.5)}</span>
                    <span>{Math.ceil(maxValue * 0.25)}</span>
                    <span>0</span>
                  </div>
                  
                  {/* 棒グラフエリア */}
                  <div className="flex-1 flex items-end gap-1" style={{ height: '256px' }}>
                    {displayData.map((item, index) => {
                      // 最大値を100%として正規化
                      const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                      const heightPx = maxValue > 0 ? (item.value / maxValue) * 256 : 0;
                      return (
                        <div
                          key={item.date}
                          className="flex-1 flex flex-col items-center justify-end group relative h-full"
                        >
                          {/* 数値ラベル（値がある場合のみ） */}
                          {item.value > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.02 + 0.5 }}
                              className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                            >
                              {item.value}
                            </motion.div>
                          )}
                          
                          {/* バー */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: heightPx }}
                            transition={{ duration: 0.5, delay: index * 0.02 }}
                            className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-colors group"
                            style={{ 
                              minHeight: item.value > 0 ? '4px' : '0px',
                              boxShadow: item.value > 0 ? '0 -2px 8px rgba(168, 85, 247, 0.3)' : 'none'
                            }}
                          >
                            {/* ツールチップ */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                                <div className="font-medium">{formatDate(item.date)}</div>
                                <div className="text-purple-300">{item.value}件</div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* X軸ラベル */}
                <div className="flex justify-between mt-2 ml-8 text-xs text-gray-500 dark:text-gray-400">
                  {displayData.length > 0 && (
                    <>
                      <span>{formatDate(displayData[0].date)}</span>
                      {displayData.length > 2 && (
                        <span>{formatDate(displayData[Math.floor(displayData.length / 2)].date)}</span>
                      )}
                      <span>{formatDate(displayData[displayData.length - 1].date)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* フッター統計 */}
          <div className="grid grid-cols-3 gap-4 p-6 pt-0">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">平均/日</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.length > 0 ? (total / data.length).toFixed(1) : 0}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">最大/日</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {maxValue}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">期間合計</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {total}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
