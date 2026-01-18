"use client";

import React from "react";

export interface GanttBlockBooking {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: string;
}

export interface GanttBlockProps {
  booking: GanttBlockBooking;
  onClick?: () => void;
  /** Start hour for this block (0-24, can be decimal) */
  startHour: number;
  /** Duration in hours */
  durationHours: number;
}

const HOUR_WIDTH = 60; // 1時間 = 60px

export function GanttBlock({
  booking,
  onClick,
  startHour,
  durationHours,
}: GanttBlockProps) {
  const left = startHour * HOUR_WIDTH;
  const width = Math.max(durationHours * HOUR_WIDTH, 30); // 最小幅30px

  return (
    <button
      onClick={onClick}
      className="
        absolute top-1 bottom-1
        bg-slate-900 dark:bg-slate-100
        text-white dark:text-slate-900
        rounded-lg px-2 py-1
        text-xs font-medium
        truncate
        hover:opacity-90
        transition-opacity duration-200
        cursor-pointer
        shadow-sm
      "
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      title={`${booking.guestName} (${formatTime(booking.startAt)} - ${formatTime(booking.endAt)})`}
    >
      {booking.guestName}
    </button>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
