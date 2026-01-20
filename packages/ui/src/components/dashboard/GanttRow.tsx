"use client";

import React, { useState, useEffect } from "react";
import { GanttBlock, GanttBlockBooking } from "./GanttBlock";

export interface GanttRowProps {
  date: Date;
  bookings: GanttBlockBooking[];
  isToday: boolean;
  onBookingClick?: (booking: GanttBlockBooking) => void;
}

const HOUR_WIDTH = 60; // 1時間 = 60px
const TOTAL_HOURS = 24;
const TOTAL_WIDTH = HOUR_WIDTH * TOTAL_HOURS; // 1440px

export function GanttRow({
  date,
  bookings,
  isToday,
  onBookingClick,
}: GanttRowProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(
    null
  );

  // 現在時刻の位置を更新（1分ごと）
  useEffect(() => {
    if (!isToday) {
      setCurrentTimePosition(null);
      return;
    }

    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const position = (hours + minutes / 60) * HOUR_WIDTH;
      setCurrentTimePosition(position);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [isToday]);

  // 日付フォーマット
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

  return (
    <div className="flex">
      {/* 日付ラベル（固定幅） */}
      <div
        className={`
          flex-shrink-0 w-20 px-2 py-3
          border-r border-slate-200 dark:border-slate-700
          flex flex-col items-center justify-center
          ${isToday ? "bg-blue-50 dark:bg-blue-950" : "bg-white dark:bg-slate-950"}
        `}
      >
        <span
          className={`
            text-sm font-medium
            ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-slate-50"}
          `}
        >
          {dateLabel}
        </span>
        <span
          className={`
            text-xs
            ${isToday ? "text-blue-500 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}
          `}
        >
          ({dayOfWeek})
        </span>
      </div>

      {/* タイムライン */}
      <div
        className={`
          relative h-12
          border-b border-slate-200 dark:border-slate-700
          ${isToday ? "bg-blue-50 dark:bg-blue-950" : "bg-white dark:bg-slate-950"}
        `}
        style={{ width: `${TOTAL_WIDTH}px` }}
      >
        {/* 時間グリッド線 */}
        {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800"
            style={{ left: `${hour * HOUR_WIDTH}px` }}
          />
        ))}

        {/* 予約ブロック */}
        {bookings.map((booking) => {
          const startHour =
            booking.startAt.getHours() + booking.startAt.getMinutes() / 60;
          const endHour =
            booking.endAt.getHours() + booking.endAt.getMinutes() / 60;
          const durationHours = endHour - startHour;

          return (
            <GanttBlock
              key={booking.id}
              booking={booking}
              startHour={startHour}
              durationHours={durationHours > 0 ? durationHours : 24 - startHour}
              onClick={() => onBookingClick?.(booking)}
            />
          );
        })}

        {/* 現在時刻の赤い縦線 */}
        {isToday && currentTimePosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${currentTimePosition}px` }}
          />
        )}
      </div>
    </div>
  );
}
