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
  avatarUrl?: string; // AIアバター画像URL
}

// 記事情報の型
export interface ArticleInfo {
  slug: string;
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  tags?: string[];
}

export interface ChatContainerProps {
  initialMessages?: Message[];
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
  articleInfo?: ArticleInfo | null;
  onCloseArticle?: () => void;
  isLoadingArticle?: boolean;
}

export function ChatContainer({
  initialMessages = [],
  conversationId: initialConversationId,
  onConversationCreated,
  articleInfo,
  onCloseArticle,
  isLoadingArticle,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remainingMessages, setRemainingMessages] = useState<number | undefined>();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [dynamicSuggestQuestion, setDynamicSuggestQuestion] = useState<string | null>(null);
  
  // 記事モード関連の状態
  const [isArticleMode, setIsArticleMode] = useState(false);
  const [savedMessages, setSavedMessages] = useState<Message[]>([]);
  const [savedConversationId, setSavedConversationId] = useState<string | undefined>();
  
  // レート制限チェック（-1は無制限）
  const isAtLimit = remainingMessages !== undefined && remainingMessages !== -1 && remainingMessages <= 0;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // チャットコンテナ内のみスクロール（ページ全体はスクロールしない）
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);
  
  // 入力フィールドフォーカス時のスクロール（モバイル対応）- 無効化
  const handleInputFocus = useCallback(() => {
    // ページ全体のスクロールを防ぐため、チャットコンテナ内のみスクロール
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  }, []);
  
  // ユーザーがメッセージを送信した時のみスクロール
  const userSentMessageRef = useRef(false);
  const prevMessagesLengthRef = useRef(messages.length);
  
  useEffect(() => {
    // ユーザーがメッセージを送信した場合、またはストリーミング中のみスクロール
    if (userSentMessageRef.current || streamingContent) {
      scrollToBottom();
      if (!streamingContent) {
        userSentMessageRef.current = false;
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, streamingContent, scrollToBottom]);
  
  // 訪問者情報を取得
  useEffect(() => {
    async function fetchVisitorInfo() {
      try {
        const res = await fetch('/api/visitor');
        if (res.ok) {
          const data = await res.json();
          console.log('[ChatContainer] 訪問者情報取得:', data);
          console.log('[ChatContainer] 残りメッセージ数:', data.tier?.remaining?.messages);
          setRemainingMessages(data.tier?.remaining?.messages);
        }
      } catch (e) {
        console.error('訪問者情報取得エラー:', e);
      }
    }
    fetchVisitorInfo();
  }, []);
  
  // 動的サジェスト質問を取得
  useEffect(() => {
    async function fetchSuggestQuestion() {
      try {
        const res = await fetch('/api/chat/suggest-question');
        if (res.ok) {
          const data = await res.json();
          if (data.question) {
            setDynamicSuggestQuestion(data.question);
          }
        }
      } catch (e) {
        console.error('サジェスト質問取得エラー:', e);
      }
    }
    fetchSuggestQuestion();
  }, []);
  
  // 記事情報が変わったときに記事モードに切り替え（履歴ロードより優先）
  useEffect(() => {
    if (articleInfo) {
      console.log('[ChatContainer] 記事モードに切り替え - articleInfo:', articleInfo);
      // 履歴ロードを即座に完了させる
      setIsLoadingHistory(false);
      // 現在のチャット状態を保存（関数形式で最新の状態を参照）
      setMessages(currentMessages => {
        console.log('[ChatContainer] 現在のメッセージ数:', currentMessages.length);
        if (currentMessages.length > 0) {
          setSavedMessages(currentMessages);
          console.log('[ChatContainer] 過去チャットを保存しました');
        }
        return []; // 空のメッセージに設定
      });
      setConversationId(currentConvId => {
        if (currentConvId) {
          setSavedConversationId(currentConvId);
          console.log('[ChatContainer] 会話IDを保存しました:', currentConvId);
        }
        return undefined; // 会話IDをリセット
      });
      // 記事モードに切り替え
      setIsArticleMode(true);
      console.log('[ChatContainer] 記事モード有効化');
    } else if (!articleInfo && isArticleMode) {
      // articleInfoがnullになった場合、記事モードを解除
      console.log('[ChatContainer] 記事モードを解除');
      setIsArticleMode(false);
    }
  }, [articleInfo, isArticleMode]);
  
  // ページロード時に保存された会話IDから履歴を復元（初回のみ）
  useEffect(() => {
    async function loadConversationHistory() {
      try {
        // 記事から来た場合は履歴をロードしない
        if (articleInfo) {
          console.log('[ChatContainer] 記事モード中 - 履歴ロードをスキップ');
          setIsLoadingHistory(false);
          return;
        }
        
        console.log('[ChatContainer] 履歴ロード開始');
        
        // ローカルストレージから会話IDを取得
        const storedConversationId = localStorage.getItem(CONVERSATION_ID_KEY);
        
        if (storedConversationId && !initialConversationId) {
          console.log('[ChatContainer] 保存された会話IDを発見:', storedConversationId);
          // 保存された会話のメッセージを取得
          const res = await fetch(`/api/conversations/${storedConversationId}`);
          
          if (res.ok) {
            const data = await res.json();
            console.log('[ChatContainer] 履歴メッセージ取得成功:', data.messages.length, '件');
            setConversationId(storedConversationId);
            setMessages(data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            })));
          } else {
            console.log('[ChatContainer] 会話が見つからない - ローカルストレージをクリア');
            // 会話が見つからない場合はローカルストレージをクリア
            localStorage.removeItem(CONVERSATION_ID_KEY);
          }
        } else {
          console.log('[ChatContainer] 履歴なし');
        }
      } catch (e) {
        console.error('会話履歴取得エラー:', e);
        localStorage.removeItem(CONVERSATION_ID_KEY);
      } finally {
        console.log('[ChatContainer] 履歴ロード完了');
        setIsLoadingHistory(false);
      }
    }
    
    loadConversationHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, articleInfo]); // isArticleModeを削除（初回のみ実行）
  
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
    setShowMobileMenu(false);
    // 記事モードも解除
    setIsArticleMode(false);
    setSavedMessages([]);
    setSavedConversationId(undefined);
  };
  
  // 記事モードを閉じて過去チャットを復元
  const handleCloseArticleMode = () => {
    console.log('[ChatContainer] 記事モードを閉じる - 過去チャットを復元');
    // 記事モードを解除
    setIsArticleMode(false);
    // 保存していた過去チャットを復元
    if (savedMessages.length > 0 || savedConversationId) {
      setMessages(savedMessages);
      setConversationId(savedConversationId);
    }
    // 保存状態をクリア
    setSavedMessages([]);
    setSavedConversationId(undefined);
    // 親コンポーネントに通知
    onCloseArticle?.();
  };

  // サイト生成
  const [isGeneratingSite, setIsGeneratingSite] = useState(false);
  const [generatedSiteUrl, setGeneratedSiteUrl] = useState<string | null>(null);
  const [generatedSiteHtml, setGeneratedSiteHtml] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // 要件ヒアリングが十分に行われているかを判定
  const hasEnoughRequirementInfo = useCallback(() => {
    if (messages.length < 6) return false; // 最低3往復以上の会話が必要
    
    // ユーザーメッセージとAIメッセージの数をカウント
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // ユーザーが最低3回以上回答していることを確認
    if (userMessages.length < 3) return false;
    
    // AIが質問形式のメッセージを2回以上送っているか確認
    const questionCount = assistantMessages.filter(m => 
      m.content.includes('？') || m.content.includes('?') || 
      m.content.includes('ですか') || m.content.includes('ますか')
    ).length;
    
    if (questionCount < 2) return false;
    
    // 要件に関連するキーワードが含まれているか確認
    const allUserContent = userMessages.map(m => m.content).join(' ');
    const requirementKeywords = [
      'サイト', 'ページ', 'Webサイト', 'ホームページ', 'ウェブサイト',
      '目的', '用途', '機能', 'デザイン', '雰囲気',
      'ターゲット', 'イメージ', 'コンセプト', '色'
    ];
    
    const hasKeywords = requirementKeywords.some(keyword => allUserContent.includes(keyword));
    
    return hasKeywords && userMessages.length >= 3;
  }, [messages]);
  
  const handleGenerateSite = async () => {
    if (!conversationId || messages.length === 0) {
      setError('会話履歴からサイトを生成します。まずはチャットでご要望をお聞かせください。');
      return;
    }
    
    // 要件ヒアリングチェック
    if (!hasEnoughRequirementInfo()) {
      const warningMessage: Message = {
        id: `warning-${Date.now()}`,
        role: 'assistant',
        content: `申し訳ございません。サイト生成には、もう少し詳しいご要望をお伺いする必要があります。\n\n以下のような情報を教えていただけますか？\n• サイトの目的や用途\n• ターゲットとなる方\n• デザインの雰囲気やイメージ\n• 必要な機能やページ構成\n\nこれらの情報をもとに、より良いサイトを作成いたします！`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, warningMessage]);
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
    
    // ユーザーがメッセージを送信したフラグを立てる
    userSentMessageRef.current = true;
    
    // 記事モードで初回メッセージ送信時、保存していた過去チャットを完全にクリア
    if (isArticleMode && messages.length === 0) {
      console.log('[ChatContainer] 記事モードで新規メッセージ - 過去チャットを完全にクリア');
      setSavedMessages([]);
      setSavedConversationId(undefined);
      // ローカルストレージもクリア（新しい会話として開始）
      localStorage.removeItem(CONVERSATION_ID_KEY);
    }
    
    // 記事からの質問の場合、コンテキストを追加
    let messageToSend = content;
    if (isArticleMode && articleInfo && messages.length === 0) {
      // 最初のメッセージの場合、記事のコンテキストを含める
      messageToSend = `【記事「${articleInfo.title}」についての質問】\n${content}`;
    }
    
    // ユーザーメッセージを追加（表示用は元のメッセージ）
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
          message: messageToSend,
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
                  avatarUrl: data.avatarUrl || undefined, // アバター画像URL
                };
                setMessages(prev => [...prev, aiMessage]);
                setStreamingContent('');
                
                // サーバーから返された正確な残りメッセージ数で更新
                if (data.remainingMessages !== undefined) {
                  setRemainingMessages(data.remainingMessages);
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
      
      // 上限エラーの場合は残りメッセージ数を0に設定
      if (errorMessage.includes('上限に達しました')) {
        setRemainingMessages(0);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {/* ヘッダー */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900 z-10">
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
            {/* デスクトップ表示 */}
            <div className="hidden md:flex items-center gap-2">
              {/* サイト生成ボタン */}
              {messages.length > 2 && conversationId && (
                <button
                  onClick={handleGenerateSite}
                  disabled={isGeneratingSite || !hasEnoughRequirementInfo() || !!generatedSiteHtml}
                  className={`px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 
                    text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity
                    flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed
                    ${(!hasEnoughRequirementInfo() || generatedSiteHtml) ? 'opacity-50' : ''}`}
                  title={generatedSiteHtml 
                    ? "このセッションでは既にサイトを生成済みです" 
                    : hasEnoughRequirementInfo() 
                      ? "会話内容からサイトを生成" 
                      : "サイト生成には、もう少し詳しいご要望をお伺いする必要があります"}
                >
                  {isGeneratingSite ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      生成中...
                    </>
                  ) : generatedSiteHtml ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M5 13l4 4L19 7" />
                      </svg>
                      生成済み
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      サイト生成
                      {!hasEnoughRequirementInfo() && (
                        <span className="text-xs opacity-75">（要件不足）</span>
                      )}
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
            
            {/* モバイル表示 */}
            <div className="flex md:hidden items-center gap-2">
              {/* サイト生成アイコンボタン（モバイル） */}
              {messages.length > 2 && conversationId && (
                <button
                  onClick={handleGenerateSite}
                  disabled={isGeneratingSite || !hasEnoughRequirementInfo() || !!generatedSiteHtml}
                  className={`p-2 bg-gradient-to-r from-blue-500 to-cyan-500 
                    text-white rounded-lg hover:opacity-90 transition-opacity
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${(!hasEnoughRequirementInfo() || generatedSiteHtml) ? 'opacity-50' : ''}`}
                  title={generatedSiteHtml 
                    ? "生成済み" 
                    : hasEnoughRequirementInfo() 
                      ? "サイト生成" 
                      : "要件ヒアリングが必要です"}
                >
                  {isGeneratingSite ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : generatedSiteHtml ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )}
                </button>
              )}
              
              {/* お問い合わせアイコンボタン（モバイル） */}
              <button
                onClick={() => setShowInquiryModal(true)}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 
                  text-white rounded-lg hover:opacity-90 transition-opacity"
                title="お問い合わせ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* モバイルメニューボタン */}
              <div className="relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                    hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* モバイルドロップダウンメニュー - fixedで最上位に配置 */}
      {showMobileMenu && (
        <>
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 z-[60] md:hidden" 
            onClick={() => setShowMobileMenu(false)}
          />
          {/* メニュー本体 */}
          <div className="fixed right-4 top-[120px] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[70] md:hidden">
            {messages.length > 2 && conversationId && (
              <button
                onClick={() => {
                  handleGenerateSite();
                  setShowMobileMenu(false);
                }}
                disabled={isGeneratingSite || !hasEnoughRequirementInfo() || !!generatedSiteHtml}
                className={`w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 rounded-t-lg
                  ${(!hasEnoughRequirementInfo() || generatedSiteHtml) ? 'opacity-50' : ''}`}
                title={generatedSiteHtml ? '生成済み' : !hasEnoughRequirementInfo() ? '要件ヒアリングが必要です' : ''}
              >
                {generatedSiteHtml ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                )}
                {isGeneratingSite ? '生成中...' : generatedSiteHtml ? '生成済み' : 'サイト生成'}
                {!generatedSiteHtml && !hasEnoughRequirementInfo() && (
                  <span className="text-xs opacity-75">（要件不足）</span>
                )}
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => {
                  handleNewConversation();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新しい会話
              </button>
            )}
            <button
              onClick={() => {
                setShowInquiryModal(true);
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              お問い合わせ
            </button>
          </div>
        </>
      )}
      
      {/* メッセージ一覧 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
        }}
      >
        {/* 履歴読み込み中 */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        )}
        
        {/* 記事からの質問モード */}
        {!isLoadingHistory && isArticleMode && messages.length === 0 && !isLoading && articleInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6 px-4"
          >
            {/* 記事カード */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden mb-4">
              {/* 閉じるボタン */}
              <button
                onClick={handleCloseArticleMode}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="閉じる"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex flex-col sm:flex-row">
                {/* サムネイル */}
                {articleInfo.thumbnail_url && (
                  <div className="w-full sm:w-32 h-24 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img 
                      src={articleInfo.thumbnail_url} 
                      alt={articleInfo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* 記事情報 */}
                <div className="p-4 flex-1">
                  <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">
                    📄 この記事について質問
                  </p>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                    {articleInfo.title}
                  </h4>
                  {articleInfo.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {articleInfo.subtitle}
                    </p>
                  )}
                  {articleInfo.tags && articleInfo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {articleInfo.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 案内メッセージ */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                この記事について質問してください。<br />
                下のテキストボックスから質問を入力できます。
              </p>
              
              {/* 制限到達時のメッセージ */}
              {isAtLimit && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-4">
                  メッセージ上限に達しています。お問い合わせからご連絡ください。
                </p>
              )}
            </div>
          </motion.div>
        )}
        
        {/* 記事読み込み中 */}
        {!isLoadingHistory && messages.length === 0 && !isLoading && isLoadingArticle && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-2 text-gray-500">記事情報を読み込み中...</span>
          </div>
        )}
        
        {/* ウェルカムメッセージ（通常モード） */}
        {!isLoadingHistory && messages.length === 0 && !isLoading && !isArticleMode && !articleInfo && !isLoadingArticle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            {/* 手のアイコン - モバイルでは非表示 */}
            <div className="hidden md:flex w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-4xl">
              👋
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              こんにちは！あっちゃんAIです
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-3">
              フリーランスエンジニアの石川敦大のAI分身です。
              お仕事のご相談、技術的な質問、なんでもお気軽にどうぞ！
            </p>
            
            {/* 注釈 */}
            <p className="text-xs text-gray-500 dark:text-gray-500 max-w-md mx-auto mb-6">
              ※ このAIは石川敦大のプロフィール情報を学習しています。<br />
              正確な情報は直接お問い合わせください。
            </p>
            
            {/* クイックアクション */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'あっちゃんってどんな人？',
                'おすすめの記事は？',
                ...(dynamicSuggestQuestion ? [dynamicSuggestQuestion] : []),
              ].map((text) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  disabled={isAtLimit}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                    rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800"
                >
                  {text}
                </button>
              ))}
            </div>
            
            {/* 制限到達時のメッセージ */}
            {isAtLimit && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-4">
                メッセージ上限に達しています。お問い合わせからご連絡ください。
              </p>
            )}
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
              avatarUrl={msg.avatarUrl}
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
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
        <ChatInput
          onSend={handleSend}
          onFocus={handleInputFocus}
          disabled={isLoading || isLoadingHistory}
          remainingMessages={remainingMessages}
          onOpenInquiry={() => setShowInquiryModal(true)}
        />
      </div>
      
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
