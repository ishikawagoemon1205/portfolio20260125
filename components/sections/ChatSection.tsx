/**
 * チャットセクション
 */

'use client';

import { motion } from 'framer-motion';
import { ChatContainer } from '@/components/chat';

export function ChatSection() {
  return (
    <section id="chat" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* セクションタイトル */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            💬 チャットで相談
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            お仕事のご依頼、技術的なご質問など、なんでもお気軽にどうぞ
          </p>
        </motion.div>
        
        {/* チャットコンテナ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          style={{ height: '600px' }}
        >
          <ChatContainer />
        </motion.div>
        
        {/* 補足情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>
            ※ このAIは石川篤寛のプロフィール情報を学習しています。
            <br />
            正確な情報は直接お問い合わせください。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
