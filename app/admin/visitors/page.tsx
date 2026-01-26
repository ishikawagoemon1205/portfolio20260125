/**
 * 訪問者管理ページ
 */

import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin';
import { VisitorsTable } from './VisitorsTable';

async function VisitorsContent() {
  const supabase = await createAdminClient();

  // 訪問者一覧を取得
  const { data: visitors, error } = await (supabase as any)
    .from('visitors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('訪問者取得エラー:', error);
  }

  return <VisitorsTable initialData={visitors || []} />;
}

export default function VisitorsPage() {
  return (
    <div>
      <PageHeader
        title="訪問者管理"
        description="サイトへの訪問者を確認できます"
      />
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }>
        <VisitorsContent />
      </Suspense>
    </div>
  );
}
