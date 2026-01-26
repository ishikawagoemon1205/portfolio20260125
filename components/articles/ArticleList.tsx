/**
 * 記事一覧コンポーネント
 * タグフィルター付き
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  tags: string[];
  thumbnail_url: string | null;
  estimated_reading_time: number;
  published_at: string | null;
  view_count: number;
}

export function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, [selectedTag]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTag) {
        params.set('tag', selectedTag);
      }
      params.set('limit', '20');

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (!res.ok) {
        throw new Error('記事の取得に失敗しました');
      }

      const data = await res.json();
      setArticles(data.articles);

      // 初回のみ全タグを収集
      if (allTags.length === 0) {
        const tags = new Set<string>();
        data.articles.forEach((article: Article) => {
          article.tags.forEach((tag) => tags.add(tag));
        });
        setAllTags(Array.from(tags).sort());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadArticles();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            🏷️ タグで絞り込み
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTag === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 記事一覧 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {selectedTag
              ? `「${selectedTag}」タグの記事はまだありません`
              : 'まだ記事がありません'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            記事が公開されるまでお待ちください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="block bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-lg transition-all group"
            >
              {/* サムネイル - 全幅表示 */}
              {article.thumbnail_url && (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={article.thumbnail_url}
                    alt={article.title}
                    width={800}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              {/* コンテンツ */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                  {article.title}
                </h3>
                {article.subtitle && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {article.subtitle}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatDate(article.published_at)}</span>
                  <span>·</span>
                  <span>📖 {article.estimated_reading_time}分</span>
                  <span>·</span>
                  <span>👁️ {article.view_count}</span>
                </div>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        💻 {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
