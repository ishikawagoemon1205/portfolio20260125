/**
 * 会話テーブルコンポーネント
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  visitor_id: string;
  title: string | null;
  status: string;
  message_count: number;
  started_at: string;
  last_message_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function ConversationsTable({ initialData }: { initialData: Conversation[] }) {
  const router = useRouter();
  const [conversations] = useState<Conversation[]>(initialData);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(c => 
    c.visitor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.title && c.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* テーブル */}
      <div className="flex-1">
        {/* 検索 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="訪問者IDまたはタイトルで検索..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">開始日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">訪問者ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">メッセージ数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最終更新</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    会話はありません
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedConversation?.id === conv.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(conv.started_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {conv.visitor_id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {conv.message_count}件
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(conv.last_message_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conv.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {conv.status === 'active' ? 'アクティブ' : '終了'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* メッセージパネル */}
      {selectedConversation && (
        <div className="w-[450px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sticky top-6 h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                会話詳細
              </h3>
              <p className="text-xs text-gray-500">
                {new Date(selectedConversation.started_at).toLocaleString('ja-JP')}
              </p>
            </div>
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">メッセージがありません</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
