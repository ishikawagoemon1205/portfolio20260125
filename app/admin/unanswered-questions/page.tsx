/**
 * 未回答の質問管理ページ
 * 
 * AIが回答できなかった質問を一覧表示し、
 * 回答を登録することで動的プロフィールに追加できる
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin';
import type { UnansweredQuestion } from '@/types/database.types';

// カテゴリオプション（動的プロフィールと連携）
const categoryOptions = [
  { value: '', label: '-- カテゴリを選択 --' },
  { value: 'hobbies', label: '趣味・好きなもの' },
  { value: 'food', label: '食べ物・飲み物' },
  { value: 'work', label: '仕事・キャリア' },
  { value: 'personal', label: '個人情報・性格' },
  { value: 'skills', label: 'スキル・技術' },
  { value: 'other', label: 'その他' },
];

export default function UnansweredQuestionsPage() {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [stats, setStats] = useState({ pending: 0, answered: 0, ignored: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'answered' | 'ignored' | 'all'>('pending');
  const [sortBy, setSortBy] = useState<'asked_count' | 'last_asked_at'>('asked_count');
  
  // 回答入力用のモーダル状態
  const [selectedQuestion, setSelectedQuestion] = useState<UnansweredQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [filter, sortBy]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/unanswered-questions?status=${filter}&sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('質問読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedQuestion || !answerText.trim()) {
      setMessage({ type: 'error', text: '回答を入力してください' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/unanswered-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          answer: answerText.trim(),
          profileCategory: selectedCategory || null,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '回答を登録しました！' });
        setSelectedQuestion(null);
        setAnswerText('');
        setSelectedCategory('');
        await loadQuestions();
      } else {
        throw new Error('登録に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '回答の登録に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIgnore = async (questionId: string) => {
    if (!confirm('この質問を無視しますか？')) return;

    try {
      const res = await fetch('/api/admin/unanswered-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, status: 'ignored' }),
      });

      if (res.ok) {
        await loadQuestions();
        setMessage({ type: 'success', text: '質問を無視しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '操作に失敗しました' });
    }
  };

  const handleRestore = async (questionId: string) => {
    try {
      const res = await fetch('/api/admin/unanswered-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, status: 'pending' }),
      });

      if (res.ok) {
        await loadQuestions();
        setMessage({ type: 'success', text: '質問を復元しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '操作に失敗しました' });
    }
  };

  return (
    <div>
      <PageHeader
        title="未回答の質問"
        description="AIが回答できなかった質問を確認し、回答を登録できます"
      />

      {/* 統計カード */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">未対応</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
          <p className="text-sm text-green-700 dark:text-green-400">回答済み</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-600">{stats.ignored}</p>
          <p className="text-sm text-gray-700 dark:text-gray-400">無視</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
          <p className="text-sm text-purple-700 dark:text-purple-400">合計</p>
        </div>
      </div>

      {/* フィルター・ソート */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['pending', 'answered', 'ignored', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === status
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'pending' && '未対応'}
              {status === 'answered' && '回答済み'}
              {status === 'ignored' && '無視'}
              {status === 'all' && 'すべて'}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        >
          <option value="asked_count">質問回数順</option>
          <option value="last_asked_at">最新順</option>
        </select>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* 質問リスト */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {filter === 'pending' ? '🎉 未対応の質問はありません' : '質問がありません'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      q.status === 'answered' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {q.status === 'pending' && '未対応'}
                      {q.status === 'answered' && '回答済み'}
                      {q.status === 'ignored' && '無視'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {q.asked_count}回質問されました
                    </span>
                  </div>
                  
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    「{q.question}」
                  </p>
                  
                  {q.answer && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">登録済み回答:</p>
                      <p className="text-gray-700 dark:text-gray-300">{q.answer}</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-2">
                    初回: {new Date(q.first_asked_at).toLocaleDateString('ja-JP')} | 
                    最新: {new Date(q.last_asked_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {q.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setAnswerText('');
                          setSelectedCategory('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                      >
                        回答を登録
                      </button>
                      <button
                        onClick={() => handleIgnore(q.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 rounded-lg transition-colors"
                      >
                        無視
                      </button>
                    </>
                  )}
                  {q.status === 'ignored' && (
                    <button
                      onClick={() => handleRestore(q.id)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    >
                      復元
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 回答入力モーダル */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold">回答を登録</h3>
              <p className="text-gray-500 mt-1">この回答は動的プロフィールに追加され、次回から回答できるようになります</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  質問
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  「{selectedQuestion.question}」
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedQuestion.asked_count}回質問されました
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  回答 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="この質問に対する回答を入力してください..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  プロフィールカテゴリ（任意）
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  カテゴリを選択すると、動的プロフィールに自動追加されます
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedQuestion(null);
                  setAnswerText('');
                  setSelectedCategory('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={submitting || !answerText.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '登録中...' : '回答を登録'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
