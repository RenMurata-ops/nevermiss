"use client";

import React from "react";
import { User, Mail, Link2, Unlink } from "lucide-react";
import { Card } from "../Card";
import { Button } from "../Button";
import { ThemeToggle, type Theme } from "./ThemeToggle";
import { NotificationSettings } from "./NotificationSettings";

export interface SettingsUser {
  id: string;
  email: string;
  name: string | null;
  googleRefreshToken: string | null;
}

export interface SettingsPageProps {
  user: SettingsUser;
  currentTheme: Theme;
  notificationsEnabled: boolean;
  onThemeChange: (theme: Theme) => void;
  onNotificationChange: (enabled: boolean) => void;
  onGoogleConnect: () => void;
  onGoogleDisconnect: () => void;
  isConnectingGoogle?: boolean;
}

export function SettingsPage({
  user,
  currentTheme,
  notificationsEnabled,
  onThemeChange,
  onNotificationChange,
  onGoogleConnect,
  onGoogleDisconnect,
  isConnectingGoogle = false,
}: SettingsPageProps) {
  const isGoogleConnected = !!user.googleRefreshToken;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        設定
      </h1>

      {/* Account section */}
      <Card variant="default" padding="md">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          アカウント情報
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                メールアドレス
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {user.email}
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">名前</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {user.name || "未設定"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Theme section */}
      <Card variant="default" padding="md">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          外観
        </h2>
        <ThemeToggle currentTheme={currentTheme} onChange={onThemeChange} />
      </Card>

      {/* Notification section */}
      <Card variant="default" padding="md">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          通知
        </h2>
        <NotificationSettings
          enabled={notificationsEnabled}
          onChange={onNotificationChange}
        />
      </Card>

      {/* Google integration section */}
      <Card variant="default" padding="md">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Google連携
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isGoogleConnected ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-100 dark:bg-slate-800"}
              `}
            >
              {isGoogleConnected ? (
                <Link2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Unlink className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {isGoogleConnected ? "連携済み" : "未連携"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isGoogleConnected
                  ? "Google Meetの自動作成が利用可能です"
                  : "Google Meetを利用するには連携が必要です"}
              </p>
            </div>
          </div>

          {isGoogleConnected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGoogleDisconnect}
              disabled={isConnectingGoogle}
            >
              連携解除
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onGoogleConnect}
              isLoading={isConnectingGoogle}
            >
              連携する
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
