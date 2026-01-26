/**
 * 生成サイト表示 API
 * 
 * GET /api/site/[url] - 生成されたサイトのHTMLを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedSite, isSiteExpired } from '@/lib/openai';

interface RouteParams {
  params: Promise<{
    url: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { url: uniqueUrl } = await params;
    
    if (!uniqueUrl || uniqueUrl.length !== 12) {
      return NextResponse.json(
        { error: 'サイトが見つかりません' },
        { status: 404 }
      );
    }
    
    const site = await getGeneratedSite(uniqueUrl);
    
    if (!site) {
      return NextResponse.json(
        { error: 'サイトが見つかりません' },
        { status: 404 }
      );
    }
    
    if (isSiteExpired(site)) {
      return NextResponse.json(
        { error: 'このサイトは有効期限が切れています' },
        { status: 410 }
      );
    }
    
    // HTMLを直接返す場合
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return new Response(site.html_content, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // JSON形式で返す場合
    return NextResponse.json({
      id: site.id,
      html: site.html_content,
      createdAt: site.created_at,
      accessCount: site.access_count,
    });
  } catch (error) {
    console.error('サイト取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
