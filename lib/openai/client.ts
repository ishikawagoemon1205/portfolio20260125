/**
 * OpenAI クライアント設定
 * 
 * GPT-4o/GPT-4o-mini を使用したAIチャット機能の基盤
 */

import OpenAI from 'openai';

// シングルトンクライアント
let openaiClient: OpenAI | null = null;

/**
 * OpenAI クライアントを取得（シングルトン）
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY が設定されていません');
    }
    
    openaiClient = new OpenAI({
      apiKey,
      // タイムアウト設定（30秒）
      timeout: 30000,
      // 最大リトライ回数
      maxRetries: 2,
    });
  }
  
  return openaiClient;
}

/**
 * AI設定に基づいたモデル選択
 */
export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';

export interface AISettings {
  model: AIModel;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

/**
 * デフォルトのAI設定
 */
export const DEFAULT_AI_SETTINGS: AISettings = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0.1,
};

/**
 * サイト生成用のAI設定（コスト最適化版）
 * 目的: 訪問者にデザインイメージを想起させるプレビュー生成
 * gpt-4o-miniでも十分なクオリティで、約16倍のコスト削減
 */
export const SITE_GENERATION_SETTINGS: AISettings = {
  model: 'gpt-4o-mini',
  temperature: 0.6,
  maxTokens: 3000,
  topP: 1,
  frequencyPenalty: 0.1,
  presencePenalty: 0.1,
};

/**
 * トークン使用量を概算
 * 日本語: 約1.5〜2文字/token、英語: 約4文字/token
 */
export function estimateTokenCount(text: string): number {
  // 日本語文字数をカウント
  const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  // 英数字・記号
  const asciiChars = text.length - japaneseChars;
  
  // 日本語は約1.5文字/token、英数字は約4文字/token
  return Math.ceil(japaneseChars / 1.5 + asciiChars / 4);
}

/**
 * コスト概算（USD）
 * GPT-4o: input $2.5/1M, output $10/1M
 * GPT-4o-mini: input $0.15/1M, output $0.6/1M
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: AIModel
): number {
  const rates: Record<AIModel, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
    'gpt-4-turbo': { input: 10 / 1_000_000, output: 30 / 1_000_000 },
  };
  
  const rate = rates[model];
  return inputTokens * rate.input + outputTokens * rate.output;
}
