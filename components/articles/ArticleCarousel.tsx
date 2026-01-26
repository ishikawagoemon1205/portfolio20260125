/**
 * 記事カルーセルコンポーネント
 * ホーム画面に表示するスワイプ可能な記事カード
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Swiperのスタイル
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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

export function ArticleCarousel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const res = await fetch('/api/articles?limit=10');
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('記事の読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 記事がない場合は表示しない
  if (!loading && articles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto">
        {/* セクションヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📚 技術記事
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              最新の技術記事をチェック
            </p>
          </div>
          <Link
            href="/articles"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            すべて見る
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* カルーセル */}
        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-80 shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="article-carousel"
          >
            {articles.map((article) => (
              <SwiperSlide key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="block h-full bg-white dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xl transition-all group"
                >
                  {/* サムネイル（あれば） */}
                  {article.thumbnail_url && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.thumbnail_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  {/* タイトル */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  {/* サブタイトル */}
                  {article.subtitle && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {article.subtitle}
                    </p>
                  )}
                  
                  {/* メタ情報 */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>{formatDate(article.published_at)}</span>
                    <span>·</span>
                    <span>📖 {article.estimated_reading_time}分</span>
                    <span>·</span>
                    <span>👁️ {article.view_count}</span>
                  </div>
                  
                  {/* タグ */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {/* カスタムスタイル */}
      <style jsx global>{`
        .article-carousel .swiper-button-next,
        .article-carousel .swiper-button-prev {
          color: #3b82f6;
          background: rgba(255, 255, 255, 0.9);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .article-carousel .swiper-button-next::after,
        .article-carousel .swiper-button-prev::after {
          font-size: 18px;
          font-weight: bold;
        }

        .dark .article-carousel .swiper-button-next,
        .dark .article-carousel .swiper-button-prev {
          background: rgba(31, 41, 55, 0.9);
        }

        .article-carousel .swiper-pagination-bullet {
          background: #9ca3af;
          opacity: 1;
        }

        .article-carousel .swiper-pagination-bullet-active {
          background: #3b82f6;
        }

        .article-carousel .swiper-slide {
          height: auto;
        }

        .article-carousel .swiper-slide > a {
          height: 100%;
        }
      `}</style>
    </section>
  );
}
