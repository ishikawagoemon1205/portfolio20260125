/**
 * 会話要約機能
 * チャット内容から問い合わせ情報を抽出・要約
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InquirySummary {
  summary: string;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  requirements: string[];
  concerns: string[];
}

/**
 * チャット履歴から問い合わせ内容を要約
 */
export async function summarizeConversation(
  messages: ChatMessage[]
): Promise<InquirySummary> {
  // メッセージが少ない場合はデフォルト値を返す
  if (messages.length < 2) {
    return {
      summary: 'お問い合わせ内容の詳細をお聞かせください。',
      projectType: null,
      budgetRange: null,
      timeline: null,
      requirements: [],
      concerns: [],
    };
  }

  // 会話履歴をテキスト形式に変換
  const conversationText = messages
    .map((m) => `${m.role === 'user' ? '訪問者' : 'AI'}: ${m.content}`)
    .join('\n');

  const prompt = `以下のチャット会話から、問い合わせに関する情報を抽出・要約してください。

## 会話履歴:
${conversationText}

## 抽出してほしい情報:
1. 要約（100〜200字程度で、どんな相談・依頼内容かを簡潔に）
2. プロジェクトタイプ（Webサイト制作、Webアプリ開発、モバイルアプリ、システム開発、その他）
3. 予算感（言及がある場合のみ）
4. 希望納期（言及がある場合のみ）
5. 具体的な要件（箇条書きで3〜5個）
6. 訪問者の懸念事項や質問（あれば）

## 出力形式（JSON）:
{
  "summary": "要約文",
  "projectType": "プロジェクトタイプ or null",
  "budgetRange": "予算感 or null",
  "timeline": "希望納期 or null",
  "requirements": ["要件1", "要件2"],
  "concerns": ["懸念1", "懸念2"]
}

JSONのみを出力してください。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはビジネス会話から要件を抽出する専門家です。正確に情報を抽出し、JSONで出力してください。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // JSONを抽出（コードブロックがある場合に対応）
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      summary: parsed.summary || '会話内容を要約できませんでした。',
      projectType: parsed.projectType || null,
      budgetRange: parsed.budgetRange || null,
      timeline: parsed.timeline || null,
      requirements: parsed.requirements || [],
      concerns: parsed.concerns || [],
    };
  } catch (error) {
    console.error('会話要約エラー:', error);
    
    // エラー時はユーザーのメッセージから簡易要約を生成
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');
    
    return {
      summary: userMessages.slice(0, 200) + (userMessages.length > 200 ? '...' : ''),
      projectType: null,
      budgetRange: null,
      timeline: null,
      requirements: [],
      concerns: [],
    };
  }
}

/**
 * 会話要約API用のエンドポイント
 */
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }
    
    const summary = await summarizeConversation(messages);
    
    return Response.json(summary);
  } catch (error) {
    console.error('要約APIエラー:', error);
    return Response.json(
      { error: '要約に失敗しました' },
      { status: 500 }
    );
  }
}
