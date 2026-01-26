/**
 * 会話のメッセージ取得API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: messages, error } = await (supabase as any)
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('メッセージ取得エラー:', error);
      return NextResponse.json({ error: 'メッセージの取得に失敗しました' }, { status: 500 });
    }

    console.log('[Admin] メッセージ取得:', {
      conversationId: id,
      count: messages?.length || 0,
      roles: messages?.map((m: any) => m.role)
    });

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('メッセージ取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
