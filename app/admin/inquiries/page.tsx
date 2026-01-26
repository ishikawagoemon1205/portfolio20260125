/**
 * 問い合わせ管理画面
 */

import { Suspense } from 'react';
import { PageHeader } from '@/components/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { InquiriesTable } from './InquiriesTable';

async function getInquiries() {
  const supabase = await createAdminClient();
  
  const { data, error } = await (supabase as any)
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('問い合わせ取得エラー:', error);
    return [];
  }
  
  return data || [];
}

export default async function InquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <div>
      <PageHeader
        title="問い合わせ管理"
        description={`全${inquiries.length}件の問い合わせ`}
      />

      <Suspense fallback={<div>読み込み中...</div>}>
        <InquiriesTable initialData={inquiries} />
      </Suspense>
    </div>
  );
}
