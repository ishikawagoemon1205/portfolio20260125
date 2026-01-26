/**
 * 管理用記事API
 * 
 * GET    /api/admin/articles - 全記事一覧（下書き含む）
 * POST   /api/admin/articles - 記事作成
 * PUT    /api/admin/articles - 記事更新
 * DELETE /api/admin/articles?id=xxx - 記事削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// スラッグ生成ヘルパー
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 特殊文字削除
    .replace(/\s+/g, '-')      // スペースをハイフンに
    .replace(/-+/g, '-')       // 連続ハイフンを単一に
    .trim();
}

// 読了時間計算（日本語対応）
function calculateReadingTime(content: string): number {
  const charCount = content.length;
  const wordsPerMinute = 500; // 日本語は1分間約500文字
  return Math.max(1, Math.ceil(charCount / wordsPerMinute));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    
    // ID指定の場合は単一記事を取得
    if (id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: article, error } = await (supabase as any)
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !article) {
        return NextResponse.json(
          { error: '記事が見つかりません' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ article });
    }
    
    // 全記事一覧（下書き含む）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: articles, error } = await (supabase as any)
      .from('articles')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('記事一覧取得エラー:', error);
      return NextResponse.json(
        { error: '記事の取得に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ articles: articles || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    
    const {
      title,
      subtitle,
      content,
      tags = [],
      related_experience_ids = [],
      thumbnail_url,
      is_published = false,
    } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }
    
    // スラッグ生成（重複チェック）
    let slug = body.slug || generateSlug(title);
    
    // 重複チェック
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('articles')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    
    const estimated_reading_time = calculateReadingTime(content || '');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error } = await (supabase as any)
      .from('articles')
      .insert({
        slug,
        title,
        subtitle,
        content: content || '',
        tags,
        related_experience_ids,
        thumbnail_url,
        estimated_reading_time,
        is_published,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('記事作成エラー:', error);
      return NextResponse.json(
        { error: '記事の作成に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      );
    }
    
    // 読了時間を再計算
    if (updateData.content) {
      updateData.estimated_reading_time = calculateReadingTime(updateData.content);
    }
    
    // 公開状態が変わった場合
    if (updateData.is_published === true) {
      // 公開日時を設定（初回公開時のみ）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: current } = await (supabase as any)
        .from('articles')
        .select('published_at')
        .eq('id', id)
        .single();
      
      if (!current?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    
    updateData.updated_at = new Date().toISOString();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error } = await (supabase as any)
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('記事更新エラー:', error);
      return NextResponse.json(
        { error: '記事の更新に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ article });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      );
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('記事削除エラー:', error);
      return NextResponse.json(
        { error: '記事の削除に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
