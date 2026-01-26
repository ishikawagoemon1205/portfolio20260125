/**
 * 画像削除API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    // まず画像情報を取得
    const { data: image, error: fetchError } = await (supabase as any)
      .from('profile_images')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Storageから削除
    if (image?.storage_path) {
      await supabase.storage
        .from('portfolio')
        .remove([image.storage_path]);
    }

    // データベースから削除
    const { error: deleteError } = await (supabase as any)
      .from('profile_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('画像削除エラー:', error);
    return NextResponse.json({ error: '画像の削除に失敗しました' }, { status: 500 });
  }
}
