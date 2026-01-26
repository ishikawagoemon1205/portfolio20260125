/**
 * プロフィール設定API（AIの教師データ）
 * 
 * 管理画面で編集可能な基本プロフィール情報を管理
 * システムプロンプトの教師データとして使用される
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const SETTINGS_KEY = 'basic_profile';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any)
      .from('admin_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json(data?.value || null);
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const profile = await request.json();
    const supabase = await createAdminClient();

    const { error } = await (supabase as any)
      .from('admin_settings')
      .upsert({
        key: SETTINGS_KEY,
        value: profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('プロフィール保存エラー:', error);
    return NextResponse.json({ error: '設定の保存に失敗しました' }, { status: 500 });
  }
}
