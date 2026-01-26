/**
 * サイト生成 API
 * 
 * POST /api/generate-site
 * 
 * リクエスト:
 * - conversationId: 会話ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOrCreateVisitorId, getOrCreateVisitor } from '@/lib/visitor';
import { checkSiteGenerationRateLimit } from '@/lib/rate-limit';
import { getClientIP, detectBot } from '@/lib/security';
import { generatePersonalizedSite } from '@/lib/openai';
import type { Visitor } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, fingerprint } = body;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: '会話IDが必要です' },
        { status: 400 }
      );
    }
    
    // IPアドレスを取得
    const ip = await getClientIP();
    
    // Bot検知
    const botResult = await detectBot();
    if (botResult.isBot && botResult.score >= 80) {
      return NextResponse.json(
        { error: 'アクセスが拒否されました' },
        { status: 403 }
      );
    }
    
    // 訪問者IDを取得
    const visitorId = await getOrCreateVisitorId();
    
    // 訪問者を取得
    const visitor = await getOrCreateVisitor(visitorId, fingerprint);
    
    if (!visitor) {
      return NextResponse.json(
        { error: '訪問者の識別に失敗しました' },
        { status: 500 }
      );
    }
    
    if (visitor.isBlocked) {
      return NextResponse.json(
        { error: 'アクセスがブロックされています' },
        { status: 403 }
      );
    }
    
    // サイト生成制限チェック
    const siteLimit = await checkSiteGenerationRateLimit(visitor.visitorId, visitor.tier, ip);
    if (!siteLimit.success) {
      return NextResponse.json(
        { 
          error: '本日のサイト生成上限に達しました',
          remaining: siteLimit.remaining,
          reset: siteLimit.reset
        },
        { status: 429 }
      );
    }
    
    const supabase = await createAdminClient();
    
    // 会話が訪問者に属しているか確認
    const { data: conversation, error: convError } = await (supabase as any)
      .from('conversations')
      .select('id, visitor_id')
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
    
    // サイト生成
    const result = await generatePersonalizedSite({
      conversationId,
      visitorId: visitor.visitorId,
      visitorName: visitor.name || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'サイト生成に失敗しました' },
        { status: 500 }
      );
    }
    
    // 訪問者のサイト生成数を更新
    await (supabase as any)
      .from('visitors')
      .update({
        total_sites_generated: (visitor.totalMessages || 0) + 1,
      })
      .eq('visitor_id', visitor.visitorId);
    
    return NextResponse.json({
      success: true,
      siteId: result.siteId,
      uniqueUrl: result.uniqueUrl,
      htmlContent: result.htmlContent,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('サイト生成APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
