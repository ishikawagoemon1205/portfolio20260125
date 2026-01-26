/**
 * チャット入力コンポーネント
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  remainingMessages?: number;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'メッセージを入力...',
  maxLength = 2000,
  remainingMessages,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 日本語入力中（IME変換中）の場合は送信しない
    if (e.nativeEvent.isComposing || e.key === 'Process') {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    
    // 自動リサイズ
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  };
  
  const isOverLimit = message.length > maxLength;
  
  return (
    <div className="border-t border-gray-700/50 bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-sm p-4">
      {/* 残りメッセージ数表示 */}
      {remainingMessages !== undefined && remainingMessages >= 0 && (
        <div className="text-xs text-gray-400 mb-2 text-center">
          本日残り {remainingMessages} メッセージ
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full resize-none rounded-xl border px-4 py-3 pr-12 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-gray-800/50 text-white border-gray-700/50
              placeholder:text-gray-500
              ${isOverLimit ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
            style={{ maxHeight: '150px' }}
          />
          
          {/* 文字数カウンター */}
          <div className={`absolute bottom-2 right-3 text-xs ${
            isOverLimit ? 'text-red-500' : 'text-gray-400'
          }`}>
            {message.length}/{maxLength}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={disabled || !message.trim() || isOverLimit}
          className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500 text-white
            flex items-center justify-center
            hover:bg-blue-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
