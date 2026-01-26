/**
 * サイト生成機能
 * 
 * 会話履歴を分析し、パーソナライズされたポートフォリオサイトを生成
 */

import { getOpenAIClient, SITE_GENERATION_SETTINGS, estimateTokenCount } from './client';
import { generateSiteGenerationPrompt } from './system-prompt';
import { createAdminClient } from '@/lib/supabase/server';
import type { Conversation, Message, GeneratedSite } from '@/types/database.types';

/**
 * サイト生成リクエスト
 */
export interface SiteGenerationRequest {
  conversationId: string;
  visitorId: string;
  visitorName?: string;
}

/**
 * サイト生成結果
 */
export interface SiteGenerationResult {
  success: boolean;
  siteId?: string;
  uniqueUrl?: string;
  htmlContent?: string;
  error?: string;
  tokensUsed?: number;
}

/**
 * 会話履歴を取得して要約
 */
async function getConversationSummary(conversationId: string): Promise<string> {
  const supabase = await createAdminClient();
  
  // 会話のメッセージを取得
  const { data: messages, error } = await (supabase as any)
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error || !messages || messages.length === 0) {
    throw new Error('会話履歴が見つかりません');
  }
  
  // 会話履歴を整形
  const conversationText = (messages as Message[])
    .map(msg => `[${msg.role === 'user' ? 'お客様' : 'あっちゃんAI'}]: ${msg.content}`)
    .join('\n\n');
  
  // トークン制限を考慮して必要なら切り詰め
  const maxChars = 8000;
  if (conversationText.length > maxChars) {
    return conversationText.slice(-maxChars) + '\n\n[以前の会話省略]';
  }
  
  return conversationText;
}

/**
 * ユニークURLを生成
 */
function generateUniqueUrl(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * パーソナライズされたサイトを生成
 */
export async function generatePersonalizedSite(
  request: SiteGenerationRequest
): Promise<SiteGenerationResult> {
  try {
    const openai = getOpenAIClient();
    const supabase = await createAdminClient();
    
    // 既存のサイトをチェック（同じ会話で生成済みか）
    const { data: existingSite } = await (supabase as any)
      .from('generated_sites')
      .select('id, unique_url')
      .eq('conversation_id', request.conversationId)
      .single();
    
    if (existingSite) {
      return {
        success: true,
        siteId: existingSite.id,
        uniqueUrl: existingSite.unique_url,
        error: '既にこの会話からサイトが生成されています',
      };
    }
    
    // 会話履歴を取得
    const conversationSummary = await getConversationSummary(request.conversationId);
    
    // システムプロンプトを生成
    const systemPrompt = generateSiteGenerationPrompt();
    
    // ユーザープロンプトを構築
    const userPrompt = `
以下の会話履歴を分析し、このお客様専用のポートフォリオサイトHTMLを生成してください。

## お客様情報
${request.visitorName ? `- 名前: ${request.visitorName}` : '- 名前: 不明'}

## 会話履歴
${conversationSummary}

上記の会話から、お客様が何に興味を持っているか、どんな課題を抱えているかを分析し、
それに合わせたコンテンツを持つポートフォリオサイトを生成してください。
`;
    
    // OpenAI APIでサイト生成
    const response = await openai.chat.completions.create({
      model: SITE_GENERATION_SETTINGS.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: SITE_GENERATION_SETTINGS.temperature,
      max_tokens: SITE_GENERATION_SETTINGS.maxTokens,
    });
    
    const htmlContent = response.choices[0].message.content;
    
    if (!htmlContent) {
      throw new Error('サイト生成に失敗しました（空のレスポンス）');
    }
    
    // HTMLを抽出（```html で囲まれている可能性を考慮）
    let cleanHtml = htmlContent;
    const htmlMatch = htmlContent.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      cleanHtml = htmlMatch[1];
    }
    
    // ユニークURLを生成
    const uniqueUrl = generateUniqueUrl();
    
    // データベースに保存
    const { data: site, error: insertError } = await (supabase as any)
      .from('generated_sites')
      .insert({
        visitor_id: request.visitorId,
        conversation_id: request.conversationId,
        unique_url: uniqueUrl,
        html_content: cleanHtml,
        metadata: {
          generatedAt: new Date().toISOString(),
          tokensUsed: response.usage?.total_tokens,
          model: SITE_GENERATION_SETTINGS.model,
        },
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('サイト保存エラー:', insertError);
      throw new Error('サイトの保存に失敗しました');
    }
    
    return {
      success: true,
      siteId: site.id,
      uniqueUrl,
      htmlContent: cleanHtml,
      tokensUsed: response.usage?.total_tokens,
    };
  } catch (error) {
    console.error('サイト生成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
    };
  }
}

/**
 * 生成されたサイトを取得
 */
export async function getGeneratedSite(uniqueUrl: string): Promise<GeneratedSite | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await (supabase as any)
    .from('generated_sites')
    .select('*')
    .eq('unique_url', uniqueUrl)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // アクセスカウントを更新
  await (supabase as any)
    .from('generated_sites')
    .update({
      access_count: (data.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', data.id);
  
  return data as GeneratedSite;
}

/**
 * サイトの有効期限をチェック（30日）
 */
export function isSiteExpired(site: GeneratedSite): boolean {
  if (!site.expires_at) return false;
  const expiresAt = new Date(site.expires_at);
  return new Date() > expiresAt;
}

/**
 * 期限切れサイトを削除（バッチ処理用）
 */
export async function cleanupExpiredSites(): Promise<number> {
  const supabase = createAdminClient();
  
  const { data, error } = await (supabase as any)
    .from('generated_sites')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');
  
  if (error) {
    console.error('期限切れサイト削除エラー:', error);
    return 0;
  }
  
  return data?.length || 0;
}
