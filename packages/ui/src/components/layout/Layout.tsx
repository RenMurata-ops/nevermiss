"use client";

import React from "react";
import { Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  userName?: string;
}

export function Layout({
  children,
  currentPath,
  onNavigate,
  onLogout,
  notificationCount = 0,
  onNotificationClick,
  userName,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar (desktop only) */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {/* Mobile logo */}
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 md:hidden">
              Nevermiss
            </h1>

            {/* Desktop: Page title placeholder */}
            <div className="hidden md:block" />

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* User name (desktop) */}
              {userName && (
                <span className="hidden md:block text-sm text-slate-600 dark:text-slate-400">
                  {userName}
                </span>
              )}

              {/* Notification bell */}
              <button
                onClick={onNotificationClick}
                className="
                  relative p-2 rounded-full
                  text-slate-500 hover:text-slate-900
                  dark:text-slate-400 dark:hover:text-slate-50
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-colors duration-200
                "
                aria-label="通知"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Bottom navigation (mobile only) */}
      <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
}
