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
import { streamChatResponse, convertDBMessagesToChatFormat, checkKnowledge, generateUnavailableResponse, type ChatMessage } from '@/lib/openai';
import { recordUsage } from '@/lib/analytics';
import { getRandomAvatar } from '@/lib/profile/get-avatar';
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
    
    // メッセージ制限チェック（この時点でカウントが1増える）
    const messageLimitResult = await checkMessageRateLimit(visitor.visitorId, visitor.tier, ip);
    if (!messageLimitResult.success) {
      return errorResponse(
        `本日のメッセージ上限に達しました。${messageLimitResult.reset ? `リセットまで: ${Math.ceil((messageLimitResult.reset - Date.now()) / 1000 / 60)}分` : ''}`,
        429
      );
    }
    
    // チェック後の残りメッセージ数を保存
    const remainingMessagesAfterCheck = messageLimitResult.remaining;
    console.log('[Chat API] レート制限チェック完了:', {
      success: messageLimitResult.success,
      limit: messageLimitResult.limit,
      remaining: remainingMessagesAfterCheck,
      tier: visitor.tier
    });
    
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
    
    // 🎯 2段階判定: 質問がプロフィール情報で回答可能かチェック
    const conversationContext = chatMessages
      .slice(-6) // 直近6メッセージを文脈として使用
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    const knowledgeCheck = await checkKnowledge(message, conversationContext);
    console.log('[Chat API] 知識判定結果:', {
      canAnswer: knowledgeCheck.canAnswer,
      confidence: knowledgeCheck.confidence,
      reason: knowledgeCheck.reason,
      shouldRecord: knowledgeCheck.shouldRecord
    });
    
    // 未回答質問として記録が必要な場合
    if (knowledgeCheck.shouldRecord) {
      try {
        await (supabase as any)
          .from('unanswered_questions')
          .upsert({
            question: message,
            conversation_id: conversationId,
            asked_count: 1,
            last_asked_at: new Date().toISOString(),
          }, {
            onConflict: 'question',
            ignoreDuplicates: false,
          });
        console.log('[Chat API] 未回答質問を記録:', message.slice(0, 50));
      } catch (recordError) {
        // 記録失敗は無視（テーブルがない場合など）
        console.warn('[Chat API] 未回答質問の記録に失敗:', recordError);
      }
    }
    
    // ストリーミングレスポンスを生成
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 回答不可の場合は定型文を返す
          if (!knowledgeCheck.canAnswer) {
            const unavailableMsg = generateUnavailableResponse(knowledgeCheck, 'casual');
            fullResponse = unavailableMsg;
            
            // チャンクとして送信
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', conversationId })}\n\n`)
            );
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: unavailableMsg })}\n\n`)
            );
            
            // AIレスポンスを保存
            const { data: aiMessage } = await (supabase as any)
              .from('messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse,
                tokens_used: 0,
              })
              .select()
              .single();
            
            // メッセージ数を更新
            await incrementMessageCount(visitor.visitorId);
            
            // アバター画像を取得
            const avatarInfo = await getRandomAvatar();
            
            // 完了イベント
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'done', 
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                messageId: aiMessage?.id,
                remainingMessages: remainingMessagesAfterCheck,
                avatarUrl: avatarInfo?.url || null,
                isUnavailable: true, // 未回答フラグ
              })}\n\n`)
            );
            
            controller.close();
            return;
          }
          
          // 通常の回答生成
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
          
          // アバター画像を取得
          const avatarInfo = await getRandomAvatar();
          
          // 完了イベント（残りメッセージ数はチェック時の値を使用）
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              usage: finalResult.usage,
              messageId: aiMessage?.id,
              remainingMessages: remainingMessagesAfterCheck,
              avatarUrl: avatarInfo?.url || null,
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
