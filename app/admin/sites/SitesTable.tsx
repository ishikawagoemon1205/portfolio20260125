/**
 * サイト生成ログテーブルコンポーネント
 */

'use client';

import { useState } from 'react';

interface Site {
  id: string;
  conversation_id: string;
  visitor_id: string;
  site_type: string;
  html_content: string;
  css_content: string;
  preview_url: string | null;
  tokens_used: number | null;
  created_at: string;
}

export function SitesTable({ initialData }: { initialData: Site[] }) {
  const [sites] = useState<Site[]>(initialData);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const filteredSites = sites.filter(s => 
    s.visitor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.site_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSiteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      portfolio: 'ポートフォリオ',
      landing: 'ランディングページ',
      blog: 'ブログ',
      corporate: '企業サイト',
    };
    return labels[type] || type;
  };

  const generatePreviewHTML = (site: Site) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${site.css_content}</style>
        </head>
        <body>${site.html_content}</body>
      </html>
    `;
  };

  return (
    <div className="flex gap-6">
      {/* テーブル */}
      <div className="flex-1">
        {/* 検索 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="訪問者IDまたはサイトタイプで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>

        {/* テーブル */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">生成日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">訪問者ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">サイトタイプ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">トークン使用量</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    生成されたサイトはありません
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => (
                  <tr
                    key={site.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedSite?.id === site.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(site.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {site.visitor_id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                        {getSiteTypeLabel(site.site_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {site.tokens_used?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedSite(site);
                          setShowPreview(true);
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                      >
                        プレビュー
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* プレビューモーダル */}
      {showPreview && selectedSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  サイトプレビュー
                </h3>
                <p className="text-xs text-gray-500">
                  {getSiteTypeLabel(selectedSite.site_type)} - {new Date(selectedSite.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedSite(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={generatePreviewHTML(selectedSite)}
                className="w-full h-full border-0"
                title="Site Preview"
                sandbox="allow-scripts"
              />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-4">
              <button
                onClick={() => {
                  const blob = new Blob([generatePreviewHTML(selectedSite)], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `site-${selectedSite.id.slice(0, 8)}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                HTMLをダウンロード
              </button>
              <button
                onClick={() => {
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(generatePreviewHTML(selectedSite));
                    newWindow.document.close();
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                新しいタブで開く
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
