/**
 * 問い合わせテーブルコンポーネント
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Inquiry {
  id: string;
  visitor_id: string;
  conversation_id: string | null;
  email: string;
  name: string | null;
  company: string | null;
  summary: string;
  project_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  details: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
  new: '新規',
  contacted: '連絡済み',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
};

const statusOptions = [
  { value: 'new', label: '新規' },
  { value: 'contacted', label: '連絡済み' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' },
  { value: 'cancelled', label: 'キャンセル' },
];

export function InquiriesTable({ initialData }: { initialData: Inquiry[] }) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialData);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState(false);

  const filteredInquiries = filter === 'all' 
    ? inquiries 
    : inquiries.filter(i => i.status === filter);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setInquiries(prev =>
          prev.map(i => (i.id === id ? { ...i, status: newStatus } : i))
        );
        if (selectedInquiry?.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* テーブル */}
      <div className="flex-1">
        {/* フィルター */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            すべて ({inquiries.length})
          </button>
          {statusOptions.map((opt) => {
            const count = inquiries.filter(i => i.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filter === opt.value
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>

        {/* テーブル */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">概要</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    問い合わせはありません
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedInquiry?.id === inquiry.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(inquiry.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {inquiry.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {inquiry.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {inquiry.summary}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                        {statusLabels[inquiry.status]}
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
      {selectedInquiry && (
        <div className="w-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sticky top-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              問い合わせ詳細
            </h3>
            <button
              onClick={() => setSelectedInquiry(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">ステータス</label>
              <select
                value={selectedInquiry.status}
                onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                disabled={updating}
                className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">名前</label>
              <p className="text-gray-900 dark:text-white">{selectedInquiry.name || '-'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">メールアドレス</label>
              <p className="text-gray-900 dark:text-white">{selectedInquiry.email}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">会社名</label>
              <p className="text-gray-900 dark:text-white">{selectedInquiry.company || '-'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">プロジェクト種別</label>
              <p className="text-gray-900 dark:text-white">{selectedInquiry.project_type || '-'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">予算</label>
              <p className="text-gray-900 dark:text-white">{selectedInquiry.budget_range || '-'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">希望納期</label>
              <p className="text-gray-900 dark:text-white">{selectedInquiry.timeline || '-'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase">概要</label>
              <p className="text-gray-900 dark:text-white text-sm">{selectedInquiry.summary}</p>
            </div>

            {selectedInquiry.details && (
              <div>
                <label className="text-xs text-gray-500 uppercase">詳細</label>
                <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">
                  {selectedInquiry.details}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 uppercase">受信日時</label>
              <p className="text-gray-900 dark:text-white text-sm">
                {new Date(selectedInquiry.created_at).toLocaleString('ja-JP')}
              </p>
            </div>

            {selectedInquiry.conversation_id && (
              <button
                onClick={() => router.push(`/admin/conversations/${selectedInquiry.conversation_id}`)}
                className="w-full px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                💬 関連する会話を見る
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
