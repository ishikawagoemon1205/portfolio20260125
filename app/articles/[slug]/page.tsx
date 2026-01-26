/**
 * 記事詳細ページ
 * Markdown記事を表示、チャットへの誘導ボタン付き
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { ArticleContent } from '@/components/articles/ArticleContent';
import { Header } from '@/components/layout/Header';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const supabase = await createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: article, error } = await (supabase as any)
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  
  if (error || !article) {
    return null;
  }
  
  // 閲覧数をインクリメント（サーバーサイドで）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', article.id);
  
  return article;
}

async function getRelatedArticles(currentArticleId: string, tags: string[], publishedAt: string) {
  const supabase = await createAdminClient();
  
  // タグが一致する記事、または作成日が近い記事を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: articles } = await (supabase as any)
    .from('articles')
    .select('id, slug, title, subtitle, thumbnail_url, tags, published_at, view_count, estimated_reading_time')
    .eq('is_published', true)
    .neq('id', currentArticleId)
    .order('published_at', { ascending: false })
    .limit(20);
  
  if (!articles || articles.length === 0) {
    return [];
  }
  
  // スコアリング: タグの一致数と日付の近さで関連度を計算
  const scoredArticles = articles.map((article: any) => {
    let score = 0;
    
    // タグの一致数
    const matchingTags = article.tags?.filter((tag: string) => tags.includes(tag)) || [];
    score += matchingTags.length * 10;
    
    // 作成日の近さ（日数の差が小さいほど高スコア）
    const daysDiff = Math.abs(
      (new Date(article.published_at).getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.max(0, 10 - daysDiff / 10);
    
    return { ...article, score };
  });
  
  // スコアでソートして上位5件を返す
  return scoredArticles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    return {
      title: '記事が見つかりません | あっちゃんAI',
    };
  }
  
  return {
    title: `${article.title} | あっちゃんAI`,
    description: article.subtitle || article.content.substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.subtitle || article.content.substring(0, 160),
      type: 'article',
      publishedTime: article.published_at,
      images: article.thumbnail_url ? [article.thumbnail_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    notFound();
  }
  
  // 関連記事を取得
  const relatedArticles = await getRelatedArticles(
    article.id,
    article.tags || [],
    article.published_at
  );
  
  return (
    <>
      {/* ヘッダーナビゲーション */}
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <ArticleContent article={article} relatedArticles={relatedArticles} />
      </main>
    </>
  );
}
