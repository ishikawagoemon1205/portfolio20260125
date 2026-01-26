/**
 * 画像管理ページ
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/admin';
import Image from 'next/image';

interface ProfileImage {
  id: string;
  url: string;
  alt: string;
  category: string;
  created_at: string;
}

const categoryOptions = [
  { value: 'profile', label: 'プロフィール' },
  { value: 'project', label: 'プロジェクト' },
  { value: 'other', label: 'その他' },
];

export default function ImagesPage() {
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/admin/images');
      if (res.ok) {
        const data = await res.json();
        setImages(data || []);
      }
    } catch (error) {
      console.error('画像読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ファイルサイズは5MB以下にしてください' });
      return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '画像ファイルを選択してください' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory === 'all' ? 'other' : selectedCategory);

      const res = await fetch('/api/admin/images', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newImage = await res.json();
        setImages([newImage, ...images]);
        setMessage({ type: 'success', text: '画像をアップロードしました' });
      } else {
        throw new Error('アップロードに失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '画像のアップロードに失敗しました' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('この画像を削除しますか？')) return;

    try {
      const res = await fetch(`/api/admin/images/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setImages(images.filter(img => img.id !== id));
        setMessage({ type: 'success', text: '画像を削除しました' });
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '画像の削除に失敗しました' });
    }
  };

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="画像管理"
        description="プロフィールやプロジェクトの画像を管理できます"
      />

      <div className="space-y-6">
        {/* アップロードエリア */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`px-6 py-3 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? 'アップロード中...' : '画像をアップロード'}
            </label>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <option value="all">すべてのカテゴリ</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            対応形式: JPEG, PNG, GIF, WebP / 最大サイズ: 5MB
          </p>
        </div>

        {/* 画像グリッド */}
        {filteredImages.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12">
            <p className="text-gray-500 text-center">
              画像がありません
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group"
              >
                <div className="aspect-square relative">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      開く
                    </button>
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                    {categoryOptions.find(c => c.value === image.category)?.label || image.category}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(image.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
