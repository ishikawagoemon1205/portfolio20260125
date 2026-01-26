/**
 * 記事管理一覧ページ
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin';

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/articles');
      if (!res.ok) throw new Error('記事の取得に失敗しました');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('記事読み込みエラー:', error);
      setMessage({ type: 'error', text: '記事の取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (article: Article) => {
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article.id,
          is_published: !article.is_published,
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      setMessage({
        type: 'success',
        text: article.is_published ? '非公開にしました' : '公開しました',
      });
      loadArticles();
    } catch (error) {
      console.error('公開状態変更エラー:', error);
      setMessage({ type: 'error', text: '更新に失敗しました' });
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;

    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('削除に失敗しました');
      
      setMessage({ type: 'success', text: '削除しました' });
      loadArticles();
    } catch (error) {
      console.error('削除エラー:', error);
      setMessage({ type: 'error', text: '削除に失敗しました' });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <PageHeader
        title="記事管理"
        description="技術記事の作成・編集・公開設定を行います"
      />

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* アクション */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">
          {articles.length}件の記事
        </p>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
        >
          <span>➕</span>
          <span>新規作成</span>
        </Link>
      </div>

      {/* 記事一覧 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            📝 まだ記事がありません
          </p>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            最初の記事を作成する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        article.is_published
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {article.is_published ? '公開中' : '下書き'}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {article.title}
                    </h3>
                  </div>
                  {article.subtitle && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">
                      {article.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>作成: {formatDate(article.created_at)}</span>
                    {article.is_published && (
                      <>
                        <span>公開: {formatDate(article.published_at)}</span>
                        <span>👁️ {article.view_count}回</span>
                      </>
                    )}
                  </div>
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(article)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      article.is_published
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {article.is_published ? '非公開にする' : '公開する'}
                  </button>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    編集
                  </Link>
                  {article.is_published && (
                    <Link
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      表示
                    </Link>
                  )}
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
