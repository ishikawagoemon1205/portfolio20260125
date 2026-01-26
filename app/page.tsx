/**
 * トップページ - あっちゃんAI ポートフォリオ
 */

import { Suspense } from 'react';
import { ChatSection } from '@/components/sections/ChatSection';
import { HeroSection } from '@/components/sections/HeroSection';
import { ArticleCarousel } from '@/components/articles/ArticleCarousel';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  return (
    <>
      {/* ヘッダーナビゲーション */}
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* ヒーローセクション */}
        <HeroSection />
        
        {/* チャットセクション */}
        <Suspense fallback={<ChatSectionSkeleton />}>
          <ChatSection />
        </Suspense>
        
        {/* 記事カルーセル */}
        <Suspense fallback={<ArticleCarouselSkeleton />}>
          <ArticleCarousel />
        </Suspense>
      </main>
    </>
  );
}

function ChatSectionSkeleton() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    </section>
  );
}

function ArticleCarouselSkeleton() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8 animate-pulse" />
        <div className="flex gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-80 shrink-0 bg-gray-100 dark:bg-gray-800 rounded-2xl h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
