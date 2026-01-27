/**
 * 知識判定モジュール
 * 
 * AIが回答できるかどうかを事前に判定し、
 * プロフィールにない情報を勝手に答えることを防ぐ
 */

import { OpenAI } from 'openai';
import { getOpenAIClient } from './client';
import { getChatProfile, formatProfileForPrompt } from '@/lib/profile';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * 知識判定の結果
 */
export interface KnowledgeCheckResult {
  canAnswer: boolean;           // 回答可能か
  confidence: 'high' | 'medium' | 'low';  // 確信度
  reason: string;               // 判定理由
  relevantInfo?: string;        // 関連するプロフィール情報
  suggestedResponse?: string;   // 回答できない場合の代替提案
  shouldRecord: boolean;        // 未回答質問として記録すべきか
}

/**
 * 基本プロフィールを取得
 */
async function getBasicProfile() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?select=*&key=eq.basic_profile`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]?.value) {
        return data[0].value;
      }
    }
  } catch (error) {
    console.error('基本プロフィール取得エラー:', error);
  }
  
  return {
    name: 'あっちゃんAI',
    name_en: 'Atchan AI',
    title: 'フリーランスエンジニア',
    bio: '',
    skills: [],
    experiences: [],
  };
}

/**
 * 公開中の記事一覧を取得
 */
async function getPublishedArticles(): Promise<{ slug: string; title: string; tags: string[] }[]> {
  try {
    const supabase = await createAdminClient();
    const { data: articles, error } = await (supabase as any)
      .from('articles')
      .select('slug, title, tags')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('記事一覧取得エラー:', error);
      return [];
    }
    
    return articles || [];
  } catch (error) {
    console.error('記事一覧取得エラー:', error);
    return [];
  }
}

/**
 * 質問がプロフィール情報で回答可能かを判定
 */
export async function checkKnowledge(
  userQuestion: string,
  conversationContext?: string
): Promise<KnowledgeCheckResult> {
  const openai = getOpenAIClient();
  
  // プロフィール情報を取得
  const basicProfile = await getBasicProfile();
  const dynamicProfile = await getChatProfile();
  const dynamicProfileText = formatProfileForPrompt(dynamicProfile);
  const articles = await getPublishedArticles();
  
  // 判定用プロンプト
  const systemPrompt = `あなたは知識判定システムです。
ユーザーからの質問が、与えられた「プロフィール情報」で回答可能かどうかを判定してください。

## プロフィール情報（この情報のみで回答可能）

### 基本プロフィール
名前: ${basicProfile.name} (${basicProfile.name_en})
職業: ${basicProfile.title}
自己紹介: ${basicProfile.bio || '（未設定）'}
スキル: ${basicProfile.skills?.join('、') || '（未設定）'}
経験: ${basicProfile.experiences?.map((exp: any) => `${exp.company} (${exp.period}): ${exp.position}`).join('\n') || '（未設定）'}

### 動的プロフィール（趣味・最近の出来事など）
${dynamicProfileText || '（未設定）'}

### 記事タイトル一覧
${articles.map(a => `- ${a.title} (タグ: ${a.tags.join(', ')})`).join('\n') || '（記事なし）'}

## 判定ルール

1. **回答可能（canAnswer: true）の場合**
   - 上記プロフィール情報に直接関連する質問
   - 技術的な一般知識（プログラミング全般など）
   - 挨拶・雑談（こんにちは、元気？など）
   - サイト生成のリクエスト
   - 記事に関する質問

2. **回答不可（canAnswer: false）の場合**
   - プロフィールにない具体的な個人情報の質問
     例: 「好きな食べ物は？」「好きな映画は？」（プロフィールに記載がない場合）
   - 具体的なリスト作成を求められるが、情報がない場合
     例: 「好きなラーメン屋を10個教えて」（ラーメンの好みがプロフィールにない）
   - 外部サービスの具体的な内容
     例: 「サイゼリヤで好きなメニューを30個教えて」

3. **判断基準**
   - プロフィールに「好きな食べ物: ラーメン」とあれば、ラーメンについては回答可能
   - プロフィールに記載がなければ、推測で答えてはいけない
   - 「分からない」と答えるべき場合は shouldRecord: true にする

## 出力形式（JSON）

{
  "canAnswer": boolean,
  "confidence": "high" | "medium" | "low",
  "reason": "判定理由を簡潔に",
  "relevantInfo": "関連するプロフィール情報があれば記載",
  "suggestedResponse": "回答できない場合、代わりに提案できる話題",
  "shouldRecord": boolean
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: conversationContext 
            ? `会話の文脈:\n${conversationContext}\n\n現在の質問: ${userQuestion}`
            : `質問: ${userQuestion}`
        },
      ],
      temperature: 0.1, // 判定なので低い温度で
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      // フォールバック: 回答可能として処理
      return {
        canAnswer: true,
        confidence: 'low',
        reason: '判定結果を取得できませんでした',
        shouldRecord: false,
      };
    }

    const result = JSON.parse(content);
    return {
      canAnswer: result.canAnswer ?? true,
      confidence: result.confidence ?? 'medium',
      reason: result.reason ?? '',
      relevantInfo: result.relevantInfo,
      suggestedResponse: result.suggestedResponse,
      shouldRecord: result.shouldRecord ?? false,
    };
  } catch (error) {
    console.error('知識判定エラー:', error);
    // エラー時はフォールバックとして回答可能に
    return {
      canAnswer: true,
      confidence: 'low',
      reason: '判定処理でエラーが発生しました',
      shouldRecord: false,
    };
  }
}

/**
 * 回答不可時の応答文を生成
 */
export function generateUnavailableResponse(
  checkResult: KnowledgeCheckResult,
  characterTone: 'casual' | 'polite' = 'casual'
): string {
  const suggestions = checkResult.suggestedResponse 
    ? `\n\n${checkResult.suggestedResponse}についてなら、お話しできますよ！`
    : '';
  
  if (characterTone === 'casual') {
    return `すみません、その情報は持っていないんです😅${suggestions}`;
  } else {
    return `申し訳ございませんが、その情報は持ち合わせておりません。${suggestions}`;
  }
}
