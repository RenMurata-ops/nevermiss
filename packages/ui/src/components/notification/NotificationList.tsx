"use client";

import React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Bell, X } from "lucide-react";
import { Card } from "../Card";

export interface NotificationItem {
  id: string;
  type: "new_booking" | "booking_cancelled";
  bookingId: string;
  isRead: boolean;
  createdAt: Date;
  // Optional booking details (if joined)
  guestName?: string;
  startAt?: Date;
}

export interface NotificationListProps {
  notifications: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
  isLoading?: boolean;
}

const notificationLabels: Record<string, string> = {
  new_booking: "新しい予約",
  booking_cancelled: "予約キャンセル",
};

const notificationIcons: Record<string, React.ReactNode> = {
  new_booking: <Calendar className="w-5 h-5 text-green-500" />,
  booking_cancelled: <X className="w-5 h-5 text-red-500" />,
};

export function NotificationList({
  notifications,
  onNotificationClick,
  isLoading = false,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="default" padding="md">
            <div className="animate-pulse flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            通知はありません
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            新しい通知があるとここに表示されます
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          onClick={() => onNotificationClick?.(notification)}
          className={`
            w-full text-left p-4 rounded-2xl border transition-colors
            ${
              notification.isRead
                ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            }
            hover:bg-slate-50 dark:hover:bg-slate-900
          `}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${
                  notification.type === "new_booking"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }
              `}
            >
              {notificationIcons[notification.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`
                    text-sm font-medium
                    ${
                      notification.isRead
                        ? "text-slate-600 dark:text-slate-400"
                        : "text-slate-900 dark:text-slate-50"
                    }
                  `}
                >
                  {notificationLabels[notification.type]}
                </span>
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>

              {/* Guest name and time if available */}
              {notification.guestName && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {notification.guestName}様
                  {notification.startAt && (
                    <span>
                      {" "}
                      -{" "}
                      {format(notification.startAt, "M月d日 HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  )}
                </p>
              )}

              {/* Created at */}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {format(notification.createdAt, "M月d日 HH:mm", { locale: ja })}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
