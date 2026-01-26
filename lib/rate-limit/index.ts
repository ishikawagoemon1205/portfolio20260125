import { TIER_LIMITS } from '@/types/database.types';
import { 
  messageLimiters, 
  siteGenerationLimiters, 
  ipRateLimiter, 
  ipDailyLimiter,
  globalApiLimiter 
} from './config';

// Visitor tier type (1-4)
type VisitorTier = 1 | 2 | 3 | 4;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  error?: 'ip_hourly' | 'ip_daily' | 'global' | 'tier_message' | 'tier_site';
}

/**
 * メッセージ送信のレート制限チェック
 */
export async function checkMessageRateLimit(
  visitorId: string,
  tier: VisitorTier,
  ip: string
): Promise<RateLimitResult> {
  // 開発モードでスキップ
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true') {
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  // 1. グローバルAPI制限チェック（バースト対策）
  const globalResult = await globalApiLimiter.limit(`global:${ip}`);
  if (!globalResult.success) {
    return {
      success: false,
      limit: globalResult.limit,
      remaining: globalResult.remaining,
      reset: globalResult.reset,
      error: 'global',
    };
  }

  // 2. IP制限チェック（時間ベース）
  const ipHourlyResult = await ipRateLimiter.limit(ip);
  if (!ipHourlyResult.success) {
    return {
      success: false,
      limit: ipHourlyResult.limit,
      remaining: ipHourlyResult.remaining,
      reset: ipHourlyResult.reset,
      error: 'ip_hourly',
    };
  }

  // 3. IP制限チェック（日次）
  const ipDailyResult = await ipDailyLimiter.limit(ip);
  if (!ipDailyResult.success) {
    return {
      success: false,
      limit: ipDailyResult.limit,
      remaining: ipDailyResult.remaining,
      reset: ipDailyResult.reset,
      error: 'ip_daily',
    };
  }

  // 4. Tier別制限チェック（コンタクト済みは無制限）
  const limiter = messageLimiters[tier];
  if (!limiter) {
    // 無制限（Tier 4）
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  const tierResult = await limiter.limit(visitorId);
  if (!tierResult.success) {
    return {
      success: false,
      limit: tierResult.limit,
      remaining: tierResult.remaining,
      reset: tierResult.reset,
      error: 'tier_message',
    };
  }

  return {
    success: true,
    limit: tierResult.limit,
    remaining: tierResult.remaining,
    reset: tierResult.reset,
  };
}

/**
 * サイト生成のレート制限チェック
 */
export async function checkSiteGenerationRateLimit(
  visitorId: string,
  tier: VisitorTier,
  ip: string
): Promise<RateLimitResult> {
  // 開発モードでスキップ
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true') {
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  // 1. グローバルAPI制限
  const globalResult = await globalApiLimiter.limit(`global:${ip}`);
  if (!globalResult.success) {
    return {
      success: false,
      limit: globalResult.limit,
      remaining: globalResult.remaining,
      reset: globalResult.reset,
      error: 'global',
    };
  }

  // 2. Tier別サイト生成制限
  const limiter = siteGenerationLimiters[tier];
  if (!limiter) {
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  const tierResult = await limiter.limit(visitorId);
  if (!tierResult.success) {
    return {
      success: false,
      limit: tierResult.limit,
      remaining: tierResult.remaining,
      reset: tierResult.reset,
      error: 'tier_site',
    };
  }

  return {
    success: true,
    limit: tierResult.limit,
    remaining: tierResult.remaining,
    reset: tierResult.reset,
  };
}

/**
 * 残りの制限数を取得（UI表示用）
 */
export async function getRemainingLimits(
  visitorId: string,
  tier: VisitorTier
): Promise<{ messages: number; siteGenerations: number }> {
  const messageLimiter = messageLimiters[tier];
  const siteLimiter = siteGenerationLimiters[tier];

  if (!messageLimiter && !siteLimiter) {
    return { messages: -1, siteGenerations: -1 }; // 無制限
  }

  // limit() を使って残り回数を取得（実際にはカウントしない、確認のみ）
  const [messageResult, siteResult] = await Promise.all([
    messageLimiter?.limit(visitorId) ?? Promise.resolve(null),
    siteLimiter?.limit(visitorId) ?? Promise.resolve(null),
  ]);

  return {
    messages: messageResult?.remaining ?? -1,
    siteGenerations: siteResult?.remaining ?? -1,
  };
}

/**
 * レート制限エラーのメッセージを生成
 */
export function getRateLimitErrorMessage(error: RateLimitResult['error'], tier: VisitorTier): string {
  switch (error) {
    case 'global':
      return 'アクセスが集中しています。少し時間をおいてお試しください。';
    case 'ip_hourly':
      return '短時間にリクエストが多すぎます。1時間後に再度お試しください。';
    case 'ip_daily':
      return '本日のリクエスト上限に達しました。明日お試しください。';
    case 'tier_message':
      switch (tier) {
        case 1:
          return '本日のメッセージ上限（5回）に達しました。お名前を教えていただくと、さらにお話しできますよ✨';
        case 2:
          return '本日のメッセージ上限（10回）に達しました。メールアドレスを教えていただくと、もっとお話しできます💕';
        case 3:
          return '本日のメッセージ上限（30回）に達しました。明日またお話ししましょう！';
        default:
          return '本日のメッセージ上限に達しました。';
      }
    case 'tier_site':
      return 'サイト生成の上限に達しました。明日またお試しください。';
    default:
      return 'リクエストを処理できませんでした。';
  }
}
