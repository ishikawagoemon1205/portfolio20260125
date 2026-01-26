/**
 * キャラクター設定ページ
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin';

interface CharacterSettings {
  persona: string;
  tone: string;
  greeting: string;
  patterns: ResponsePattern[];
}

interface ResponsePattern {
  id: string;
  trigger: string;
  response: string;
  priority: number;
}

const defaultSettings: CharacterSettings = {
  persona: 'フレンドリーで親しみやすいエンジニア',
  tone: 'casual',
  greeting: 'こんにちは！石川敦大のポートフォリオへようこそ。何かお手伝いできることはありますか？',
  patterns: [],
};

const toneOptions = [
  { value: 'formal', label: '丁寧語（です・ます調）' },
  { value: 'casual', label: 'カジュアル（親しみやすい）' },
  { value: 'professional', label: 'プロフェッショナル（ビジネス調）' },
  { value: 'friendly', label: 'フレンドリー（絵文字あり）' },
];

export default function CharacterSettingsPage() {
  const [settings, setSettings] = useState<CharacterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/character');
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
      const res = await fetch('/api/admin/settings/character', {
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

  const addPattern = () => {
    const newPattern: ResponsePattern = {
      id: Date.now().toString(),
      trigger: '',
      response: '',
      priority: 0,
    };
    setSettings({ ...settings, patterns: [...settings.patterns, newPattern] });
  };

  const updatePattern = (id: string, field: keyof ResponsePattern, value: string | number) => {
    setSettings({
      ...settings,
      patterns: settings.patterns.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const removePattern = (id: string) => {
    setSettings({
      ...settings,
      patterns: settings.patterns.filter(p => p.id !== id),
    });
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
        title="キャラクター設定"
        description="AIの口調や応答パターンを設定できます"
      />

      <div className="space-y-8">
        {/* 基本設定 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            基本設定
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ペルソナ
              </label>
              <input
                type="text"
                value={settings.persona}
                onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                placeholder="例: フレンドリーで親しみやすいエンジニア"
              />
              <p className="text-xs text-gray-500 mt-1">
                AIがどのような人物として振る舞うかを指定します
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                口調
              </label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {toneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                挨拶メッセージ
              </label>
              <textarea
                value={settings.greeting}
                onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                placeholder="最初に表示するメッセージを入力..."
              />
            </div>
          </div>
        </section>

        {/* 応答パターン */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                応答パターン
              </h2>
              <p className="text-sm text-gray-500">
                特定のキーワードに対するカスタム応答を設定できます
              </p>
            </div>
            <button
              onClick={addPattern}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              + 追加
            </button>
          </div>

          {settings.patterns.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              応答パターンが登録されていません
            </p>
          ) : (
            <div className="space-y-4">
              {settings.patterns.map((pattern, index) => (
                <div
                  key={pattern.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      パターン {index + 1}
                    </span>
                    <div className="flex-1" />
                    <label className="text-xs text-gray-500">
                      優先度:
                      <input
                        type="number"
                        value={pattern.priority}
                        onChange={(e) => updatePattern(pattern.id, 'priority', parseInt(e.target.value))}
                        className="w-16 ml-2 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        トリガー（キーワード）
                      </label>
                      <input
                        type="text"
                        value={pattern.trigger}
                        onChange={(e) => updatePattern(pattern.id, 'trigger', e.target.value)}
                        placeholder="例: 趣味, hobby"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        応答
                      </label>
                      <textarea
                        value={pattern.response}
                        onChange={(e) => updatePattern(pattern.id, 'response', e.target.value)}
                        placeholder="このキーワードが含まれる場合の応答..."
                        rows={2}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removePattern(pattern.id)}
                    className="mt-2 text-sm text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
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
