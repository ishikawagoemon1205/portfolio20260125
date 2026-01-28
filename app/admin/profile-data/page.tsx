'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/admin';

interface ProfileItem {
  id?: string;
  category: string;
  key: string;
  value: string;
  display_order: number;
  weight: number;
  is_active: boolean;
  updated_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const defaultCategories: Record<string, { label: string; icon: string }> = {
  'basic': { label: '基本情報', icon: '📝' },
  'skills': { label: 'スキル', icon: '💻' },
  'skill': { label: 'スキル', icon: '💻' },
  'hobbies': { label: '趣味・個性', icon: '🎮' },
  'recent_updates': { label: '最近の出来事', icon: '⭐' },
  'achievements': { label: '実績', icon: '🏆' },
  'personality': { label: '性格・価値観', icon: '💭' },
  'food': { label: '食べ物・飲み物', icon: '🍽' },
  'experience': { label: '経験', icon: '📈' },
  'work': { label: '仕事', icon: '💼' },
  'other': { label: 'その他', icon: '📄' },
};

const getCategoryIcon = (category: string): string => defaultCategories[category]?.icon || '📄';
const getCategoryLabel = (category: string): string => defaultCategories[category]?.label || category;

export default function ProfileDataPage() {
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ProfileItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadItems = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/profile-data?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setPagination(data.pagination);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadItems(1);
  }, [loadItems]);

  const saveItem = async (item: ProfileItem) => {
    try {
      const method = item.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/profile-data', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: '保存しました' });
        loadItems(pagination.page);
        setEditingItem(null);
        setIsAddMode(false);
      } else {
        throw new Error('保存に失敗');
      }
    } catch {
      setMessage({ type: 'error', text: '保存に失敗しました' });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('削除してもよろしいですか？')) return;
    try {
      const res = await fetch(`/api/admin/profile-data?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '削除しました' });
        loadItems(pagination.page);
      } else {
        throw new Error('削除に失敗');
      }
    } catch {
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const startEdit = (item: ProfileItem) => {
    setEditingItem({ ...item });
    setIsAddMode(false);
  };

  const startAdd = () => {
    setEditingItem({
      category: categories[0] || 'other',
      key: '',
      value: '',
      display_order: 0,
      weight: 1.0,
      is_active: true,
    });
    setIsAddMode(true);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setIsAddMode(false);
  };

  const getDaysSinceUpdate = (updatedAt: string) => {
    return Math.ceil(Math.abs(new Date().getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMessageClassName = () => {
    if (!message) return '';
    return message.type === 'success'
      ? 'mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      : 'mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
  };

  const getRowClassName = (isActive: boolean) => {
    const base = 'hover:bg-gray-50 dark:hover:bg-gray-800/50';
    return isActive ? base : `${base} opacity-50`;
  };

  const getStatusClassName = (isActive: boolean) => {
    return isActive
      ? 'inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  const getPageButtonClassName = (isCurrent: boolean) => {
    return isCurrent
      ? 'px-3 py-1 text-sm rounded bg-purple-500 text-white'
      : 'px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200';
  };

  const formatUpdateDate = (updatedAt?: string) => {
    if (!updatedAt) return '-';
    return `${getDaysSinceUpdate(updatedAt)}日前`;
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;
    
    const maxButtons = Math.min(5, totalPages);
    let startPage = 1;
    
    if (totalPages > 5) {
      if (currentPage <= 3) {
        startPage = 1;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      } else {
        startPage = currentPage - 2;
      }
    }

    for (let i = 0; i < maxButtons; i++) {
      const pageNum = startPage + i;
      buttons.push(
        <button
          key={pageNum}
          onClick={() => loadItems(pageNum)}
          className={getPageButtonClassName(currentPage === pageNum)}
        >
          {pageNum}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div>
      <PageHeader
        title="動的プロフィール管理"
        description="チャットで使用されるプロフィール情報を管理（テーブル形式）"
      />

      {message && (
        <div className={getMessageClassName()}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
        >
          ➕ 新規追加
        </button>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="キーワード検索..."
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-64"
        />
        <span className="text-sm text-gray-500">全 {pagination.total} 件</span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">データがありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">カテゴリ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">キー</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">値</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">重み</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">状態</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">更新</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className={getRowClassName(item.is_active)}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <span>{getCategoryIcon(item.category)}</span>
                        <span className="text-gray-700 dark:text-gray-300">{getCategoryLabel(item.category)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.key.length > 30 ? `${item.key.slice(0, 30)}...` : item.key}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.value.length > 80 ? `${item.value.slice(0, 80)}...` : item.value}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.weight?.toFixed(1) || '1.0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getStatusClassName(item.is_active)}>
                        {item.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-500">
                        {formatUpdateDate(item.updated_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-white rounded"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteItem(item.id!)}
                          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {pagination.total} 件中 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 件を表示
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadItems(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-200"
              >
                前へ
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() => loadItems(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-200"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 プロフィール管理について</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>カテゴリ</strong>は動的に追加されます</li>
          <li>• <strong>重み</strong>が高いほど、AIが会話で使用する確率が上がります</li>
          <li>• 無効にした項目は使用されません</li>
        </ul>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {isAddMode ? '新規追加' : '編集'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カテゴリ
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  項目名
                </label>
                <input
                  type="text"
                  value={editingItem.key}
                  onChange={(e) => setEditingItem({ ...editingItem, key: e.target.value })}
                  placeholder="例: ベンチプレス"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容
                </label>
                <textarea
                  value={editingItem.value}
                  onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                  rows={4}
                  placeholder="AIがチャットで話す内容"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  重み: {editingItem.weight?.toFixed(1) || '1.0'}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={editingItem.weight || 1.0}
                  onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingItem.is_active}
                    onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">有効</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveItem(editingItem)}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-900 dark:text-white rounded-lg font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
