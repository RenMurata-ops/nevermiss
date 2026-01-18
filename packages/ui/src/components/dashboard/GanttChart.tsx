"use client";

import React, { useMemo } from "react";
import { GanttRow } from "./GanttRow";
import { GanttBlockBooking } from "./GanttBlock";

export type ViewMode = "week" | "month";

export interface GanttBooking {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: string;
}

export interface GanttChartProps {
  viewMode: ViewMode;
  bookings: GanttBooking[];
  onBookingClick?: (booking: GanttBooking) => void;
  /** Optional: Override the reference date (defaults to today) */
  referenceDate?: Date;
}

const HOUR_WIDTH = 60; // 1時間 = 60px
const DATE_COLUMN_WIDTH = 80; // 日付列の幅
const TOTAL_HOURS = 24;
const TOTAL_WIDTH = HOUR_WIDTH * TOTAL_HOURS;

export function GanttChart({
  viewMode,
  bookings,
  onBookingClick,
  referenceDate,
}: GanttChartProps) {
  const today = useMemo(() => {
    const d = referenceDate || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, [referenceDate]);

  // 表示する日付の配列を生成
  const dates = useMemo(() => {
    const result: Date[] = [];

    if (viewMode === "week") {
      // 今日を含む7日間
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        result.push(date);
      }
    } else {
      // 当月全日
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        result.push(new Date(year, month, day));
      }
    }

    return result;
  }, [viewMode, today]);

  // 日跨ぎ予約を分割して日ごとにグループ化
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, GanttBlockBooking[]>();

    // 日付をキーにするためのヘルパー
    const dateKey = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    // 各日付を初期化
    dates.forEach((date) => {
      map.set(dateKey(date), []);
    });

    // 予約を処理
    bookings.forEach((booking) => {
      const startDate = new Date(booking.startAt);
      const endDate = new Date(booking.endAt);

      // 開始日と終了日が同じ場合
      if (dateKey(startDate) === dateKey(endDate)) {
        const key = dateKey(startDate);
        const existing = map.get(key);
        if (existing) {
          existing.push({
            id: booking.id,
            guestName: booking.guestName,
            startAt: startDate,
            endAt: endDate,
            meetingType: booking.meetingType,
          });
        }
      } else {
        // 日跨ぎ予約の場合、分割する
        // 開始日の部分（開始時刻 〜 24:00）
        const startDayKey = dateKey(startDate);
        const startDayEnd = new Date(startDate);
        startDayEnd.setHours(23, 59, 59, 999);

        const existingStart = map.get(startDayKey);
        if (existingStart) {
          existingStart.push({
            id: `${booking.id}-start`,
            guestName: booking.guestName,
            startAt: startDate,
            endAt: startDayEnd,
            meetingType: booking.meetingType,
          });
        }

        // 終了日の部分（00:00 〜 終了時刻）
        const endDayKey = dateKey(endDate);
        const endDayStart = new Date(endDate);
        endDayStart.setHours(0, 0, 0, 0);

        const existingEnd = map.get(endDayKey);
        if (existingEnd) {
          existingEnd.push({
            id: `${booking.id}-end`,
            guestName: booking.guestName,
            startAt: endDayStart,
            endAt: endDate,
            meetingType: booking.meetingType,
          });
        }
      }
    });

    return map;
  }, [bookings, dates]);

  // 今日かどうかを判定
  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
      {/* 時間軸ヘッダー */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        {/* 日付列のスペース */}
        <div
          className="flex-shrink-0 border-r border-slate-200 dark:border-slate-700"
          style={{ width: `${DATE_COLUMN_WIDTH}px` }}
        />

        {/* 時間ラベル */}
        <div
          className="relative h-8"
          style={{ width: `${TOTAL_WIDTH}px` }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const hour = i * 2;
            return (
              <div
                key={hour}
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${hour * HOUR_WIDTH}px` }}
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* スクロール可能なコンテンツ */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${DATE_COLUMN_WIDTH + TOTAL_WIDTH}px` }}>
          {dates.map((date) => (
            <GanttRow
              key={dateKey(date)}
              date={date}
              bookings={bookingsByDate.get(dateKey(date)) || []}
              isToday={isToday(date)}
              onBookingClick={(booking) => {
                // 元のbookingを見つけてコールバック
                const originalId = booking.id.replace(/-start$|-end$/, "");
                const original = bookings.find((b) => b.id === originalId);
                if (original && onBookingClick) {
                  onBookingClick(original);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
