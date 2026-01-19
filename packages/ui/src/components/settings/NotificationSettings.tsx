"use client";

import React from "react";
import { Bell } from "lucide-react";

export interface NotificationSettingsProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function NotificationSettings({
  enabled,
  onChange,
}: NotificationSettingsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
            プッシュ通知を受け取る
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            新しい予約やキャンセルを通知で受け取ります
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative w-12 h-7 rounded-full transition-colors
          ${enabled ? "bg-slate-900 dark:bg-slate-50" : "bg-slate-200 dark:bg-slate-700"}
        `}
      >
        <span
          className={`
            absolute top-1 left-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-sm
            transition-transform duration-200
            ${enabled ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}
