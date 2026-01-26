import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import type { VisitorTier } from '@/types/database.types';

const VISITOR_COOKIE_NAME = 'acchan_visitor_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

export interface VisitorInfo {
  id: string;
  visitorId: string;
  fingerprint: string | null;
  name: string | null;
  email: string | null;
  tier: VisitorTier;
  isBlocked: boolean;
  visitCount: number;
  totalMessages: number;
  isNew: boolean;
}

// Supabaseの型がneverになる問題を回避するための型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VisitorRow = any;

/**
 * Cookie から訪問者IDを取得または生成
 */
export async function getOrCreateVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (!visitorId) {
    visitorId = uuidv4();
    cookieStore.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  }

  return visitorId;
}

/**
 * 訪問者情報を取得または作成
 */
export async function getOrCreateVisitor(
  visitorId: string,
  fingerprint?: string | null
): Promise<VisitorInfo> {
  const supabase: AnySupabaseClient = await createAdminClient();

  // まずCookie IDで検索
  const { data: existingVisitor } = await supabase
    .from('visitors')
    .select('*')
    .eq('visitor_id', visitorId)
    .single();

  let visitor: VisitorRow = existingVisitor;

  if (!visitor && fingerprint) {
    // Fingerprintで検索（Cookie削除された場合の復旧）
    const { data: fpVisitor } = await supabase
      .from('visitors')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();

    if (fpVisitor) {
      // Cookie IDを更新
      await supabase
        .from('visitors')
        .update({ visitor_id: visitorId })
        .eq('id', (fpVisitor as VisitorRow).id);
      visitor = { ...(fpVisitor as VisitorRow), visitor_id: visitorId };
    }
  }

  const isNew = !visitor;

  if (!visitor) {
    // 新規訪問者を作成
    const { data: newVisitor, error } = await supabase
      .from('visitors')
      .insert({
        visitor_id: visitorId,
        fingerprint: fingerprint || null,
        tier: 1, // 匿名
        visit_count: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create visitor: ${error.message}`);
    }

    visitor = newVisitor;
  } else {
    // 訪問回数を更新
    await supabase
      .from('visitors')
      .update({
        visit_count: visitor.visit_count + 1,
        last_seen_at: new Date().toISOString(),
        // Fingerprintを更新（新しいものがあれば）
        ...(fingerprint && !visitor.fingerprint ? { fingerprint } : {}),
      })
      .eq('id', visitor.id);
  }

  if (!visitor) {
    throw new Error('Failed to get or create visitor');
  }

  return {
    id: visitor.id,
    visitorId: visitor.visitor_id,
    fingerprint: visitor.fingerprint,
    name: visitor.name,
    email: visitor.email,
    tier: visitor.tier as VisitorTier,
    isBlocked: visitor.is_blocked,
    visitCount: visitor.visit_count,
    totalMessages: visitor.total_messages,
    isNew,
  };
}

/**
 * 訪問者の名前を更新（Tier 2へ昇格）
 */
export async function updateVisitorName(
  visitorDbId: string,
  name: string
): Promise<void> {
  const supabase: AnySupabaseClient = await createAdminClient();

  await supabase
    .from('visitors')
    .update({
      name,
      tier: 2, // Tier 2（名前提供）へ昇格
    })
    .eq('id', visitorDbId);
}

/**
 * 訪問者のメールを更新（Tier 3へ昇格）
 */
export async function updateVisitorEmail(
  visitorDbId: string,
  email: string
): Promise<void> {
  const supabase: AnySupabaseClient = await createAdminClient();

  await supabase
    .from('visitors')
    .update({
      email,
      tier: 3, // Tier 3（メール提供）へ昇格
    })
    .eq('id', visitorDbId);
}

/**
 * 訪問者をコンタクト済み（Tier 4）に昇格
 */
export async function markVisitorAsContacted(
  visitorDbId: string
): Promise<void> {
  const supabase: AnySupabaseClient = await createAdminClient();

  await supabase
    .from('visitors')
    .update({
      tier: 4, // Tier 4（コンタクト済み）
    })
    .eq('id', visitorDbId);
}

/**
 * 訪問者のメッセージ数を増加
 */
export async function incrementMessageCount(
  visitorDbId: string
): Promise<void> {
  const supabase: AnySupabaseClient = await createAdminClient();

  // 直接更新（RPC関数の代わり）
  const { data: visitor } = await supabase
    .from('visitors')
    .select('total_messages')
    .eq('id', visitorDbId)
    .single();

  if (visitor) {
    await supabase
      .from('visitors')
      .update({
        total_messages: (visitor as VisitorRow).total_messages + 1,
      })
      .eq('id', visitorDbId);
  }
}

/**
 * 訪問者をブロック
 */
export async function blockVisitor(visitorDbId: string): Promise<void> {
  const supabase: AnySupabaseClient = await createAdminClient();

  await supabase
    .from('visitors')
    .update({ is_blocked: true })
    .eq('id', visitorDbId);
}

/**
 * IDから訪問者情報を取得
 */
export async function getVisitorById(
  visitorDbId: string
): Promise<VisitorRow | null> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data } = await supabase
    .from('visitors')
    .select('*')
    .eq('id', visitorDbId)
    .single();

  return data;
}

/**
 * Cookie IDから訪問者情報を取得
 */
export async function getVisitorByCookieId(
  visitorId: string
): Promise<VisitorRow | null> {
  const supabase: AnySupabaseClient = await createAdminClient();

  const { data } = await supabase
    .from('visitors')
    .select('*')
    .eq('visitor_id', visitorId)
    .single();

  return data;
}
