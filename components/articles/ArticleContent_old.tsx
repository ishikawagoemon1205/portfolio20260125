/**
 * 記事コンテンツ表示コンポーネント
 * Markdown本文の表示とチャット誘導
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  tags: string[];
  related_experience_ids: string[];
  estimated_reading_time: number;
  published_at: string | null;
  view_count: number;
  thumbnail_url?: string | null;
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  tags: string[];
  published_at: string;
  view_count: number;
  estimated_reading_time: number;
}

interface ArticleContentProps {
  article: Article;
  relatedArticles: RelatedArticle[];
}

export function ArticleContent({ article, relatedArticles }: ArticleContentProps) {
  const [copied, setCopied] = useState(false);
  const [showFixedChat, setShowFixedChat] = useState(false);
  
  // スクロール位置を監視して固定ボタンを表示
  useState(() => {
    const handleScroll = () => {
      // ページの下部30%までスクロールしたら表示
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setShowFixedChat(scrollPosition > pageHeight * 0.3);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.subtitle || '',
          url,
        });
      } catch (err) {
        console.log('シェアがキャンセルされました', err);
      }
    } else {
      // フォールバック: URLをコピー
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <>
      {/* 記事一覧に戻るボタン */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          記事一覧に戻る
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8 flex flex-col lg:flex-row gap-8">
        {/* メインコンテンツ */}
        <article className="flex-1 min-w-0">
          {/* 記事ヘッダー */}
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm">コピーしました</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span className="text-sm">シェア</span>
                </>
              )}
            </button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              {article.subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatDate(article.published_at)}</span>
            <span>·</span>
            <span>📖 {article.estimated_reading_time}分で読めます</span>
            <span>·</span>
            <span>👁️ {article.view_count}回閲覧</span>
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  💻 {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 区切り線 */}
        <hr className="border-gray-200 dark:border-gray-700 mb-8" />

        {/* 記事本文 */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                  {children}
                </ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm text-pink-600 dark:text-pink-400"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="rounded-xl overflow-hidden my-6">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt || ''}
                  className="rounded-xl max-w-full h-auto my-6"
                />
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* 区切り線 */}
        <hr className="border-gray-200 dark:border-gray-700 my-8" />

        {/* CTA セクション */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl p-6 md:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            💬 この記事について質問する
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            記事の内容についてもっと詳しく知りたい方は、お気軽にチャットでお聞きください！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/?q=${encodeURIComponent(`「${article.title}」について質問があります`)}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              チャットで質問する
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              📧 仕事を依頼する
            </Link>
          </div>
        </div>

        {/* 関連する経験 */}
        {article.related_experience_ids.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              💼 関連する業務経験
            </h3>
            <ul className="space-y-2">
              {article.related_experience_ids.map((exp, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  {exp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </>
  );
}
