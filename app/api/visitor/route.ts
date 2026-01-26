/**
 * 訪問者 API
 * 
 * GET /api/visitor - 現在の訪問者情報を取得
 * POST /api/visitor - 訪問者情報を更新（名前・メールなど）
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrCreateVisitorId,
  getOrCreateVisitor, 
  updateVisitorName, 
  updateVisitorEmail 
} from '@/lib/visitor';
import { getRemainingLimits } from '@/lib/rate-limit';
import { TIER_LIMITS } from '@/types/database.types';

// Visitor tier type (1-4)
type VisitorTier = 1 | 2 | 3 | 4;

/**
 * 訪問者情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const visitorId = await getOrCreateVisitorId();
    const visitor = await getOrCreateVisitor(visitorId);
    
    if (!visitor) {
      return NextResponse.json(
        { error: '訪問者の識別に失敗しました' },
        { status: 500 }
      );
    }
    
    // 残り制限を取得
    const limits = await getRemainingLimits(visitor.visitorId, visitor.tier);
    
    console.log('[API Visitor] 訪問者情報:', {
      visitorId: visitor.visitorId,
      tier: visitor.tier,
      limits,
      DEV_SKIP: process.env.DEV_SKIP_RATE_LIMIT
    });
    
    // Tier情報
    const tierInfo = {
      current: visitor.tier,
      name: getTierName(visitor.tier),
      limits: TIER_LIMITS[visitor.tier as VisitorTier],
      remaining: limits,
    };
    
    // 安全な情報のみ返す
    return NextResponse.json({
      id: visitor.visitorId,
      name: visitor.name,
      email: visitor.email ? maskEmail(visitor.email) : null,
      tier: tierInfo,
      messageCount: visitor.totalMessages,
      isReturningVisitor: visitor.visitCount > 1,
    });
  } catch (error) {
    console.error('訪問者取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 訪問者情報を更新
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;
    
    const visitorId = await getOrCreateVisitorId();
    const visitor = await getOrCreateVisitor(visitorId);
    
    if (!visitor) {
      return NextResponse.json(
        { error: '訪問者の識別に失敗しました' },
        { status: 500 }
      );
    }
    
    let updated = false;
    let newTier = visitor.tier;
    
    // 名前を更新
    if (name && typeof name === 'string' && name.length <= 50) {
      await updateVisitorName(visitor.visitorId, name.trim());
      updated = true;
      // 名前提供でTier 2に昇格
      if (newTier < 2) {
        newTier = 2;
      }
    }
    
    // メールを更新
    if (email && typeof email === 'string') {
      // 簡易メールバリデーション
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: '有効なメールアドレスを入力してください' },
          { status: 400 }
        );
      }
      
      await updateVisitorEmail(visitor.visitorId, email.toLowerCase().trim());
      updated = true;
      // メール提供でTier 3に昇格
      if (newTier < 3) {
        newTier = 3;
      }
    }
    
    if (!updated) {
      return NextResponse.json(
        { error: '更新する情報がありません' },
        { status: 400 }
      );
    }
    
    // 更新後の制限を取得
    const limits = await getRemainingLimits(visitor.visitorId, newTier);
    
    return NextResponse.json({
      success: true,
      tier: {
        current: newTier,
        name: getTierName(newTier),
        limits: TIER_LIMITS[newTier as VisitorTier],
        remaining: limits,
      },
      message: newTier > visitor.tier 
        ? `ティアが${getTierName(newTier)}にアップグレードされました！` 
        : '情報を更新しました',
    });
  } catch (error) {
    console.error('訪問者更新エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * Tier名を取得
 */
function getTierName(tier: number): string {
  switch (tier) {
    case 1:
      return 'ゲスト';
    case 2:
      return 'メンバー';
    case 3:
      return 'プレミアム';
    case 4:
      return 'VIP';
    default:
      return 'ゲスト';
  }
}

/**
 * メールアドレスをマスク
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(Math.min(local.length - 2, 5)) + local[local.length - 1]
    : '**';
  
  return `${maskedLocal}@${domain}`;
}
