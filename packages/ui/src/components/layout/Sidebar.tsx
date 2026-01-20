"use client";

import React from "react";
import { Home, Link, Settings, LogOut } from "lucide-react";

export interface SidebarProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "ダッシュボード",
    href: "/dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: "予約URL",
    href: "/booking-urls",
    icon: <Link className="w-5 h-5" />,
  },
  {
    label: "設定",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function Sidebar({ currentPath, onNavigate, onLogout }: SidebarProps) {
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Nevermiss
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => onNavigate?.(item.href)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                transition-colors duration-200 text-left
                ${
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
                }
              `}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onLogout}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-2xl
            text-slate-600 dark:text-slate-400
            hover:bg-slate-100 dark:hover:bg-slate-800
            hover:text-slate-900 dark:hover:text-slate-50
            transition-colors duration-200
          "
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
