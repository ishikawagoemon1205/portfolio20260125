import { headers } from 'next/headers';

/**
 * リクエストからクライアントIPアドレスを取得
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  
  // Vercelの場合
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // 複数のIPがある場合は最初のものを使用
    return forwardedFor.split(',')[0].trim();
  }
  
  // その他のプロキシヘッダー
  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Cloudflareの場合
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // フォールバック
  return '127.0.0.1';
}

/**
 * IPアドレスのハッシュ化（プライバシー対策）
 */
export function hashIP(ip: string): string {
  // 簡易的なハッシュ（本番ではcrypto使用推奨）
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 既知の悪意あるIPのブラックリスト
 * 実運用では外部サービスやDBから取得することを推奨
 */
const IP_BLACKLIST = new Set<string>([
  // 例: 既知の攻撃元IP
]);

/**
 * IPがブラックリストに含まれているかチェック
 */
export function isBlacklisted(ip: string): boolean {
  return IP_BLACKLIST.has(ip);
}

/**
 * プライベートIPかどうかチェック（ローカル開発用）
 */
export function isPrivateIP(ip: string): boolean {
  // ローカルホスト
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }
  
  // プライベートIPレンジ
  const privateRanges = [
    /^10\./,           // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,     // 192.168.0.0/16
  ];
  
  return privateRanges.some(range => range.test(ip));
}
