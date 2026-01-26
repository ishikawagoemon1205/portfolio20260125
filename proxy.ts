/**
 * Next.js Proxy (旧 Middleware)
 * 
 * - 管理者ページの認証チェック
 * - API レート制限
 * - セキュリティヘッダー
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Supabase セッション更新
  const { supabaseResponse, user } = await updateSession(request);
  let response = supabaseResponse;
  
  // パスをヘッダーに追加（レイアウトで使用）
  response.headers.set('x-pathname', pathname);
  
  // 管理者ページの認証チェック
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // 認証されていない場合はログインページにリダイレクト
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // セキュリティヘッダーを追加
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // API ルートの CORS 設定
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Preflight リクエストの処理
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
  }
  
  return response;
}

// Proxyを適用するパス
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
