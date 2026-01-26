/**
 * チャットセクション
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChatContainer } from '@/components/chat';

// 記事の型定義
interface ArticleInfo {
  slug: string;
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  tags?: string[];
}

export function ChatSection() {
  const searchParams = useSearchParams();
  const articleSlug = searchParams.get('article');
  const [articleInfo, setArticleInfo] = useState<ArticleInfo | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  // URLパラメータから記事情報を取得
  useEffect(() => {
    async function fetchArticleInfo() {
      if (!articleSlug) {
        setArticleInfo(null);
        return;
      }

      setIsLoadingArticle(true);
      try {
        const res = await fetch(`/api/articles?slug=${encodeURIComponent(articleSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.article) {
            setArticleInfo({
              slug: data.article.slug,
              title: data.article.title,
              subtitle: data.article.subtitle,
              thumbnail_url: data.article.thumbnail_url,
              tags: data.article.tags,
            });
          }
        }
      } catch (error) {
        console.error('記事情報の取得に失敗:', error);
      } finally {
        setIsLoadingArticle(false);
      }
    }
    fetchArticleInfo();
  }, [articleSlug]);

  // 記事情報が取得完了したら自動スクロール
  useEffect(() => {
    if (articleInfo && !isLoadingArticle) {
      // 0.3秒待ってからスクロール（画面が表示し切ってから）
      const timer = setTimeout(() => {
        const chatSection = document.getElementById('chat');
        if (chatSection) {
          chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [articleInfo, isLoadingArticle]);

  // 記事カードを閉じる
  const handleCloseArticle = () => {
    setArticleInfo(null);
    // URLからarticleパラメータを削除
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  return (
    <section id="chat" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* セクションタイトル */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            💬 チャットで相談
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            お仕事のご依頼、技術的なご質問など、なんでもお気軽にどうぞ
          </p>
        </motion.div>
        
        {/* チャットコンテナ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden
            h-[500px] md:h-[700px]"
        >
          {/* 記事読み込み中は待機 */}
          {articleSlug && isLoadingArticle ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">記事情報を読み込み中...</span>
            </div>
          ) : (
            <ChatContainer 
              articleInfo={articleInfo}
              onCloseArticle={handleCloseArticle}
              isLoadingArticle={isLoadingArticle}
            />
          )}
        </motion.div>
        
        {/* 補足情報（削除） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
          style={{ display: 'none' }}
        >
          <p>
            ※ このAIは石川敦大のプロフィール情報を学習しています。
            <br />
            正確な情報は直接お問い合わせください。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
