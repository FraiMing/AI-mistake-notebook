"use client";

import type { ReactNode } from "react";

interface Props<T> {
  items: T[];
  getDate: (item: T) => Date;
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
}

/** 按日期分组 items，返回 Map<dateKey, T[]> */
function groupByDate<T>(items: T[], getDate: (item: T) => Date): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = getDate(item);
    const key = formatDateKey(date);
    const arr = groups.get(key);
    if (arr) {
      arr.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

/** 生成 YYYY-MM-DD 格式的日期 key */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 生成中文日期显示 */
function formatDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

/** 通用时间轴分组组件 */
export function TimelineGroup<T>({ items, getDate, renderItem, emptyMessage = "暂无数据" }: Props<T>) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const groups = groupByDate(items, getDate);

  // 按日期降序排列（最新在上）
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {sortedKeys.map((key) => {
        const groupItems = groups.get(key)!;
        const date = new Date(key + "T00:00:00");
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {formatDateLabel(date)}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {groupItems.length} 题
              </span>
            </div>
            <div className="space-y-3">
              {groupItems.map((item, idx) => (
                <div key={idx}>{renderItem(item)}</div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
