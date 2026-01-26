/**
 * 会話履歴 API
 * 
 * GET /api/conversations - 訪問者の会話一覧を取得
 * GET /api/conversations/[id] - 特定の会話を取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateVisitorId, getOrCreateVisitor } from '@/lib/visitor';
import { createAdminClient } from '@/lib/supabase/server';
import type { Conversation, Message } from '@/types/database.types';

/**
 * 会話一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const visitorId = await getOrCreateVisitorId();
    const visitor = await getOrCreateVisitor(visitorId);
    
    if (!visitor) {
      return NextResponse.json(
        { error: '訪問者の識別に失敗しました' },
        { status: 500 }
      );
    }
    
    const supabase = await createAdminClient();
    
    // URLからクエリパラメータを取得
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // 会話一覧を取得
    const { data: conversations, error, count } = await (supabase as any)
      .from('conversations')
      .select('id, title, started_at, last_message_at', { count: 'exact' })
      .eq('visitor_id', visitor.visitorId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('会話取得エラー:', error);
      return NextResponse.json(
        { error: '会話の取得に失敗しました' },
        { status: 500 }
      );
    }
    
    // 各会話の最後のメッセージを取得
    const conversationsWithPreview = await Promise.all(
      (conversations || []).map(async (conv: Conversation) => {
        const { data: lastMessage } = await (supabase as any)
          .from('messages')
          .select('content, role, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return {
          id: conv.id,
          title: conv.title || '新しい会話',
          lastMessage: lastMessage ? {
            content: (lastMessage.content as string).slice(0, 100),
            role: lastMessage.role,
            createdAt: lastMessage.created_at,
          } : null,
          createdAt: conv.started_at,
          updatedAt: conv.last_message_at,
        };
      })
    );
    
    return NextResponse.json({
      conversations: conversationsWithPreview,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('会話一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
