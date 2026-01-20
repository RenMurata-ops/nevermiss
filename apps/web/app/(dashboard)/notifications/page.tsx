"use client";

import { useEffect, useState } from "react";
import { createClient } from "@nevermiss/supabase";
import {
  NotificationList,
  Button,
  Card,
  Modal,
  type NotificationItem,
} from "@nevermiss/ui";
import { useAuth, useNotifications } from "@nevermiss/core";
import { Check, Calendar, Clock, User, Video, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface BookingDetail {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: "zoom" | "google_meet" | "onsite";
  meetingUrl: string | null;
  locationAddress: string | null;
  status: "confirmed" | "cancelled";
}

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
    unsubscribe,
  } = useNotifications();

  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const supabase = createClient();

  // Fetch and subscribe to notifications
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
      subscribeToNotifications(user.id);
      return () => unsubscribe();
    }
  }, [user?.id, fetchNotifications, subscribeToNotifications, unsubscribe]);

  // Convert notifications to NotificationItem format with booking details
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>(
    []
  );

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (notifications.length === 0) {
        setNotificationItems([]);
        return;
      }

      // Fetch booking details for all notifications
      const bookingIds = notifications.map((n) => n.bookingId);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, guest_name, start_at")
        .in("id", bookingIds);

      const bookingMap = new Map(
        (bookings || []).map((b) => [
          b.id,
          { guestName: b.guest_name, startAt: new Date(b.start_at) },
        ])
      );

      const items: NotificationItem[] = notifications.map((n) => ({
        id: n.id,
        type: n.type,
        bookingId: n.bookingId,
        isRead: n.isRead,
        createdAt: n.createdAt,
        guestName: bookingMap.get(n.bookingId)?.guestName,
        startAt: bookingMap.get(n.bookingId)?.startAt,
      }));

      setNotificationItems(items);
    };

    fetchBookingDetails();
  }, [notifications, supabase]);

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Fetch full booking details
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", notification.bookingId)
      .single();

    if (booking) {
      setSelectedBooking({
        id: booking.id,
        guestName: booking.guest_name,
        startAt: new Date(booking.start_at),
        endAt: new Date(booking.end_at),
        meetingType: booking.meeting_type as BookingDetail["meetingType"],
        meetingUrl: booking.meeting_url,
        locationAddress: booking.location_address,
        status: booking.status as BookingDetail["status"],
      });
      setIsModalOpen(true);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    setIsMarkingAll(true);
    await markAllAsRead(user.id);
    setIsMarkingAll(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const durationMinutes = selectedBooking
    ? Math.round(
        (selectedBooking.endAt.getTime() - selectedBooking.startAt.getTime()) /
          60000
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          通知
        </h1>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            isLoading={isMarkingAll}
            leftIcon={<Check className="w-4 h-4" />}
          >
            すべて既読にする
          </Button>
        )}
      </div>

      {/* Notification list */}
      <NotificationList
        notifications={notificationItems}
        onNotificationClick={handleNotificationClick}
        isLoading={loading}
      />

      {/* Booking detail modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="予約詳細"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span
                className={`
                  px-2 py-0.5 text-xs font-medium rounded-full
                  ${
                    selectedBooking.status === "confirmed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }
                `}
              >
                {selectedBooking.status === "confirmed"
                  ? "確定"
                  : "キャンセル済み"}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              {/* Guest name */}
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900 dark:text-slate-50">
                  {selectedBooking.guestName}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900 dark:text-slate-50">
                  {format(selectedBooking.startAt, "yyyy年M月d日（E）", {
                    locale: ja,
                  })}
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900 dark:text-slate-50">
                  {format(selectedBooking.startAt, "HH:mm")} -{" "}
                  {format(selectedBooking.endAt, "HH:mm")}（{durationMinutes}分）
                </span>
              </div>

              {/* Meeting type */}
              <div className="flex items-center gap-3 text-sm">
                {selectedBooking.meetingType === "onsite" ? (
                  <MapPin className="w-4 h-4 text-slate-400" />
                ) : (
                  <Video className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-slate-900 dark:text-slate-50">
                  {meetingTypeLabels[selectedBooking.meetingType]}
                </span>
              </div>

              {/* Location for onsite */}
              {selectedBooking.meetingType === "onsite" &&
                selectedBooking.locationAddress && (
                  <div className="ml-7 text-sm text-slate-600 dark:text-slate-400">
                    {selectedBooking.locationAddress}
                  </div>
                )}
            </div>

            {/* Meeting URL */}
            {selectedBooking.meetingUrl &&
              selectedBooking.status === "confirmed" && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    会議URL
                  </p>
                  <a
                    href={selectedBooking.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {selectedBooking.meetingUrl}
                  </a>
                </div>
              )}

            {/* Close button */}
            <div className="pt-2">
              <Button variant="secondary" fullWidth onClick={handleCloseModal}>
                閉じる
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
