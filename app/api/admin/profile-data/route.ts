/**
 * プロフィールデータ管理API
 * 
 * 動的プロフィール情報のCRUD操作
 * ページネーション対応、カテゴリでフィルタリング可能
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * プロフィールデータ一覧を取得（ページネーション対応）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    const supabase = await createAdminClient();

    // 総件数を取得
    let countQuery = (supabase as any)
      .from('profile_data')
      .select('*', { count: 'exact', head: true });
    
    if (category) {
      countQuery = countQuery.eq('category', category);
    }
    if (search) {
      countQuery = countQuery.or(`key.ilike.%${search}%,value.ilike.%${search}%`);
    }
    
    const { count } = await countQuery;
    
    // データを取得
    let dataQuery = (supabase as any)
      .from('profile_data')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (category) {
      dataQuery = dataQuery.eq('category', category);
    }
    if (search) {
      dataQuery = dataQuery.or(`key.ilike.%${search}%,value.ilike.%${search}%`);
    }
    
    const { data, error } = await dataQuery;

    if (error) {
      throw error;
    }

    // カテゴリ一覧を取得
    const { data: allData } = await (supabase as any)
      .from('profile_data')
      .select('category');
    
    const uniqueCategories = [...new Set((allData || []).map((item: { category: string }) => item.category))];

    return NextResponse.json({
      items: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      categories: uniqueCategories,
    });
  } catch (error) {
    console.error('プロフィールデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * プロフィールデータを追加
 */
export async function POST(request: NextRequest) {
  try {
    const item = await request.json();
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any)
      .from('profile_data')
      .insert({
        category: item.category,
        key: item.key,
        value: item.value,
        display_order: item.display_order || 0,
        weight: item.weight || 1.0,
        is_active: item.is_active !== false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('プロフィールデータ追加エラー:', error);
    return NextResponse.json(
      { error: 'データの追加に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * プロフィールデータを更新
 */
export async function PUT(request: NextRequest) {
  try {
    const item = await request.json();
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any)
      .from('profile_data')
      .update({
        category: item.category,
        key: item.key,
        value: item.value,
        display_order: item.display_order,
        weight: item.weight,
        is_active: item.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('プロフィールデータ更新エラー:', error);
    return NextResponse.json(
      { error: 'データの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * プロフィールデータを削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const { error } = await (supabase as any)
      .from('profile_data')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('プロフィールデータ削除エラー:', error);
    return NextResponse.json(
      { error: 'データの削除に失敗しました' },
      { status: 500 }
    );
  }
}
