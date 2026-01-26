/**
 * 時系列統計データAPI
 * 
 * グラフ表示用のデータを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type MetricType = 'visitors' | 'conversations' | 'inquiries' | 'sites';
type TimeRange = '7d' | '30d' | '90d' | '1y';

interface TimeSeriesData {
  date: string;
  value: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') as MetricType;
    const range = (searchParams.get('range') || '30d') as TimeRange;

    if (!metric || !['visitors', 'conversations', 'inquiries', 'sites'].includes(metric)) {
      return NextResponse.json(
        { error: '有効なmetricパラメータが必要です' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    
    // 期間の計算
    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // テーブルと日付カラムの設定
    const tableConfig: Record<MetricType, { table: string; dateColumn: string }> = {
      visitors: { table: 'visitors', dateColumn: 'created_at' },
      conversations: { table: 'conversations', dateColumn: 'started_at' },
      inquiries: { table: 'inquiries', dateColumn: 'created_at' },
      sites: { table: 'generated_sites', dateColumn: 'created_at' },
    };

    const config = tableConfig[metric];
    
    // データ取得
    const { data, error } = await (supabase as any)
      .from(config.table)
      .select(config.dateColumn)
      .gte(config.dateColumn, startDate.toISOString())
      .order(config.dateColumn, { ascending: true });

    if (error) {
      throw error;
    }

    // 日付ごとに集計
    const dateMap = new Map<string, number>();
    
    // 全ての日付を初期化
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // データをカウント
    if (data) {
      for (const item of data) {
        const dateStr = new Date(item[config.dateColumn]).toISOString().split('T')[0];
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    }

    // 配列に変換
    const timeSeries: TimeSeriesData[] = Array.from(dateMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 合計値も計算
    const total = timeSeries.reduce((sum, item) => sum + item.value, 0);

    return NextResponse.json({
      metric,
      range,
      total,
      data: timeSeries,
    });
  } catch (error) {
    console.error('時系列データ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
