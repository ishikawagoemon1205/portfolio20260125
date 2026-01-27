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
      .from('portfolio20260125')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // バケットが存在しない場合のエラーメッセージ
      if (uploadError.message?.includes('Bucket not found')) {
        return NextResponse.json({ 
          error: 'Supabase Storageのバケット「portfolio20260125」が作成されていません。Supabaseダッシュボードで作成してください。',
          details: uploadError.message 
        }, { status: 500 });
      }
      
      throw uploadError;
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio20260125')
      .getPublicUrl(filePath);

    // profile_imagesテーブルに保存（永続化）
    const { data: imageRecord, error: dbError } = await (supabase as any)
      .from('profile_images')
      .insert({
        image_url: publicUrl,
        storage_path: filePath,
        alt_text: file.name.split('.')[0], // ファイル名をaltテキストとして使用
        category: category,
        is_active: category === 'profile' ? true : false, // プロフィール画像はデフォルトでアクティブ
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB保存エラー:', dbError);
      // DBエラーでもStorageにはアップロード済みなのでURLは返す
      return NextResponse.json({ 
        id: null,
        url: publicUrl,
        storage_path: filePath,
        file_name: file.name,
        warning: 'データベースへの保存に失敗しました。テーブルが存在するか確認してください。'
      });
    }

    return NextResponse.json({ 
      id: imageRecord.id,
      url: imageRecord.image_url,
      alt: imageRecord.alt_text,
      category: imageRecord.category,
      storage_path: filePath,
      created_at: imageRecord.created_at
    });
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json({ error: '画像のアップロードに失敗しました' }, { status: 500 });
  }
}
