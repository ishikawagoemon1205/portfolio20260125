/**
 * 管理画面サイドバー
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    label: 'ダッシュボード',
    href: '/admin',
    icon: '📊',
  },
  {
    label: '問い合わせ',
    href: '/admin/inquiries',
    icon: '📧',
  },
  {
    label: '会話履歴',
    href: '/admin/conversations',
    icon: '💬',
  },
  {
    label: '訪問者',
    href: '/admin/visitors',
    icon: '👤',
  },
  {
    label: 'サイト生成ログ',
    href: '/admin/sites',
    icon: '🌐',
  },
  {
    label: 'AI設定',
    href: '/admin/settings/ai',
    icon: '⚙️',
  },
  {
    label: 'プロフィール',
    href: '/admin/settings/profile',
    icon: '📝',
  },
  {
    label: '動的プロフィール',
    href: '/admin/profile-data',
    icon: '⭐',
  },
  {
    label: 'キャラクター',
    href: '/admin/settings/character',
    icon: '🎭',
  },
  {
    label: '画像管理',
    href: '/admin/images',
    icon: '🖼️',
  },
  {
    label: '分析',
    href: '/admin/analytics',
    icon: '📈',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* ロゴ */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            あっちゃんAI
          </span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">管理画面</p>
      </div>

      {/* メニュー */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <span>←</span>
          <span>サイトに戻る</span>
        </Link>
      </div>
    </aside>
  );
}
