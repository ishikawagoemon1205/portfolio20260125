/**
 * 画像一覧取得・アップロードAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await (supabase as any)
      .from('profile_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('画像取得エラー:', error);
    return NextResponse.json({ error: '画像の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'other';

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // ファイルをバイトに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ユニークなファイル名を生成
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${timestamp}.${ext}`;
    const filePath = `images/${category}/${fileName}`;

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio')
      .getPublicUrl(filePath);

    // データベースに保存
    const { data: imageData, error: dbError } = await (supabase as any)
      .from('profile_images')
      .insert({
        url: publicUrl,
        alt: file.name,
        category,
        storage_path: filePath,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json(imageData);
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json({ error: '画像のアップロードに失敗しました' }, { status: 500 });
  }
}
