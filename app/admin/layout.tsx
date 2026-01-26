/**
 * 管理画面レイアウト
 * サーバーサイドで認証チェックを行い、未認証時はchildrenをレンダリングしない
 */

import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Sidebar } from '@/components/admin/Sidebar';
import type { Database } from '@/types/database.types';

export const metadata = {
  title: '管理画面 | あっちゃんAI',
  description: 'あっちゃんAI ポートフォリオ管理画面',
};

async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 現在のパスを取得
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  
  // ログインページの場合は認証チェックをスキップ
  const isLoginPage = pathname.includes('/admin/login');
  
  if (isLoginPage) {
    // ログインページはサイドバーなしで表示
    return <>{children}</>;
  }
  
  const user = await getUser();
  
  // 未認証時はchildrenをレンダリングしない（middlewareがリダイレクト処理）
  // これにより、クライアントサイドのAPIリクエストを防止
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">ログインページにリダイレクト中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* サイドバー */}
      <Sidebar />
      
      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
