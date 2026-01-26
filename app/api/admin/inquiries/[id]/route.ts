/**
 * 問い合わせ更新API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const supabase = await createAdminClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await (supabase as any)
      .from('inquiries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('問い合わせ更新エラー:', error);
      return NextResponse.json(
        { error: '更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('問い合わせ更新APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any)
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: '問い合わせが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('問い合わせ取得APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
