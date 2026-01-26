/**
 * 管理画面レイアウト
 */

import { Sidebar } from '@/components/admin/Sidebar';

export const metadata = {
  title: '管理画面 | あっちゃんAI',
  description: 'あっちゃんAI ポートフォリオ管理画面',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
