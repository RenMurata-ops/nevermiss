"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Clock, Video, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "../Button";
import { Input } from "../Input";
import { Card } from "../Card";

export interface BookingConfirmBookingURL {
  title: string;
  durationMinutes: number;
  meetingType: "zoom" | "google_meet" | "onsite";
  locationAddress?: string | null;
}

export interface BookingConfirmFormProps {
  selectedTime: { start: Date; end: Date };
  bookingURL: BookingConfirmBookingURL;
  onConfirm: (guestName: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

export function BookingConfirmForm({
  selectedTime,
  bookingURL,
  onConfirm,
  onBack,
  isLoading = false,
}: BookingConfirmFormProps) {
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      setError("お名前を入力してください");
      return;
    }

    setError(null);
    onConfirm(guestName.trim());
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isLoading}
        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        日時を選び直す
      </button>

      {/* Booking summary */}
      <Card variant="default" padding="md">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          予約内容の確認
        </h3>

        <div className="space-y-3">
          {/* Title */}
          <div className="text-base font-medium text-slate-900 dark:text-slate-50">
            {bookingURL.title}
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>
              {format(selectedTime.start, "yyyy年M月d日（E）", { locale: ja })}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span>
              {format(selectedTime.start, "HH:mm")} -{" "}
              {format(selectedTime.end, "HH:mm")}（{bookingURL.durationMinutes}
              分）
            </span>
          </div>

          {/* Meeting type */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {bookingURL.meetingType === "onsite" ? (
              <MapPin className="w-4 h-4" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            <span>{meetingTypeLabels[bookingURL.meetingType]}</span>
            {bookingURL.meetingType === "onsite" &&
              bookingURL.locationAddress && (
                <span className="text-slate-500">
                  （{bookingURL.locationAddress}）
                </span>
              )}
          </div>
        </div>
      </Card>

      {/* Name form */}
      <Card variant="default" padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="お名前"
            placeholder="山田 太郎"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            error={error || undefined}
            fullWidth
            disabled={isLoading}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            予約を確定する
          </Button>
        </form>
      </Card>
    </div>
  );
}
