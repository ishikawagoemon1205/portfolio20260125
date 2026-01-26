/**
 * プロフィールデータ管理API
 * 
 * 動的プロフィール情報（6カテゴリ）のCRUD操作
 * 優先度ロジックに基づいてチャットで使用される
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * プロフィールデータ一覧を取得
 */
export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any)
      .from('profile_data')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
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
        priority: item.priority || 1,
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
        priority: item.priority,
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
