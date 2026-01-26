/**
 * 特定の会話詳細 API
 * 
 * GET /api/conversations/[id] - 会話のメッセージ一覧を取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateVisitorId, getOrCreateVisitor } from '@/lib/visitor';
import { createAdminClient } from '@/lib/supabase/server';
import type { Message } from '@/types/database.types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    
    const visitorId = await getOrCreateVisitorId();
    const visitor = await getOrCreateVisitor(visitorId);
    
    if (!visitor) {
      return NextResponse.json(
        { error: '訪問者の識別に失敗しました' },
        { status: 500 }
      );
    }
    
    const supabase = await createAdminClient();
    
    // 会話を取得（訪問者の所有確認）
    const { data: conversation, error: convError } = await (supabase as any)
      .from('conversations')
      .select('id, title, started_at, last_message_at, visitor_id, character_pattern_id')
      .eq('id', conversationId)
      .single();
    
    if (convError || !conversation) {
      return NextResponse.json(
        { error: '会話が見つかりません' },
        { status: 404 }
      );
    }
    
    if (conversation.visitor_id !== visitor.visitorId) {
      return NextResponse.json(
        { error: 'この会話にアクセスする権限がありません' },
        { status: 403 }
      );
    }
    
    // メッセージを取得
    const { data: messages, error: msgError } = await (supabase as any)
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (msgError) {
      console.error('メッセージ取得エラー:', msgError);
      return NextResponse.json(
        { error: 'メッセージの取得に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      id: conversation.id,
      title: conversation.title || '会話',
      characterPatternId: conversation.character_pattern_id,
      messages: (messages || []).map((msg: Message) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
      createdAt: conversation.started_at,
      updatedAt: conversation.last_message_at,
    });
  } catch (error) {
    console.error('会話詳細取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
