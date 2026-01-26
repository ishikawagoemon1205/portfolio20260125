/**
 * サイト生成ログページ
 */

import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin';
import { SitesTable } from './SitesTable';

async function SitesContent() {
  const supabase = await createAdminClient();

  // 生成されたサイト一覧を取得
  const { data: sites, error } = await supabase
    .from('generated_sites')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('サイト取得エラー:', error);
  }

  return <SitesTable initialData={sites || []} />;
}

export default function SitesPage() {
  return (
    <div>
      <PageHeader
        title="サイト生成ログ"
        description="AIによって生成されたサイトの履歴を確認できます"
      />
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }>
        <SitesContent />
      </Suspense>
    </div>
  );
}
