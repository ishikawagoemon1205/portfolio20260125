/**
 * 記事タグ一覧取得API
 * 既存の全タグをユニークに取得
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // 全記事のタグを取得
    const { data: articles, error } = await (supabase as any)
      .from('articles')
      .select('tags')
      .not('tags', 'is', null);

    if (error) {
      throw error;
    }

    // タグをフラット化してユニークにする
    const allTags = new Set<string>();
    articles?.forEach((article: { tags: string[] }) => {
      article.tags?.forEach((tag: string) => {
        if (tag && tag.trim()) {
          allTags.add(tag.trim());
        }
      });
    });

    // 使用頻度でソート（オプション）
    const tagCounts = new Map<string, number>();
    articles?.forEach((article: { tags: string[] }) => {
      article.tags?.forEach((tag: string) => {
        if (tag && tag.trim()) {
          const trimmedTag = tag.trim();
          tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
        }
      });
    });

    const sortedTags = Array.from(allTags).sort((a, b) => {
      const countA = tagCounts.get(a) || 0;
      const countB = tagCounts.get(b) || 0;
      return countB - countA; // 使用頻度の高い順
    });

    return NextResponse.json({ tags: sortedTags });
  } catch (error) {
    console.error('タグ取得エラー:', error);
    return NextResponse.json({ error: 'タグの取得に失敗しました' }, { status: 500 });
  }
}
