"use client";

import React from "react";
import { Monitor, Sun, Moon } from "lucide-react";

export type Theme = "system" | "light" | "dark";

export interface ThemeToggleProps {
  currentTheme: Theme;
  onChange: (theme: Theme) => void;
}

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "システム",
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    value: "light",
    label: "ライト",
    icon: <Sun className="w-4 h-4" />,
  },
  {
    value: "dark",
    label: "ダーク",
    icon: <Moon className="w-4 h-4" />,
  },
];

export function ThemeToggle({ currentTheme, onChange }: ThemeToggleProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
        テーマ
      </label>
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              text-sm font-medium rounded-xl transition-colors
              ${
                currentTheme === option.value
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
              }
            `}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
