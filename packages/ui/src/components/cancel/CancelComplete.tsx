"use client";

import React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, User } from "lucide-react";
import { Card } from "../Card";

export interface CancelCompleteBooking {
  guestName: string;
  startAt: Date;
  endAt: Date;
}

export interface CancelCompleteProps {
  booking: CancelCompleteBooking;
}

export function CancelComplete({ booking }: CancelCompleteProps) {
  const durationMinutes = Math.round(
    (booking.endAt.getTime() - booking.startAt.getTime()) / 60000
  );

  return (
    <div className="space-y-6">
      {/* Success header */}
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
              キャンセルが完了しました
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              予約は正常にキャンセルされました
            </p>
          </div>
        </div>
      </Card>

      {/* Cancelled booking details */}
      <Card variant="default" padding="md">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          キャンセルした予約
        </h3>

        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          {/* Guest name */}
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {booking.guestName}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400 line-through">
              {format(booking.startAt, "yyyy年M月d日（E）", { locale: ja })}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400 line-through">
              {format(booking.startAt, "HH:mm")} -{" "}
              {format(booking.endAt, "HH:mm")}（{durationMinutes}分）
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
