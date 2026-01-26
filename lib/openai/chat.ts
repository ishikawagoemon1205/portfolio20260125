/**
 * チャット処理
 * 
 * OpenAI APIを使用したストリーミングレスポンス処理
 */

import { OpenAI } from 'openai';
import { getOpenAIClient, AISettings, DEFAULT_AI_SETTINGS, estimateTokenCount } from './client';
import { generateSystemPrompt, SystemPromptContext } from './system-prompt';
import type { Message } from '@/types/database.types';

/**
 * チャットメッセージの形式
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * チャットリクエストパラメータ
 */
export interface ChatRequest {
  conversationId: string;
  messages: ChatMessage[];
  visitorName?: string;
  messageCount: number;
  settings?: Partial<AISettings>;
}

/**
 * チャットレスポンス（非ストリーミング）
 */
export interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * DBのメッセージをChatMessage形式に変換
 */
export function convertDBMessagesToChatFormat(messages: Array<{ role: string; content: string; created_at: string }>): ChatMessage[] {
  return messages
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
}

/**
 * 会話履歴をトリミング（トークン制限対策）
 * 最新のメッセージを優先しつつ、古いメッセージを要約
 */
export function trimConversationHistory(
  messages: ChatMessage[],
  maxTokens: number = 3000
): ChatMessage[] {
  const result: ChatMessage[] = [];
  let currentTokens = 0;
  
  // 最新のメッセージから逆順に追加
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokenCount(msg.content);
    
    if (currentTokens + msgTokens > maxTokens) {
      // 残りのメッセージを要約として追加
      if (i > 0) {
        const summaryNote: ChatMessage = {
          role: 'system',
          content: `[以前の会話 ${i + 1} メッセージ省略。主なトピック: 相手のニーズ把握、自己紹介済み]`,
        };
        result.unshift(summaryNote);
      }
      break;
    }
    
    result.unshift(msg);
    currentTokens += msgTokens;
  }
  
  return result;
}

/**
 * ストリーミングチャットレスポンスを生成
 */
export async function* streamChatResponse(
  request: ChatRequest
): AsyncGenerator<string, ChatResponse, unknown> {
  const openai = getOpenAIClient();
  const settings = { ...DEFAULT_AI_SETTINGS, ...request.settings };
  
  // システムプロンプトを生成
  const systemPrompt = await generateSystemPrompt({
    conversationId: request.conversationId,
    visitorName: request.visitorName,
    messageCount: request.messageCount,
    currentHour: new Date().getHours(),
  });
  
  // 会話履歴をトリミング
  const trimmedMessages = trimConversationHistory(request.messages);
  
  // メッセージ配列を構築
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...trimmedMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];
  
  // ストリーミングリクエスト
  const stream = await openai.chat.completions.create({
    model: settings.model,
    messages,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    top_p: settings.topP,
    frequency_penalty: settings.frequencyPenalty,
    presence_penalty: settings.presencePenalty,
    stream: true,
  });
  
  let fullContent = '';
  let finishReason = 'stop';
  
  // ストリーミングレスポンスをyield
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      yield delta;
    }
    
    if (chunk.choices[0]?.finish_reason) {
      finishReason = chunk.choices[0].finish_reason;
    }
  }
  
  // 最終結果を返す
  const promptTokens = estimateTokenCount(systemPrompt + trimmedMessages.map(m => m.content).join(''));
  const completionTokens = estimateTokenCount(fullContent);
  
  return {
    content: fullContent,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    finishReason,
  };
}

/**
 * 非ストリーミングチャットレスポンス
 */
export async function getChatResponse(request: ChatRequest): Promise<ChatResponse> {
  const openai = getOpenAIClient();
  const settings = { ...DEFAULT_AI_SETTINGS, ...request.settings };
  
  // システムプロンプトを生成
  const systemPrompt = await generateSystemPrompt({
    conversationId: request.conversationId,
    visitorName: request.visitorName,
    messageCount: request.messageCount,
    currentHour: new Date().getHours(),
  });
  
  // 会話履歴をトリミング
  const trimmedMessages = trimConversationHistory(request.messages);
  
  // メッセージ配列を構築
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...trimmedMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];
  
  const response = await openai.chat.completions.create({
    model: settings.model,
    messages,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    top_p: settings.topP,
    frequency_penalty: settings.frequencyPenalty,
    presence_penalty: settings.presencePenalty,
  });
  
  const choice = response.choices[0];
  
  return {
    content: choice.message.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    finishReason: choice.finish_reason || 'stop',
  };
}

/**
 * 簡易チャット（テスト用）
 */
export async function quickChat(userMessage: string): Promise<string> {
  const openai = getOpenAIClient();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'あなたはフレンドリーなAIアシスタントです。日本語で簡潔に答えてください。',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    max_tokens: 500,
  });
  
  return response.choices[0].message.content || '';
}
