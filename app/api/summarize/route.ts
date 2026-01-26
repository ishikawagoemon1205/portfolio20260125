/**
 * 会話要約 API
 * 
 * POST /api/summarize - チャット履歴から問い合わせ内容を要約
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeConversation, type ChatMessage } from '@/lib/openai/summarize';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }
    
    // メッセージを適切な形式に変換
    const chatMessages: ChatMessage[] = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    
    const summary = await summarizeConversation(chatMessages);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('要約APIエラー:', error);
    return NextResponse.json(
      { error: '要約に失敗しました' },
      { status: 500 }
    );
  }
}
