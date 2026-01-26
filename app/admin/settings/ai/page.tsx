/**
 * AI設定ページ（技術的な設定）
 * 
 * 使用するAIモデル、パラメータ、コスト管理に関する設定
 * プロフィール情報（教師データ）は別ページで編集
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin';

interface AISettings {
  chat_model: string;
  chat_temperature: number;
  chat_max_tokens: number;
  site_generation_model: string;
  site_generation_temperature: number;
}

const defaultSettings: AISettings = {
  chat_model: 'gpt-4o-mini',
  chat_temperature: 0.7,
  chat_max_tokens: 1000,
  site_generation_model: 'gpt-4o',
  site_generation_temperature: 0.8,
};

const modelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o (高品質)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini (コスト効率)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (低コスト)' },
];

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/ai');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSettings({ ...defaultSettings, ...data });
        }
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '設定を保存しました' });
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

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
        title="AI設定"
        description="使用するAIモデルとパラメータを設定します（技術的な設定のみ）"
      />

      <div className="space-y-8">
        {/* チャット設定 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            チャット設定
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                モデル
              </label>
              <select
                value={settings.chat_model}
                onChange={(e) => setSettings({ ...settings, chat_model: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {modelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature: {settings.chat_temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.chat_temperature}
                onChange={(e) => setSettings({ ...settings, chat_temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                低い値ほど一貫性のある応答、高い値ほど創造的な応答になります
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最大トークン数
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                value={settings.chat_max_tokens}
                onChange={(e) => setSettings({ ...settings, chat_max_tokens: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* サイト生成設定 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            サイト生成設定
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                モデル
              </label>
              <select
                value={settings.site_generation_model}
                onChange={(e) => setSettings({ ...settings, site_generation_model: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {modelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                サイト生成には高品質なモデルを推奨します
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature: {settings.site_generation_temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.site_generation_temperature}
                onChange={(e) => setSettings({ ...settings, site_generation_temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* 補足説明 */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 プロフィール情報の編集について
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            AIの性格や自己紹介などの教師データは「プロフィール」ページで編集できます。<br />
            ここではAIモデルの技術的なパラメータのみを設定してください。
          </p>
        </section>

        {/* 保存ボタン */}
        <div className="flex items-center gap-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>

          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
