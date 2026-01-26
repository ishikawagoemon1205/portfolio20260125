/**
 * 問い合わせモーダルコンポーネント
 * チャット内容からAIが要約を生成し、フォームに自動入力
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface InquirySummary {
  summary: string;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  requirements: string[];
  concerns: string[];
}

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  messages: Message[];
}

export function InquiryModal({
  isOpen,
  onClose,
  conversationId,
  messages,
}: InquiryModalProps) {
  const [step, setStep] = useState<'loading' | 'form' | 'success'>('loading');
  const [summary, setSummary] = useState<InquirySummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    summaryText: '',
    projectType: '',
    budgetRange: '',
    timeline: '',
    details: '',
  });
  
  // 会話から要約を生成
  const generateSummary = useCallback(async () => {
    if (messages.length === 0) {
      setSummary({
        summary: '',
        projectType: null,
        budgetRange: null,
        timeline: null,
        requirements: [],
        concerns: [],
      });
      setStep('form');
      return;
    }
    
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setFormData(prev => ({
          ...prev,
          summaryText: data.summary || '',
          projectType: data.projectType || '',
          budgetRange: data.budgetRange || '',
          timeline: data.timeline || '',
          details: data.requirements?.join('\n') || '',
        }));
      } else {
        // エラー時はデフォルト値を使用
        setSummary({
          summary: '',
          projectType: null,
          budgetRange: null,
          timeline: null,
          requirements: [],
          concerns: [],
        });
      }
    } catch (e) {
      console.error('要約生成エラー:', e);
    } finally {
      setStep('form');
    }
  }, [messages]);
  
  // モーダルが開いたら要約を生成
  useEffect(() => {
    if (isOpen) {
      setStep('loading');
      setError(null);
      generateSummary();
    }
  }, [isOpen, generateSummary]);
  
  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.summaryText) {
      setError('メールアドレスとお問い合わせ内容は必須です');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          company: formData.company,
          summary: formData.summaryText,
          projectType: formData.projectType,
          budgetRange: formData.budgetRange,
          timeline: formData.timeline,
          details: formData.details,
          conversationId,
        }),
      });
      
      if (res.ok) {
        setStep('success');
      } else {
        const data = await res.json();
        setError(data.error || '送信に失敗しました');
      }
    } catch (e) {
      setError('送信中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 入力ハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {step === 'success' ? '送信完了' : 'お問い合わせ'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ローディング */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  会話内容を分析中...
                </p>
              </div>
            )}
            
            {/* フォーム */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* AI要約の表示 */}
                {summary && summary.summary && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">✨</span>
                      <div>
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                          AIが会話内容を要約しました
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          内容を確認・編集して送信してください
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* メールアドレス（必須） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {/* 名前 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      お名前
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="山田 太郎"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      会社名
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="株式会社〇〇"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* プロジェクトタイプ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ご依頼の種類
                  </label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value="website">Webサイト制作</option>
                    <option value="webapp">Webアプリ開発</option>
                    <option value="mobile">モバイルアプリ開発</option>
                    <option value="system">システム開発</option>
                    <option value="consulting">技術コンサルティング</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                
                {/* 予算・納期 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ご予算
                    </label>
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      <option value="~50万円">〜50万円</option>
                      <option value="50〜100万円">50〜100万円</option>
                      <option value="100〜300万円">100〜300万円</option>
                      <option value="300万円〜">300万円〜</option>
                      <option value="相談">要相談</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      希望納期
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      placeholder="3ヶ月後"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* お問い合わせ内容（AI要約付き） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    お問い合わせ内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="summaryText"
                    value={formData.summaryText}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="ご相談内容をご記入ください..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                
                {/* 詳細・要件 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    詳細・要件など
                  </label>
                  <textarea
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    rows={3}
                    placeholder="具体的な要件があればご記入ください..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                
                {/* エラー表示 */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                    rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}
                
                {/* 送信ボタン */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                    font-semibold rounded-lg hover:opacity-90 transition-opacity
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      お問い合わせを送信
                    </>
                  )}
                </button>
              </form>
            )}
            
            {/* 送信完了 */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 
                  flex items-center justify-center text-4xl">
                  ✅
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  お問い合わせありがとうございます！
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  いただいた内容を確認次第、<br />
                  ご連絡させていただきます。
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                    rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
