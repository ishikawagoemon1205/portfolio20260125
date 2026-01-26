'use client';

import FingerprintJS, { type Agent } from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<Agent> | null = null;

/**
 * FingerprintJSを初期化
 * クライアントサイドでのみ実行
 */
function getFingerprinter(): Promise<Agent> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  return fpPromise;
}

/**
 * ブラウザフィンガープリントを取得
 */
export async function getFingerprint(): Promise<string | null> {
  try {
    const fp = await getFingerprinter();
    if (!fp) return null;

    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Failed to get fingerprint:', error);
    return null;
  }
}

/**
 * 詳細なフィンガープリント情報を取得
 */
export async function getFingerprintDetails(): Promise<{
  visitorId: string;
  confidence: number;
  components: Record<string, unknown>;
} | null> {
  try {
    const fp = await getFingerprinter();
    if (!fp) return null;

    const result = await fp.get();
    return {
      visitorId: result.visitorId,
      confidence: result.confidence.score,
      components: result.components,
    };
  } catch (error) {
    console.error('Failed to get fingerprint details:', error);
    return null;
  }
}
