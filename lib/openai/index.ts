/**
 * OpenAI モジュール エクスポート
 */

// クライアント・設定
export {
  getOpenAIClient,
  DEFAULT_AI_SETTINGS,
  SITE_GENERATION_SETTINGS,
  estimateTokenCount,
  estimateCost,
  type AIModel,
  type AISettings,
} from './client';

// システムプロンプト
export {
  generateSystemPrompt,
  generateSiteGenerationPrompt,
  type SystemPromptContext,
} from './system-prompt';

// チャット処理
export {
  streamChatResponse,
  getChatResponse,
  quickChat,
  convertDBMessagesToChatFormat,
  trimConversationHistory,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
} from './chat';

// サイト生成
export {
  generatePersonalizedSite,
  getGeneratedSite,
  isSiteExpired,
  cleanupExpiredSites,
  type SiteGenerationRequest,
  type SiteGenerationResult,
} from './site-generator';
