/**
 * 公開用記事一覧・詳細API
 * 
 * GET /api/articles - 公開記事一覧
 * GET /api/articles?slug=xxx - 記事詳細（スラッグ指定）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const slug = searchParams.get('slug');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // スラッグ指定の場合は単一記事を取得
    if (slug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: article, error } = await (supabase as any)
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (error || !article) {
        return NextResponse.json(
          { error: '記事が見つかりません' },
          { status: 404 }
        );
      }
      
      // 閲覧数をインクリメント
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('articles')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('id', article.id);
      
      return NextResponse.json({ article });
    }
    
    // 記事一覧を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('articles')
      .select('id, slug, title, subtitle, tags, thumbnail_url, estimated_reading_time, published_at, view_count', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // タグフィルター
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    const { data: articles, error, count } = await query;
    
    if (error) {
      console.error('記事一覧取得エラー:', error);
      return NextResponse.json(
        { error: '記事の取得に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      articles: articles || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
