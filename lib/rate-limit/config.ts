import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis/client';
import { TIER_LIMITS } from '@/types/database.types';

// Visitor tier type (1-4)
type VisitorTier = 1 | 2 | 3 | 4;

/**
 * Rate Limiter の設定
 * 
 * Tierごとに異なるレート制限を適用:
 * - Tier 1 (匿名): 5メッセージ/日
 * - Tier 2 (名前): 10メッセージ/日
 * - Tier 3 (メール): 30メッセージ/日
 * - Tier 4 (コンタクト済み): 無制限
 */

// Tierごとのメッセージ制限 Rate Limiter
export const messageLimiters: Record<VisitorTier, Ratelimit | null> = {
  1: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      TIER_LIMITS[1].messages,
      '1 d' // 1日
    ),
    analytics: true,
    prefix: 'ratelimit:message:tier1',
  }),
  2: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      TIER_LIMITS[2].messages,
      '1 d'
    ),
    analytics: true,
    prefix: 'ratelimit:message:tier2',
  }),
  3: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      TIER_LIMITS[3].messages,
      '1 d'
    ),
    analytics: true,
    prefix: 'ratelimit:message:tier3',
  }),
  4: null, // 無制限
};

// サイト生成の制限 Rate Limiter
export const siteGenerationLimiters: Record<VisitorTier, Ratelimit | null> = {
  1: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      TIER_LIMITS[1].sites,
      '1 d'
    ),
    analytics: true,
    prefix: 'ratelimit:site:tier1',
  }),
  2: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      TIER_LIMITS[2].sites,
      '1 d'
    ),
    analytics: true,
    prefix: 'ratelimit:site:tier2',
  }),
  3: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      TIER_LIMITS[3].sites,
      '1 d'
    ),
    analytics: true,
    prefix: 'ratelimit:site:tier3',
  }),
  4: null, // 無制限
};

// グローバルなIP制限（DDoS対策）
export const ipRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 h'), // 1時間あたり200リクエスト（緩和）
  analytics: true,
  prefix: 'ratelimit:ip:hourly',
});

export const ipDailyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 d'), // 1日あたり1000リクエスト（緩和）
  analytics: true,
  prefix: 'ratelimit:ip:daily',
});

// APIエンドポイント全体のレート制限（バースト対策）
export const globalApiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 1分あたり60リクエスト（緩和）
  analytics: true,
  prefix: 'ratelimit:global',
});
