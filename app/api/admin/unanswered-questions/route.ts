/**
 * 未回答質問一覧取得・回答登録API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET: 未回答質問一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const sortBy = searchParams.get('sortBy') || 'asked_count';
    const order = searchParams.get('order') || 'desc';
    
    const supabase = await createAdminClient();
    
    let query = (supabase as any)
      .from('unanswered_questions')
      .select('*');
    
    // ステータスでフィルタ
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // ソート
    if (sortBy === 'asked_count') {
      query = query.order('asked_count', { ascending: order === 'asc' });
    } else if (sortBy === 'last_asked_at') {
      query = query.order('last_asked_at', { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: order === 'asc' });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('未回答質問取得エラー:', error);
      return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
    }
    
    // 全体の統計を取得（フィルターに関係なく）
    const { data: allQuestions, error: allError } = await (supabase as any)
      .from('unanswered_questions')
      .select('status');
    
    const stats = {
      pending: allQuestions?.filter((q: any) => q.status === 'pending').length || 0,
      answered: allQuestions?.filter((q: any) => q.status === 'answered').length || 0,
      ignored: allQuestions?.filter((q: any) => q.status === 'ignored').length || 0,
      total: allQuestions?.length || 0,
    };
    
    return NextResponse.json({ 
      questions: data || [], 
      stats 
    });
  } catch (error) {
    console.error('未回答質問API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

/**
 * POST: 未回答質問に回答を登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answer, profileCategory } = body;
    
    if (!questionId || !answer) {
      return NextResponse.json({ error: '質問IDと回答が必要です' }, { status: 400 });
    }
    
    const supabase = await createAdminClient();
    
    // 質問を取得
    const { data: question, error: fetchError } = await (supabase as any)
      .from('unanswered_questions')
      .select('*')
      .eq('id', questionId)
      .single();
    
    if (fetchError || !question) {
      return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 });
    }
    
    // 回答を登録
    const { data: updatedQuestion, error: updateError } = await (supabase as any)
      .from('unanswered_questions')
      .update({
        status: 'answered',
        answer: answer,
        answered_at: new Date().toISOString(),
        profile_category: profileCategory || null,
      })
      .eq('id', questionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('回答登録エラー:', updateError);
      return NextResponse.json({ error: '回答の登録に失敗しました' }, { status: 500 });
    }
    
    // 動的プロフィールに追加（必須）
    if (profileCategory) {
      try {
        const { data: profileItem, error: profileError } = await (supabase as any)
          .from('profile_data')
          .insert({
            category: profileCategory,
            key: `faq_${questionId.slice(0, 8)}`,
            value: {
              question: question.question,
              answer: answer,
              source: 'unanswered_questions',
            },
            priority: 50, // 中程度の優先度
            is_public: true,
          })
          .select()
          .single();
        
        if (!profileError && profileItem) {
          // プロフィールIDを更新
          await (supabase as any)
            .from('unanswered_questions')
            .update({ profile_item_id: profileItem.id })
            .eq('id', questionId);
          
          console.log('[未回答質問] 動的プロフィールに追加:', {
            questionId,
            profileItemId: profileItem.id,
            category: profileCategory,
          });
        } else {
          console.error('[未回答質問] プロフィール追加失敗:', profileError);
        }
      } catch (profileAddError) {
        console.error('[未回答質問] プロフィール追加エラー:', profileAddError);
      }
    } else {
      console.warn('[未回答質問] カテゴリが指定されていないため、プロフィールには追加されませんでした');
    }
    
    return NextResponse.json({ 
      success: true, 
      question: updatedQuestion 
    });
  } catch (error) {
    console.error('回答登録API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

/**
 * PATCH: 質問のステータスを更新（無視など）
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, status } = body;
    
    if (!questionId || !status) {
      return NextResponse.json({ error: '質問IDとステータスが必要です' }, { status: 400 });
    }
    
    if (!['pending', 'answered', 'ignored'].includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
    }
    
    const supabase = await createAdminClient();
    
    const { data, error } = await (supabase as any)
      .from('unanswered_questions')
      .update({ status })
      .eq('id', questionId)
      .select()
      .single();
    
    if (error) {
      console.error('ステータス更新エラー:', error);
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, question: data });
  } catch (error) {
    console.error('ステータス更新API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
