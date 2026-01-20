"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CheckCircle,
  Calendar,
  Clock,
  Video,
  MapPin,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "../Button";
import { Card } from "../Card";

export interface BookingCompleteData {
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingUrl?: string | null;
  meetingType: "zoom" | "google_meet" | "onsite";
  locationAddress?: string | null;
}

export interface BookingCompleteProps {
  booking: BookingCompleteData;
}

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

export function BookingComplete({ booking }: BookingCompleteProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    if (!booking.meetingUrl) return;

    try {
      await navigator.clipboard.writeText(booking.meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenMeeting = () => {
    if (booking.meetingUrl) {
      window.open(booking.meetingUrl, "_blank", "noopener,noreferrer");
    }
  };

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
              予約が完了しました
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {booking.guestName}様、ご予約ありがとうございます。
            </p>
          </div>
        </div>
      </Card>

      {/* Booking details */}
      <Card variant="default" padding="md">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          予約詳細
        </h3>

        <div className="space-y-3">
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

          {/* Location for onsite */}
          {booking.meetingType === "onsite" && booking.locationAddress && (
            <div className="ml-7 text-sm text-slate-600 dark:text-slate-400">
              {booking.locationAddress}
            </div>
          )}
        </div>
      </Card>

      {/* Meeting URL (for online meetings) */}
      {booking.meetingUrl && booking.meetingType !== "onsite" && (
        <Card variant="default" padding="md">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-3">
            会議URL
          </h3>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-3">
            <p className="text-sm text-slate-900 dark:text-slate-50 font-mono break-all">
              {booking.meetingUrl}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyUrl}
              leftIcon={
                copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
            >
              {copied ? "コピー済み" : "URLをコピー"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenMeeting}
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              ミーティングを開く
            </Button>
          </div>
        </Card>
      )}

      {/* Calendar add (placeholder) */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              カレンダーに追加
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              予定をカレンダーに追加できます
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Calendar className="w-4 h-4" />}
            disabled
          >
            追加
          </Button>
        </div>
      </Card>
    </div>
  );
}
