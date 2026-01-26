import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * 生成されたサイトを取得
 * GET /api/sites/[uniqueUrl]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueUrl: string }> }
) {
  try {
    const { uniqueUrl } = await params;

    const supabase = await createAdminClient();

    // サイトデータを取得
    const { data: site, error } = await (supabase as any)
      .from('generated_sites')
      .select('html_content, created_at, metadata')
      .eq('unique_url', uniqueUrl)
      .single();

    if (error || !site) {
      return new NextResponse('Site not found', { status: 404 });
    }

    // HTMLとして返す
    return new NextResponse(site.html_content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('サイト取得エラー:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
