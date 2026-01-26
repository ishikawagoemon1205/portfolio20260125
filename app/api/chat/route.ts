/**
 * Chat API - ストリーミングレスポンス
 * 
 * POST /api/chat
 * 
 * リクエスト:
 * - message: ユーザーメッセージ
 * - conversationId: 会話ID（オプション、新規の場合は作成）
 * - fingerprint: ブラウザフィンガープリント（オプション）
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOrCreateVisitorId, getOrCreateVisitor, incrementMessageCount } from '@/lib/visitor';
import { checkMessageRateLimit } from '@/lib/rate-limit';
import { getClientIP, detectBot } from '@/lib/security';
import { streamChatResponse, convertDBMessagesToChatFormat, type ChatMessage } from '@/lib/openai';
import { recordUsage } from '@/lib/analytics';
import type { Message, Conversation } from '@/types/database.types';

// Edge Runtimeを使わず、Node.jsランタイムで実行（Supabaseクライアントの互換性のため）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * エラーレスポンスを生成
 */
function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    const { message, conversationId: inputConversationId, fingerprint } = body;
    
    if (!message || typeof message !== 'string') {
      return errorResponse('メッセージが必要です', 400);
    }
    
    if (message.length > 2000) {
      return errorResponse('メッセージが長すぎます（2000文字以内）', 400);
    }
    
    // IPアドレスを取得
    const ip = await getClientIP();
    
    // Bot検知
    const botResult = await detectBot();
    if (botResult.isBot && botResult.score >= 80) {
      return errorResponse('アクセスが拒否されました', 403);
    }
    
    // 訪問者IDを取得
    const visitorId = await getOrCreateVisitorId();
    
    // 訪問者を取得または作成
    const visitor = await getOrCreateVisitor(visitorId, fingerprint);
    
    if (!visitor) {
      return errorResponse('訪問者の識別に失敗しました', 500);
    }
    
    if (visitor.isBlocked) {
      return errorResponse('アクセスがブロックされています', 403);
    }
    
    // メッセージ制限チェック
    const messageLimitResult = await checkMessageRateLimit(visitor.visitorId, visitor.tier, ip);
    if (!messageLimitResult.success) {
      return errorResponse(
        `本日のメッセージ上限に達しました。${messageLimitResult.reset ? `リセットまで: ${Math.ceil((messageLimitResult.reset - Date.now()) / 1000 / 60)}分` : ''}`,
        429
      );
    }
    
    const supabase = await createAdminClient();
    let conversationId = inputConversationId;
    let messageCount = 1;
    
    // 会話を取得または作成
    if (conversationId) {
      // 既存の会話を確認
      const { data: existingConversation, error } = await (supabase as any)
        .from('conversations')
        .select('id, character_pattern_id')
        .eq('id', conversationId)
        .eq('visitor_id', visitor.visitorId)
        .single();
      
      if (error || !existingConversation) {
        // 会話が存在しないか、別のユーザーの会話の場合は新規作成
        conversationId = null;
      } else {
        // メッセージ数を取得
        const { count } = await (supabase as any)
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conversationId);
        
        messageCount = (count || 0) + 1;
      }
    }
    
    // 新規会話を作成
    if (!conversationId) {
      const { data: newConversation, error: createError } = await (supabase as any)
        .from('conversations')
        .insert({
          visitor_id: visitor.visitorId,
          title: message.slice(0, 50),
        })
        .select()
        .single();
      
      if (createError || !newConversation) {
        console.error('会話作成エラー:', createError);
        return errorResponse('会話の作成に失敗しました', 500);
      }
      
      conversationId = newConversation.id;
    }
    
    // ユーザーメッセージを保存
    const { data: userMessage, error: userMessageError } = await (supabase as any)
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      })
      .select()
      .single();
    
    if (userMessageError) {
      console.error('メッセージ保存エラー:', userMessageError);
      return errorResponse('メッセージの保存に失敗しました', 500);
    }
    
    // 過去のメッセージを取得
    const { data: pastMessages, error: pastMessagesError } = await (supabase as any)
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);
    
    // デバッグログ
    console.log('[Chat API] 過去メッセージ取得:', { 
      conversationId, 
      messageCount: pastMessages?.length || 0,
      error: pastMessagesError,
      messages: pastMessages?.map((m: any) => ({ role: m.role, contentPreview: m.content?.slice(0, 30) }))
    });
    
    const chatMessages: ChatMessage[] = convertDBMessagesToChatFormat(pastMessages || []);
    
    console.log('[Chat API] OpenAIに送信するメッセージ数:', chatMessages.length);
    
    // ストリーミングレスポンスを生成
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatResponse({
            conversationId,
            messages: chatMessages,
            visitorName: visitor.name || undefined,
            messageCount,
          });
          
          // 会話IDを最初に送信
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', conversationId })}\n\n`)
          );
          
          let result = await generator.next();
          
          while (!result.done) {
            const chunk = result.value;
            fullResponse += chunk;
            
            // Server-Sent Events形式で送信
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
            );
            
            result = await generator.next();
          }
          
          // 最終結果（usage情報）
          const finalResult = result.value;
          
          console.log('[Chat API] AIメッセージ保存開始:', {
            conversationId,
            contentLength: fullResponse.length,
            tokensUsed: finalResult.usage.totalTokens
          });
          
          // AIレスポンスを保存
          const { data: aiMessage, error: aiMessageError } = await (supabase as any)
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
              tokens_used: finalResult.usage.totalTokens,
            })
            .select()
            .single();
          
          if (aiMessageError) {
            console.error('[Chat API] AIメッセージ保存エラー:', aiMessageError);
          } else {
            console.log('[Chat API] AIメッセージ保存成功:', {
              messageId: aiMessage?.id,
              role: aiMessage?.role
            });
          }
          
          if (!aiMessageError && aiMessage) {
            // 使用量を記録
            await recordUsage({
              messageId: aiMessage.id,
              conversationId,
              visitorId: visitor.visitorId,
              model: 'gpt-4o-mini',
              promptTokens: finalResult.usage.promptTokens,
              completionTokens: finalResult.usage.completionTokens,
              purpose: 'chat',
            });
          }
          
          // メッセージ数を更新
          await incrementMessageCount(visitor.visitorId);
          
          // 完了イベント
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              usage: finalResult.usage,
              messageId: aiMessage?.id 
            })}\n\n`)
          );
          
          controller.close();
        } catch (error) {
          console.error('ストリーミングエラー:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'AIレスポンスの生成中にエラーが発生しました' 
            })}\n\n`)
          );
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Conversation-Id': conversationId,
      },
    });
  } catch (error) {
    console.error('Chat API エラー:', error);
    return errorResponse('サーバーエラーが発生しました', 500);
  }
}
