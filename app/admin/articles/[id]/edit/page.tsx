/**
 * 記事編集ページ
 * フルスクリーンモーダル風 Markdownエディタ
 */

'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// SSRを無効化
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  tags: string[];
  related_experience_ids: string[];
  thumbnail_url: string | null;
  is_published: boolean;
  published_at: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // フォームデータ
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  // 元のデータ（変更検出用）
  const [originalData, setOriginalData] = useState<{
    title: string;
    subtitle: string;
    slug: string;
    thumbnailUrl: string;
    content: string;
    tags: string[];
  } | null>(null);
  
  // 既存タグ一覧（オートコンプリート用）
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // タグ入力候補をフィルタリング
  const filteredTagSuggestions = availableTags.filter(
    (tag) => 
      !tags.includes(tag) && 
      tag.toLowerCase().includes(tagInput.toLowerCase())
  );

  // 既存タグを取得
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch('/api/admin/articles/tags');
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags || []);
        }
      } catch (err) {
        console.error('タグ取得エラー:', err);
      }
    };
    loadTags();
  }, []);

  // 記事読み込み
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const res = await fetch(`/api/admin/articles?id=${id}`);
        if (!res.ok) throw new Error('記事が見つかりません');
        
        const data = await res.json();
        const article: Article = data.article;
        
        setTitle(article.title);
        setSubtitle(article.subtitle || '');
        setSlug(article.slug);
        setThumbnailUrl(article.thumbnail_url || '');
        setContent(article.content);
        setTags(article.tags || []);
        setIsPublished(article.is_published);
        
        // 元のデータを保存（変更検出用）
        setOriginalData({
          title: article.title,
          subtitle: article.subtitle || '',
          slug: article.slug,
          thumbnailUrl: article.thumbnail_url || '',
          content: article.content,
          tags: article.tags || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  // 変更があるかどうかを判定
  const hasUnsavedChanges = useCallback(() => {
    if (!originalData) return false;
    return (
      title !== originalData.title ||
      subtitle !== originalData.subtitle ||
      slug !== originalData.slug ||
      thumbnailUrl !== originalData.thumbnailUrl ||
      content !== originalData.content ||
      JSON.stringify(tags) !== JSON.stringify(originalData.tags)
    );
  }, [title, subtitle, slug, thumbnailUrl, content, tags, originalData]);

  // ブラウザの離脱防止
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 閉じるボタンのハンドラー
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowExitConfirm(true);
    } else {
      router.push('/admin/articles');
    }
  };

  // スラッグ生成
  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // 画像アップロード処理
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/images', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.error || '画像のアップロードに失敗しました';
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // エディタ内に画像を挿入
  const insertImageToEditor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleImageUpload(file);
    if (url) {
      const imageMarkdown = `![${file.name}](${url})`;
      setContent((prev) => prev + '\n\n' + imageMarkdown + '\n');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // サムネイル画像をアップロード
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleImageUpload(file);
    if (url) {
      setThumbnailUrl(url);
    }
  };

  const handleSave = async (publish?: boolean) => {
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      const updateData: Record<string, unknown> = {
        id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: slug.trim() || generateSlug(title),
        content,
        tags,
        thumbnail_url: thumbnailUrl || null,
      };

      if (publish !== undefined) {
        updateData.is_published = publish;
      }

      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      const data = await res.json();
      setIsPublished(data.article.is_published);
      setSaveMessage(publish ? '公開しました！' : '保存しました');
      
      // 保存成功後、元データを更新（変更検出のため）
      setOriginalData({
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim() || generateSlug(title),
        thumbnailUrl: thumbnailUrl,
        content: content,
        tags: [...tags],
      });
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => router.push('/admin/articles')}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          記事一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* 離脱確認モーダル */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              ⚠️ 変更内容を破棄しますか？
            </h2>
            <p className="text-gray-300 mb-6">
              保存されていない変更は失われます。本当に閉じますか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => router.push('/admin/articles')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                破棄して閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕ 閉じる
            </button>
            <h1 className="text-lg font-bold text-white">
              ✏️ 記事編集
            </h1>
            {isPublished && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-300">
                公開中
              </span>
            )}
            {saveMessage && (
              <span className="text-green-400 text-sm">
                ✓ {saveMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* メタデータ展開ボタン */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                sidebarOpen 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ⚙️ 設定
            </button>
            {/* 画像挿入ボタン */}
            <label className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
              {uploadingImage ? '📤 アップロード中...' : '🖼️ 画像挿入'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={insertImageToEditor}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
            <span className="text-xs text-gray-500">
              ⌘+S で保存
            </span>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {isPublished ? (
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-4 py-2 bg-yellow-900/50 text-yellow-300 rounded-lg hover:bg-yellow-900/70 transition-colors disabled:opacity-50"
              >
                非公開にする
              </button>
            ) : (
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg disabled:opacity-50"
              >
                公開する
              </button>
            )}
            {isPublished && (
              <Link
                href={`/articles/${slug}`}
                target="_blank"
                className="px-4 py-2 bg-purple-900/50 text-purple-300 rounded-lg hover:bg-purple-900/70 transition-colors"
              >
                表示
              </Link>
            )}
          </div>
        </div>

        {/* エラー */}
        {error && (
          <div className="mt-3 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー - メタ情報（折りたたみ式） */}
        <div
          className={`shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'w-80 p-4' : 'w-0 p-0 overflow-hidden'
          }`}
        >
          <div className="space-y-4 min-w-[280px]">
            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                タイトル *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="記事のタイトル"
              />
            </div>

            {/* サブタイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                サブタイトル
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="記事の説明"
              />
            </div>

            {/* スラッグ */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                スラッグ (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder="article-slug"
              />
              <p className="mt-1 text-xs text-gray-500">
                /articles/{slug || 'article-slug'}
              </p>
            </div>

            {/* サムネイル画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                サムネイル画像
              </label>
              {thumbnailUrl ? (
                <div className="relative">
                  <img
                    src={thumbnailUrl}
                    alt="サムネイル"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setThumbnailUrl('')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-900 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-850 transition-colors">
                  <span className="text-2xl mb-1">🖼️</span>
                  <span className="text-sm text-gray-400">クリックで画像を選択</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* タグ */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                タグ <span className="text-xs text-gray-500">(記事の分類・フィルタリング用)</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="タグを追加 (例: React, TypeScript, Next.js)"
                  />
                  {/* オートコンプリート候補 */}
                  {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredTagSuggestions.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setTags([...tags, tag]);
                            setTagInput('');
                            setShowTagSuggestions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  追加
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-purple-800 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* 既存タグの表示 */}
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">既存のタグ:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!tags.includes(tag)) {
                            setTags([...tags, tag]);
                          }
                        }}
                        disabled={tags.includes(tag)}
                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                          tags.includes(tag)
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* エディタ */}
        <div className="flex-1 overflow-hidden" data-color-mode="dark">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height="100%"
            preview="live"
            visibleDragbar={false}
          />
        </div>
      </div>
    </div>
  );
}
