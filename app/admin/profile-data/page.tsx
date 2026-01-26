/**
 * 動的プロフィール管理ページ
 * 
 * 優先度ロジックに基づいてチャットで使用されるプロフィール情報を管理
 * 最近の出来事、趣味、実績などを6カテゴリで分類
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin';

interface ProfileItem {
  id?: string;
  category: string;
  key: string;
  value: string;
  priority: number;
  is_active: boolean;
  updated_at?: string;
}

const categories = [
  { value: 'basic', label: '基本情報', icon: '📝' },
  { value: 'skills', label: 'スキル', icon: '💻' },
  { value: 'hobbies', label: '趣味・個性', icon: '🎨' },
  { value: 'recent_updates', label: '最近の出来事', icon: '⭐' },
  { value: 'achievements', label: '実績', icon: '🏆' },
  { value: 'personality', label: '性格・価値観', icon: '💭' },
];

export default function ProfileDataPage() {
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ProfileItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await fetch('/api/admin/profile-data');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

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
        loadItems();
        setEditingItem(null);
        setIsAddMode(false);
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存に失敗しました' });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('削除してもよろしいですか？')) return;

    try {
      const res = await fetch(`/api/admin/profile-data?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '削除しました' });
        loadItems();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const startEdit = (item: ProfileItem) => {
    setEditingItem({ ...item });
    setIsAddMode(false);
  };

  const startAdd = () => {
    setEditingItem({
      category: 'recent_updates',
      key: '',
      value: '',
      priority: 3,
      is_active: true,
    });
    setIsAddMode(true);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setIsAddMode(false);
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const getCategoryIcon = (category: string) => {
    return categories.find(c => c.value === category)?.icon || '📄';
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const getDaysSinceUpdate = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  return (
    <div>
      <PageHeader
        title="動的プロフィール管理"
        description="チャットで使用されるプロフィール情報を管理（優先度ロジックが適用されます）"
      />

      {/* メッセージ */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 追加ボタン */}
      <div className="mb-6">
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          ➕ 新規追加
        </button>
      </div>

      {/* 編集モーダル */}
      {(editingItem || isAddMode) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {isAddMode ? '新規追加' : '編集'}
            </h2>

            <div className="space-y-4">
              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カテゴリ
                </label>
                <select
                  value={editingItem?.category}
                  onChange={(e) => setEditingItem({ ...editingItem!, category: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* キー */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  項目名
                </label>
                <input
                  type="text"
                  value={editingItem?.key}
                  onChange={(e) => setEditingItem({ ...editingItem!, key: e.target.value })}
                  placeholder="例: ベンチプレス、最近の趣味、達成したこと"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>

              {/* 値 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容
                </label>
                <textarea
                  value={editingItem?.value}
                  onChange={(e) => setEditingItem({ ...editingItem!, value: e.target.value })}
                  rows={4}
                  placeholder="AIがチャットで話す内容を記載してください"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>

              {/* 優先度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  優先度: {editingItem?.priority}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editingItem?.priority}
                  onChange={(e) => setEditingItem({ ...editingItem!, priority: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1: 低</span>
                  <span>3: 中</span>
                  <span>5: 高</span>
                </div>
              </div>

              {/* 有効/無効 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingItem?.is_active}
                    onChange={(e) => setEditingItem({ ...editingItem!, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">有効</span>
                </label>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveItem(editingItem!)}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ別一覧 */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryItems = getItemsByCategory(category.value);
          
          return (
            <section key={category.value} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.label}
                <span className="text-sm text-gray-500">({categoryItems.length})</span>
              </h2>

              {categoryItems.length === 0 ? (
                <p className="text-gray-500 text-sm">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        item.is_active
                          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.key}
                            </h3>
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              優先度: {item.priority}
                            </span>
                            {!item.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                無効
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {item.value}
                          </p>
                          {item.updated_at && (
                            <p className="text-xs text-gray-500">
                              更新: {getDaysSinceUpdate(item.updated_at)}日前
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => deleteItem(item.id!)}
                            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* 説明 */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 優先度ロジックについて
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>最近の出来事</strong>は更新日が新しいほど高確率で言及されます</li>
          <li>• 優先度が高いほど、AIが会話で使用する確率が上がります</li>
          <li>• 無効にした項目は使用されません</li>
          <li>• 定期的に内容を更新することで、AIの情報を最新に保てます</li>
        </ul>
      </div>
    </div>
  );
}
