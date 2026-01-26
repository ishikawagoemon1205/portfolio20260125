/**
 * AI設定API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const SETTINGS_KEY = 'ai_settings';

interface SettingsRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

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
    console.error('AI設定取得エラー:', error);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json();
    const supabase = await createAdminClient();

    const row: SettingsRow = {
      key: SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from('admin_settings')
      .upsert(row, { onConflict: 'key' });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI設定保存エラー:', error);
    return NextResponse.json({ error: '設定の保存に失敗しました' }, { status: 500 });
  }
}
