/**
 * チャットコンテナコンポーネント
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, ChatMessageProps, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { InquiryModal } from '../inquiry/InquiryModal';

// ローカルストレージのキー
const CONVERSATION_ID_KEY = 'acchan_conversation_id';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatContainerProps {
  initialMessages?: Message[];
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

export function ChatContainer({
  initialMessages = [],
  conversationId: initialConversationId,
  onConversationCreated,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remainingMessages, setRemainingMessages] = useState<number | undefined>();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 自動スクロール
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);
  
  // 訪問者情報を取得
  useEffect(() => {
    async function fetchVisitorInfo() {
      try {
        const res = await fetch('/api/visitor');
        if (res.ok) {
          const data = await res.json();
          setRemainingMessages(data.tier?.remaining?.messages);
        }
      } catch (e) {
        console.error('訪問者情報取得エラー:', e);
      }
    }
    fetchVisitorInfo();
  }, []);
  
  // ページロード時に保存された会話IDから履歴を復元
  useEffect(() => {
    async function loadConversationHistory() {
      try {
        // ローカルストレージから会話IDを取得
        const savedConversationId = localStorage.getItem(CONVERSATION_ID_KEY);
        
        if (savedConversationId && !initialConversationId) {
          // 保存された会話のメッセージを取得
          const res = await fetch(`/api/conversations/${savedConversationId}`);
          
          if (res.ok) {
            const data = await res.json();
            setConversationId(savedConversationId);
            setMessages(data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            })));
          } else {
            // 会話が見つからない場合はローカルストレージをクリア
            localStorage.removeItem(CONVERSATION_ID_KEY);
          }
        }
      } catch (e) {
        console.error('会話履歴取得エラー:', e);
        localStorage.removeItem(CONVERSATION_ID_KEY);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    
    loadConversationHistory();
  }, [initialConversationId]);
  
  // 会話IDが変更されたらローカルストレージに保存
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
    }
  }, [conversationId]);
  
  // 新しい会話を開始
  const handleNewConversation = () => {
    localStorage.removeItem(CONVERSATION_ID_KEY);
    setConversationId(undefined);
    setMessages([]);
    setError(null);
  };
  
  // サイト生成
  const [isGeneratingSite, setIsGeneratingSite] = useState(false);
  const [generatedSiteHtml, setGeneratedSiteHtml] = useState<string | null>(null);
  
  const handleGenerateSite = async () => {
    if (!conversationId || messages.length === 0) {
      setError('会話履歴からサイトを生成します。まずはチャットでご要望をお聞かせください。');
      return;
    }
    
    setIsGeneratingSite(true);
    setError(null);
    
    try {
      const res = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.htmlContent) {
          setGeneratedSiteHtml(data.htmlContent);
          
          // プレビュー表示通知をメッセージに追加
          const siteMessage: Message = {
            id: `site-${Date.now()}`,
            role: 'assistant',
            content: `✨ サイトを作成しました！下のプレビューをご確認ください。`,
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, siteMessage]);
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'サイト生成に失敗しました');
      }
    } catch (e) {
      setError('サイト生成中にエラーが発生しました');
    } finally {
      setIsGeneratingSite(false);
    }
  };
  
  // メッセージ送信
  const handleSend = async (content: string) => {
    if (isLoading) return;
    
    setError(null);
    setIsLoading(true);
    
    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'エラーが発生しました');
      }
      
      // ストリーミングレスポンスを処理
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('レスポンスの読み取りに失敗しました');
      }
      
      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'conversation_id') {
                setConversationId(data.conversationId);
                onConversationCreated?.(data.conversationId);
              } else if (data.type === 'chunk') {
                fullContent += data.content;
                setStreamingContent(fullContent);
              } else if (data.type === 'done') {
                // ストリーミング完了
                const aiMessage: Message = {
                  id: data.messageId || `ai-${Date.now()}`,
                  role: 'assistant',
                  content: fullContent,
                  createdAt: new Date().toISOString(),
                };
                setMessages(prev => [...prev, aiMessage]);
                setStreamingContent('');
                
                // 残りメッセージ数を更新
                if (remainingMessages !== undefined && remainingMessages > 0) {
                  setRemainingMessages(remainingMessages - 1);
                }
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              // JSON解析エラーは無視（不完全なチャンクの可能性）
            }
          }
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'エラーが発生しました';
      setError(errorMessage);
      console.error('チャットエラー:', e);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* ヘッダー */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
              🤖
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">あっちゃんAI</h2>
              <p className="text-xs text-gray-500">オンライン</p>
            </div>
          </div>
          
          {/* ヘッダーボタン群 */}
          <div className="flex items-center gap-2">
            {/* サイト生成ボタン */}
            {messages.length > 2 && conversationId && (
              <button
                onClick={handleGenerateSite}
                disabled={isGeneratingSite}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 
                  text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity
                  flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="会話内容からサイトを生成"
              >
                {isGeneratingSite ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    サイト生成
                  </>
                )}
              </button>
            )}
            
            {/* 新規会話ボタン */}
            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="新しい会話を開始"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            
            {/* お問い合わせボタン */}
            <button
              onClick={() => setShowInquiryModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 
                text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity
                flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              お問い合わせ
            </button>
          </div>
        </div>
      </div>
      
      {/* メッセージ一覧 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* 履歴読み込み中 */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        )}
        
        {/* ウェルカムメッセージ */}
        {!isLoadingHistory && messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl">
              👋
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              こんにちは！あっちゃんAIです
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              フリーランスエンジニアの石川篤寛のAI分身です。
              お仕事のご相談、技術的な質問、なんでもお気軽にどうぞ！
            </p>
            
            {/* クイックアクション */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '🚀 どんな開発ができる？',
                '💼 仕事を依頼したい',
                '📋 見積もりをお願い',
              ].map((text) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                    rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        
        <AnimatePresence>
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              createdAt={msg.createdAt}
            />
          ))}
        </AnimatePresence>
        
        {/* ストリーミング中のメッセージ */}
        {streamingContent && (
          <ChatMessage
            id="streaming"
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}
        
        {/* タイピングインジケーター */}
        {isLoading && !streamingContent && (
          <TypingIndicator />
        )}
        
        {/* エラーメッセージ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}
        
        {/* サイトプレビュー */}
        {generatedSiteHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                🎨 生成されたサイトプレビュー
              </span>
              <button
                onClick={() => setGeneratedSiteHtml(null)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="閉じる"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe
              srcDoc={generatedSiteHtml}
              className="w-full h-[500px] bg-white"
              title="生成されたサイト"
              sandbox="allow-scripts"
            />
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || isLoadingHistory}
        remainingMessages={remainingMessages}
      />
      
      {/* 問い合わせモーダル */}
      <InquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        conversationId={conversationId}
        messages={messages}
      />
    </div>
  );
}
