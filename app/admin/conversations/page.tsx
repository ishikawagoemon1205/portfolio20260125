/**
 * 会話履歴管理画面
 */

import { Suspense } from 'react';
import { PageHeader } from '@/components/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { ConversationsTable } from './ConversationsTable';

async function getConversations() {
  const supabase = await createAdminClient();
  
  const { data, error } = await (supabase as any)
    .from('conversations')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('会話取得エラー:', error);
    return [];
  }
  
  return data || [];
}

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <div>
      <PageHeader
        title="会話履歴"
        description={`全${conversations.length}件の会話`}
      />

      <Suspense fallback={<div>読み込み中...</div>}>
        <ConversationsTable initialData={conversations} />
      </Suspense>
    </div>
  );
}
