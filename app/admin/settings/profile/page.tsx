/**
 * プロフィール編集ページ（AIの教師データ）
 * 
 * AIが会話で使用する基本情報を管理
 * システムプロンプトに組み込まれる内容を編集する
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin';

interface ProfileData {
  name: string;
  name_en: string;
  title: string;
  bio: string; // システムプロンプトに組み込まれる自己紹介
  skills: string[];
  experiences: Experience[];
  education: Education[];
  social_links: SocialLink[];
}

interface Experience {
  id: string;
  company: string;
  position: string;
  period: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  period: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

const defaultProfile: ProfileData = {
  name: '石川 敦大',
  name_en: 'Atsuhiro Ishikawa',
  title: 'フルスタックエンジニア',
  bio: '',
  skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL'],
  experiences: [],
  education: [],
  social_links: [],
};

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/admin/settings/profile');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setProfile({ ...defaultProfile, ...data });
        }
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'プロフィールを保存しました' });
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'プロフィールの保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      period: '',
      description: '',
    };
    setProfile({ ...profile, experiences: [...profile.experiences, newExp] });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setProfile({
      ...profile,
      experiences: profile.experiences.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    setProfile({
      ...profile,
      experiences: profile.experiences.filter(exp => exp.id !== id),
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
        title="プロフィール編集"
        description="AIが会話で使用する基本情報を編集します（システムプロンプトに組み込まれる教師データ）"
      />

      <div className="space-y-8">
        {/* 基本情報 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            基本情報
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                名前（日本語）
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                名前（英語）
              </label>
              <input
                type="text"
                value={profile.name_en}
                onChange={(e) => setProfile({ ...profile, name_en: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                肩書き
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                自己紹介（システムプロンプト用）
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                placeholder="AIがあなたについて話す内容を記載してください。例: 「〇〇大学卒業後、△△社でバックエンドエンジニアとして5年間勤務。現在はフリーランスとして活動しています。」"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                💡 この内容がシステムプロンプトに組み込まれ、AIの回答の基礎になります
              </p>
            </div>
          </div>
        </section>

        {/* スキル */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            スキル
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-purple-500 hover:text-purple-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              placeholder="新しいスキルを追加..."
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              追加
            </button>
          </div>
        </section>

        {/* 職歴 */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              職歴
            </h2>
            <button
              onClick={addExperience}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              + 追加
            </button>
          </div>

          {profile.experiences.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              職歴が登録されていません
            </p>
          ) : (
            <div className="space-y-4">
              {profile.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder="会社名"
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    />
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      placeholder="役職"
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => updateExperience(exp.id, 'period', e.target.value)}
                      placeholder="期間（例: 2020年4月 - 現在）"
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder="業務内容"
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  />
                  <button
                    onClick={() => removeExperience(exp.id)}
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
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            {saving ? '保存中...' : 'プロフィールを保存'}
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
