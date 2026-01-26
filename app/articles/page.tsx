/**
 * 記事一覧ページ
 * 公開中の技術記事を一覧表示
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { ArticleList } from '@/components/articles/ArticleList';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: '技術記事 | あっちゃんAI',
  description: 'フリーランスエンジニア 石川敦大の技術記事一覧。Web開発、React、TypeScript、Next.jsなどについて発信しています。',
};

export default function ArticlesPage() {
  return (
    <>
      {/* ヘッダーナビゲーション */}
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* メインコンテンツ */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Suspense fallback={<ArticleListSkeleton />}>
            <ArticleList />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function ArticleListSkeleton() {
  return (
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
  );
}
