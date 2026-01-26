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
 * increment: trueの場合はカウントを増やす、falseの場合は確認のみ
 */
export async function checkMessageRateLimit(
  visitorId: string,
  tier: VisitorTier,
  ip: string,
  increment: boolean = true
): Promise<RateLimitResult> {
  // 開発モードでスキップ
  console.log('[Rate Limit] checkMessageRateLimit:', { increment, tier, DEV_SKIP: process.env.DEV_SKIP_RATE_LIMIT });
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true') {
    console.log('[Rate Limit] スキップモード有効 - 制限なし');
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  // incrementがfalseの場合は、確認のみ（カウントしない）
  if (!increment) {
    console.log('[Rate Limit] 確認のみモード - カウントを増やさない');
    // 制限値から最大値を返す（正確な残り回数は取得できないが、UIには十分）
    const { TIER_LIMITS } = await import('@/types/database.types');
    const limits = TIER_LIMITS[tier as VisitorTier];
    return {
      success: true,
      limit: limits.messages,
      remaining: limits.messages, // 正確ではないが、increment後の確認なので問題ない
      reset: 0,
    };
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
 * Redisから現在の使用量を直接読み取り、カウントを増やさずに残り回数を計算
 */
export async function getRemainingLimits(
  visitorId: string,
  tier: VisitorTier
): Promise<{ messages: number; siteGenerations: number }> {
  // 開発モードまたはTier 4（無制限）の場合
  console.log('[Rate Limit] getRemainingLimits - DEV_SKIP:', process.env.DEV_SKIP_RATE_LIMIT, 'Tier:', tier);
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true' || tier === 4) {
    console.log('[Rate Limit] 無制限モード - 残り: -1');
    return { messages: -1, siteGenerations: -1 };
  }

  const { TIER_LIMITS } = await import('@/types/database.types');
  const { redis } = await import('@/lib/redis/client');
  
  const limits = TIER_LIMITS[tier as VisitorTier];
  
  try {
    // Upstash Ratelimit Sliding Window のキーパターン
    // プレフィックス:識別子 という形式で、値はタイムスタンプ付きのカウント情報
    const messageKeyPattern = `ratelimit:message:tier${tier}:${visitorId}`;
    const siteKeyPattern = `ratelimit:site:tier${tier}:${visitorId}`;
    
    // Redisからキーを検索（スキャン）
    const [messageKeys, siteKeys] = await Promise.all([
      redis.keys(`${messageKeyPattern}*`),
      redis.keys(`${siteKeyPattern}*`),
    ]);
    
    // 各キーの値を取得して合計を計算
    let messageCount = 0;
    let siteCount = 0;
    
    if (messageKeys.length > 0) {
      const messageValues = await Promise.all(
        messageKeys.map(key => redis.get<number>(key))
      );
      messageCount = messageValues.reduce<number>((sum, val) => (sum ?? 0) + (val ?? 0), 0);
    }
    
    if (siteKeys.length > 0) {
      const siteValues = await Promise.all(
        siteKeys.map(key => redis.get<number>(key))
      );
      siteCount = siteValues.reduce<number>((sum, val) => (sum ?? 0) + (val ?? 0), 0);
    }
    
    console.log('[Rate Limit] 現在の使用量:', { messageCount, siteCount, limits });
    
    return {
      messages: Math.max(0, limits.messages - messageCount),
      siteGenerations: Math.max(0, limits.sites - siteCount),
    };
  } catch (error) {
    console.error('[Rate Limit] 残り制限数の取得エラー:', error);
    // エラー時は最大値を返す（安全側に倒す）
    return {
      messages: limits.messages,
      siteGenerations: limits.sites,
    };
  }
}

/**
 * レート制限エラーのメッセージを生成
 */
export function getRateLimitErrorMessage(error: RateLimitResult['error'], tier: VisitorTier): string {
  switch (error) {
    case 'global':
      return 'アクセスが集中しています。少し時間をおいてお試しください。（グローバル制限）';
    case 'ip_hourly':
      return '短時間にリクエストが多すぎます。1時間後に再度お試しください。（IP時間制限）';
    case 'ip_daily':
      return '本日のリクエスト上限に達しました。明日お試しください。（IP日次制限）';
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
