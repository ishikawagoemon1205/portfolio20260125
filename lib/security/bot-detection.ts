import { headers } from 'next/headers';

export interface BotDetectionResult {
  isBot: boolean;
  score: number; // 0-100 (高いほどBot可能性が高い)
  reasons: string[];
}

// 既知のBot User-Agentパターン
const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /fetch/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
];

// 良性のBot（検索エンジン等）
const GOOD_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i, // Yahoo
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /discordbot/i,
];

/**
 * Bot検知スコアリング
 */
export async function detectBot(): Promise<BotDetectionResult> {
  const headersList = await headers();
  const reasons: string[] = [];
  let score = 0;

  // 開発モードでスキップ
  if (process.env.DEV_SKIP_BOT_DETECTION === 'true') {
    return { isBot: false, score: 0, reasons: [] };
  }

  // 1. User-Agent チェック
  const userAgent = headersList.get('user-agent') || '';
  
  if (!userAgent) {
    score += 30;
    reasons.push('User-Agentが空');
  } else {
    // 良性のBotチェック
    if (GOOD_BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
      return { isBot: true, score: 10, reasons: ['良性のBot（検索エンジン等）'] };
    }
    
    // 悪性のBotチェック
    if (BOT_UA_PATTERNS.some(pattern => pattern.test(userAgent))) {
      score += 40;
      reasons.push('Bot系のUser-Agent検出');
    }
  }

  // 2. Accept-Language チェック
  const acceptLanguage = headersList.get('accept-language');
  if (!acceptLanguage) {
    score += 15;
    reasons.push('Accept-Languageが空');
  }

  // 3. Accept ヘッダーチェック
  const accept = headersList.get('accept');
  if (!accept) {
    score += 10;
    reasons.push('Acceptヘッダーが空');
  }

  // 4. Sec-CH-UA チェック（モダンブラウザ）
  const secChUa = headersList.get('sec-ch-ua');
  if (!secChUa) {
    score += 5;
    reasons.push('Sec-CH-UAが空（古いブラウザまたはBot）');
  }

  // 5. DNT (Do Not Track) チェック
  // Botはこれを設定しないことが多い
  const dnt = headersList.get('dnt');
  if (dnt) {
    score -= 5; // 人間っぽい
  }

  // 6. Referer チェック（直接アクセスが多すぎる場合）
  // これは単体では判断材料にならないのでスキップ

  // スコア調整
  score = Math.max(0, Math.min(100, score));

  return {
    isBot: score >= 50,
    score,
    reasons,
  };
}

/**
 * Honeypot フィールドのチェック
 * フォームに見えないフィールドを追加し、それが入力されていたらBot
 */
export function checkHoneypot(honeypotValue: string | null | undefined): boolean {
  // 空でなければBot
  return !!honeypotValue && honeypotValue.length > 0;
}

/**
 * リクエスト間隔が人間らしいかチェック
 */
export function isHumanTiming(
  lastRequestTime: number | null,
  minIntervalMs: number = 500 // 最低500ms
): boolean {
  if (!lastRequestTime) return true;
  
  const elapsed = Date.now() - lastRequestTime;
  return elapsed >= minIntervalMs;
}

/**
 * 総合的なBot判定
 */
export async function isSuspiciousRequest(honeypotValue?: string | null): Promise<{
  isSuspicious: boolean;
  reason: string | null;
}> {
  // Honeypotチェック
  if (checkHoneypot(honeypotValue)) {
    return { isSuspicious: true, reason: 'Honeypotに引っかかった' };
  }

  // Bot検知
  const botResult = await detectBot();
  if (botResult.isBot && botResult.score >= 50) {
    return { isSuspicious: true, reason: `Bot検知スコア: ${botResult.score}` };
  }

  return { isSuspicious: false, reason: null };
}
