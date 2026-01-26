/**
 * 記事が見つからない場合のページ
 */

import Link from 'next/link';

export default function ArticleNotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          記事が見つかりません
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          お探しの記事は存在しないか、非公開になっています。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/articles"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            記事一覧へ
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
