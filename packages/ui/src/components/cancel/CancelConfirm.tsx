"use client";

import React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Video,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../Button";
import { Card } from "../Card";

export interface CancelConfirmBooking {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: "zoom" | "google_meet" | "onsite";
  cancelDeadline: Date;
}

export interface CancelConfirmProps {
  booking: CancelConfirmBooking;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
}

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

export function CancelConfirm({
  booking,
  onConfirm,
  onBack,
  loading = false,
}: CancelConfirmProps) {
  const now = new Date();
  const isPastDeadline = booking.cancelDeadline < now;

  const durationMinutes = Math.round(
    (booking.endAt.getTime() - booking.startAt.getTime()) / 60000
  );

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        戻る
      </button>

      {/* Warning card */}
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
              予約をキャンセルしますか？
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              この操作は取り消すことができません
            </p>
          </div>
        </div>

        {/* Booking details */}
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          {/* Guest name */}
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-50">
              {booking.guestName}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-50">
              {format(booking.startAt, "yyyy年M月d日（E）", { locale: ja })}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-50">
              {format(booking.startAt, "HH:mm")} -{" "}
              {format(booking.endAt, "HH:mm")}（{durationMinutes}分）
            </span>
          </div>

          {/* Meeting type */}
          <div className="flex items-center gap-3 text-sm">
            {booking.meetingType === "onsite" ? (
              <MapPin className="w-4 h-4 text-slate-400" />
            ) : (
              <Video className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-slate-900 dark:text-slate-50">
              {meetingTypeLabels[booking.meetingType]}
            </span>
          </div>
        </div>
      </Card>

      {/* Deadline notice */}
      <Card
        variant="default"
        padding="md"
        className={isPastDeadline ? "border-red-300 dark:border-red-700" : ""}
      >
        {isPastDeadline ? (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                キャンセル期限を過ぎています
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                キャンセル期限:{" "}
                {format(booking.cancelDeadline, "yyyy年M月d日 HH:mm", {
                  locale: ja,
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                キャンセル期限
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {format(booking.cancelDeadline, "yyyy年M月d日 HH:mm", {
                  locale: ja,
                })}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={onBack}
          disabled={loading}
        >
          戻る
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={onConfirm}
          disabled={isPastDeadline || loading}
          isLoading={loading}
        >
          キャンセルを確定する
        </Button>
      </div>
    </div>
  );
}
