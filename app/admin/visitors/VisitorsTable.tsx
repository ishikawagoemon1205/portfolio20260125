/**
 * 訪問者テーブルコンポーネント
 */

'use client';

import { useState } from 'react';

interface Visitor {
  id: string;
  visitor_id: string;
  created_at: string;
  last_seen_at: string;
  visit_count: number;
  total_messages: number;
  tier: number;
  is_blocked: boolean;
}

export function VisitorsTable({ initialData }: { initialData: Visitor[] }) {
  const [visitors] = useState<Visitor[]>(initialData);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVisitors = visitors.filter(v => 
    v.visitor_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierLabel = (tier: number) => {
    const labels: Record<number, { label: string; color: string }> = {
      1: { label: 'Tier 1', color: 'bg-gray-100 text-gray-700' },
      2: { label: 'Tier 2', color: 'bg-blue-100 text-blue-700' },
      3: { label: 'Tier 3', color: 'bg-purple-100 text-purple-700' },
      4: { label: 'Tier 4', color: 'bg-yellow-100 text-yellow-700' },
    };
    return labels[tier] || labels[1];
  };

  return (
    <div className="flex gap-6">
      {/* テーブル */}
      <div className="flex-1">
        {/* 検索 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="訪問者IDで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>

        {/* テーブル */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">初回訪問</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">訪問者ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">訪問回数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最終訪問</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    訪問者はいません
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor) => (
                  <tr
                    key={visitor.id}
                    onClick={() => setSelectedVisitor(visitor)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedVisitor?.id === visitor.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(visitor.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {visitor.visitor_id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {visitor.visit_count}回
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {visitor.last_seen_at ? new Date(visitor.last_seen_at).toLocaleString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierLabel(visitor.tier).color}`}>
                        {getTierLabel(visitor.tier).label}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細パネル */}
      {selectedVisitor && (
        <div className="w-[400px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sticky top-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              訪問者詳細
            </h3>
            <button
              onClick={() => setSelectedVisitor(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs text-gray-500 uppercase">訪問者ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white break-all">
                {selectedVisitor.visitor_id}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">初回訪問</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(selectedVisitor.created_at).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">最終訪問</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedVisitor.last_seen_at ? new Date(selectedVisitor.last_seen_at).toLocaleString('ja-JP') : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">訪問回数</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedVisitor.visit_count}回
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">総メッセージ数</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedVisitor.total_messages}件
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">Tier</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierLabel(selectedVisitor.tier).color}`}>
                  {getTierLabel(selectedVisitor.tier).label}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase">ステータス</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedVisitor.is_blocked ? (
                  <span className="text-red-600">🚫 ブロック中</span>
                ) : (
                  <span className="text-green-600">✓ アクティブ</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
