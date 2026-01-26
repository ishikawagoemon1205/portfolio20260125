/**
 * チャットメッセージコンポーネント
 */

'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isStreaming?: boolean;
  avatarUrl?: string;
}

export function ChatMessage({
  role,
  content,
  createdAt,
  isStreaming,
  avatarUrl,
}: ChatMessageProps) {
  const isUser = role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* アバター */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden ${
        isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {!isUser && avatarUrl ? (
          <img src={avatarUrl} alt="AI Avatar" className="w-full h-full object-cover" />
        ) : isUser ? (
          <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
            👤
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-lg">
            🤖
          </div>
        )}
      </div>
      
      {/* メッセージ本文 */}
      <div className={`max-w-[75%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </p>
        </div>
        
        {/* タイムスタンプ */}
        {createdAt && (
          <p className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {format(new Date(createdAt), 'HH:mm', { locale: ja })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * タイピングインジケーター
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 items-center"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
        🤖
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
