import { Redis } from '@upstash/redis';

/**
 * Upstash Redis クライアント
 * Rate Limiting、キャッシュに使用
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
