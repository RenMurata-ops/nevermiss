"use client";

import { useState, useEffect, useMemo } from "react";
import { startOfMonth, endOfMonth, addDays } from "date-fns";
import {
  GanttChart,
  BookingDetailModal,
  Card,
  PDFExportButton,
  type ViewMode,
  type GanttBooking,
  type BookingDetail,
  type PDFExportBooking,
} from "@nevermiss/ui";
import { useAuth, useBookings } from "@nevermiss/core";
import { Calendar } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    bookings,
    loading,
    error,
    fetchBookings,
    subscribeToBookings,
    cancelBooking,
    unsubscribe,
  } = useBookings();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const today = new Date();
    if (viewMode === "week") {
      return {
        start: today,
        end: addDays(today, 7),
      };
    } else {
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }
  }, [viewMode]);

  // Fetch bookings when user or date range changes
  useEffect(() => {
    if (user?.id) {
      fetchBookings(user.id, dateRange.start, dateRange.end);
    }
  }, [user?.id, dateRange, fetchBookings]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (user?.id) {
      subscribeToBookings(user.id);
      return () => unsubscribe();
    }
  }, [user?.id, subscribeToBookings, unsubscribe]);

  // Convert bookings to Gantt format
  const ganttBookings: GanttBooking[] = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      startAt: booking.startAt,
      endAt: booking.endAt,
      meetingType: booking.meetingType,
    }));
  }, [bookings]);

  // Convert bookings to PDF format
  const pdfBookings: PDFExportBooking[] = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      startAt: booking.startAt,
      endAt: booking.endAt,
      meetingType: booking.meetingType as PDFExportBooking["meetingType"],
    }));
  }, [bookings]);

  // Handle booking click
  const handleBookingClick = (ganttBooking: GanttBooking) => {
    const booking = bookings.find((b) => b.id === ganttBooking.id);
    if (booking) {
      setSelectedBooking({
        id: booking.id,
        guestName: booking.guestName,
        startAt: booking.startAt,
        endAt: booking.endAt,
        meetingType: booking.meetingType as BookingDetail["meetingType"],
        meetingUrl: booking.meetingUrl,
        locationAddress: booking.locationAddress,
        status: booking.status as BookingDetail["status"],
        cancelDeadline: booking.cancelDeadline,
      });
      setIsModalOpen(true);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setIsCancelling(true);
    try {
      const result = await cancelBooking(bookingId);
      if (!result.success) {
        console.error("Failed to cancel booking:", result.error);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          ダッシュボード
        </h1>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setViewMode("week")}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-full transition-colors
                ${
                  viewMode === "week"
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }
              `}
            >
              週
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-full transition-colors
                ${
                  viewMode === "month"
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }
              `}
            >
              月
            </button>
          </div>

          {/* PDF Export */}
          <PDFExportButton bookings={pdfBookings} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card variant="default" padding="md">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </Card>
      )}

      {/* Gantt Chart */}
      <div className="overflow-hidden">
        {loading && bookings.length === 0 ? (
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-slate-500 dark:text-slate-400">
                  予約を読み込み中...
                </p>
              </div>
            </div>
          </Card>
        ) : bookings.length === 0 ? (
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-slate-500 dark:text-slate-400">
                  この期間に予約はありません
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <GanttChart
            viewMode={viewMode}
            bookings={ganttBookings}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCancel={handleCancelBooking}
        isCancelling={isCancelling}
      />
    </div>
  );
}
