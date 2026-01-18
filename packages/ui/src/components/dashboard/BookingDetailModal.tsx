"use client";

import React, { useState } from "react";
import { format, isBefore, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Clock, MapPin, Video, X, AlertTriangle } from "lucide-react";
import { Modal } from "../Modal";
import { Button } from "../Button";

export interface BookingDetail {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: "zoom" | "google_meet" | "onsite";
  meetingUrl?: string | null;
  locationAddress?: string | null;
  status: "confirmed" | "cancelled";
  cancelDeadline: Date;
}

export interface BookingDetailModalProps {
  booking: BookingDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: (bookingId: string) => Promise<void>;
  isCancelling?: boolean;
}

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

const meetingTypeIcons: Record<string, React.ReactNode> = {
  zoom: <Video className="w-4 h-4" />,
  google_meet: <Video className="w-4 h-4" />,
  onsite: <MapPin className="w-4 h-4" />,
};

export function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  onCancel,
  isCancelling = false,
}: BookingDetailModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!booking) return null;

  const now = new Date();
  const canCancel =
    booking.status === "confirmed" &&
    isBefore(now, booking.cancelDeadline);

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (onCancel) {
      await onCancel(booking.id);
    }
    setShowCancelConfirm(false);
    onClose();
  };

  const handleCancelDismiss = () => {
    setShowCancelConfirm(false);
  };

  const formatDate = (date: Date) => {
    return format(date, "yyyy年M月d日(E)", { locale: ja });
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const formatDeadline = (date: Date) => {
    return format(date, "M月d日 HH:mm", { locale: ja });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="予約詳細"
      size="md"
    >
      {showCancelConfirm ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                予約をキャンセルしますか？
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                この操作は取り消せません。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleCancelDismiss}
              disabled={isCancelling}
            >
              戻る
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleCancelConfirm}
              isLoading={isCancelling}
            >
              キャンセルする
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Guest name */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {booking.guestName}
            </h3>
            {booking.status === "cancelled" && (
              <span className="inline-block mt-2 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-full">
                キャンセル済み
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span>{formatDate(booking.startAt)}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span>
                {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
              </span>
            </div>

            {/* Meeting type */}
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              {meetingTypeIcons[booking.meetingType]}
              <span>{meetingTypeLabels[booking.meetingType]}</span>
            </div>

            {/* Meeting URL or Address */}
            {booking.meetingType !== "onsite" && booking.meetingUrl && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  ミーティングURL
                </p>
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {booking.meetingUrl}
                </a>
              </div>
            )}

            {booking.meetingType === "onsite" && booking.locationAddress && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  場所
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-50">
                  {booking.locationAddress}
                </p>
              </div>
            )}
          </div>

          {/* Cancel section */}
          {booking.status === "confirmed" && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              {canCancel ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    キャンセル期限: {formatDeadline(booking.cancelDeadline)}
                  </p>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleCancelClick}
                  >
                    予約をキャンセル
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  キャンセル期限を過ぎているため、キャンセルできません
                </p>
              )}
            </div>
          )}

          {/* Close button */}
          <Button variant="secondary" fullWidth onClick={onClose}>
            閉じる
          </Button>
        </div>
      )}
    </Modal>
  );
}
