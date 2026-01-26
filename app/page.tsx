/**
 * トップページ - あっちゃんAI ポートフォリオ
 */

import { Suspense } from 'react';
import { ChatSection } from '@/components/sections/ChatSection';
import { HeroSection } from '@/components/sections/HeroSection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* ヒーローセクション */}
      <HeroSection />
      
      {/* チャットセクション */}
      <Suspense fallback={<ChatSectionSkeleton />}>
        <ChatSection />
      </Suspense>
    </main>
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
