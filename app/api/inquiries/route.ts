/**
 * 問い合わせ API
 * 
 * POST /api/inquiries - 新規問い合わせを作成
 * GET /api/inquiries - 問い合わせ一覧取得（管理者用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateVisitorId, getOrCreateVisitor } from '@/lib/visitor';
import { createAdminClient } from '@/lib/supabase/server';
import type { InquiryInsert } from '@/types/database.types';

interface InquiryRequest {
  email: string;
  name?: string;
  company?: string;
  summary: string;
  projectType?: string;
  budgetRange?: string;
  timeline?: string;
  details?: string;
  conversationId?: string;
}

/**
 * 問い合わせを作成
 */
export async function POST(request: NextRequest) {
  try {
    const visitorId = await getOrCreateVisitorId();
    const visitor = await getOrCreateVisitor(visitorId);
    
    if (!visitor) {
      return NextResponse.json(
        { error: '訪問者の識別に失敗しました' },
        { status: 500 }
      );
    }
    
    const body: InquiryRequest = await request.json();
    
    // バリデーション
    if (!body.email || !body.email.includes('@')) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }
    
    if (!body.summary || body.summary.length < 10) {
      return NextResponse.json(
        { error: 'お問い合わせ内容を10文字以上で入力してください' },
        { status: 400 }
      );
    }
    
    const supabase = await createAdminClient();
    
    // 問い合わせを保存
    const inquiryData: InquiryInsert = {
      visitor_id: visitor.visitorId,
      conversation_id: body.conversationId || null,
      email: body.email,
      name: body.name || null,
      company: body.company || null,
      summary: body.summary,
      project_type: body.projectType || null,
      budget_range: body.budgetRange || null,
      timeline: body.timeline || null,
      details: body.details || null,
      status: 'new',
    };
    
    const { data: inquiry, error } = await (supabase as any)
      .from('inquiries')
      .insert(inquiryData)
      .select()
      .single();
    
    if (error) {
      console.error('問い合わせ保存エラー:', error);
      return NextResponse.json(
        { error: '問い合わせの保存に失敗しました' },
        { status: 500 }
      );
    }
    
    // 訪問者のメールアドレスを更新
    if (body.email) {
      await (supabase as any)
        .from('visitors')
        .update({ 
          email: body.email,
          name: body.name || null,
        })
        .eq('visitor_id', visitor.visitorId);
    }
    
    // 会話のステータスを更新（問い合わせ済みとしてマーク）
    if (body.conversationId) {
      await (supabase as any)
        .from('conversations')
        .update({ 
          status: 'inquiry_submitted',
          metadata: { inquiry_id: inquiry.id }
        })
        .eq('id', body.conversationId);
    }
    
    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      message: 'お問い合わせを受け付けました。ご連絡をお待ちください！',
    });
  } catch (error) {
    console.error('問い合わせ作成エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 問い合わせ一覧を取得（管理者用）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    let query = (supabase as any)
      .from('inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: inquiries, error, count } = await query;
    
    if (error) {
      console.error('問い合わせ取得エラー:', error);
      return NextResponse.json(
        { error: '問い合わせの取得に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      inquiries: inquiries || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('問い合わせ一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
