"use client";

import React, { useState } from "react";
import { Video, MapPin, Clock } from "lucide-react";
import { Card } from "../Card";
import { LoadingSpinner } from "../LoadingSpinner";
import { TimeSlotPicker, type TimeSlotBookingURL, type TimeSlotBooking } from "./TimeSlotPicker";
import { BookingConfirmForm, type BookingConfirmBookingURL } from "./BookingConfirmForm";
import { BookingComplete, type BookingCompleteData } from "./BookingComplete";

export interface PublicBookingURL {
  id: string;
  title: string;
  durationMinutes: number;
  meetingType: "zoom" | "google_meet" | "onsite";
  locationAddress?: string | null;
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  minNoticeHours: number;
  maxDaysAhead: number;
}

export interface PublicBooking {
  startAt: Date;
  endAt: Date;
}

export interface BookingSubmitData {
  guestName: string;
  startAt: Date;
  endAt: Date;
}

export interface BookingSubmitResult {
  meetingUrl?: string | null;
}

export interface PublicBookingPageProps {
  bookingURL: PublicBookingURL;
  existingBookings: PublicBooking[];
  onSubmit: (data: BookingSubmitData) => Promise<BookingSubmitResult>;
}

type Step = "select_time" | "confirm" | "complete";

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

export function PublicBookingPage({
  bookingURL,
  existingBookings,
  onSubmit,
}: PublicBookingPageProps) {
  const [step, setStep] = useState<Step>("select_time");
  const [selectedTime, setSelectedTime] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedBooking, setCompletedBooking] =
    useState<BookingCompleteData | null>(null);

  // Convert to TimeSlotPicker format
  const timeSlotBookingURL: TimeSlotBookingURL = {
    durationMinutes: bookingURL.durationMinutes,
    availableDays: bookingURL.availableDays,
    availableStartTime: bookingURL.availableStartTime,
    availableEndTime: bookingURL.availableEndTime,
    minNoticeHours: bookingURL.minNoticeHours,
    maxDaysAhead: bookingURL.maxDaysAhead,
  };

  const timeSlotBookings: TimeSlotBooking[] = existingBookings.map((b) => ({
    startAt: b.startAt,
    endAt: b.endAt,
  }));

  // Convert to BookingConfirmForm format
  const confirmBookingURL: BookingConfirmBookingURL = {
    title: bookingURL.title,
    durationMinutes: bookingURL.durationMinutes,
    meetingType: bookingURL.meetingType,
    locationAddress: bookingURL.locationAddress,
  };

  const handleTimeSelect = (start: Date, end: Date) => {
    setSelectedTime({ start, end });
    setStep("confirm");
  };

  const handleConfirm = async (guestName: string) => {
    if (!selectedTime) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        guestName,
        startAt: selectedTime.start,
        endAt: selectedTime.end,
      });

      setCompletedBooking({
        guestName,
        startAt: selectedTime.start,
        endAt: selectedTime.end,
        meetingUrl: result.meetingUrl,
        meetingType: bookingURL.meetingType,
        locationAddress: bookingURL.locationAddress,
      });
      setStep("complete");
    } catch (err) {
      console.error("Failed to create booking:", err);
      // Stay on confirm step with error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep("select_time");
    setSelectedTime(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <Card variant="default" padding="md">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            {bookingURL.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{bookingURL.durationMinutes}分</span>
            </div>
            <div className="flex items-center gap-1.5">
              {bookingURL.meetingType === "onsite" ? (
                <MapPin className="w-4 h-4" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              <span>{meetingTypeLabels[bookingURL.meetingType]}</span>
            </div>
          </div>
          {bookingURL.meetingType === "onsite" &&
            bookingURL.locationAddress && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                場所: {bookingURL.locationAddress}
              </p>
            )}
        </Card>

        {/* Step indicator */}
        {step !== "complete" && (
          <div className="flex items-center justify-center gap-2">
            <div
              className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                step === "select_time"
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                  : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }
            `}
            >
              1
            </div>
            <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
            <div
              className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                step === "confirm"
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                  : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }
            `}
            >
              2
            </div>
          </div>
        )}

        {/* Content */}
        {step === "select_time" && (
          <TimeSlotPicker
            bookingURL={timeSlotBookingURL}
            existingBookings={timeSlotBookings}
            onSelect={handleTimeSelect}
          />
        )}

        {step === "confirm" && selectedTime && (
          <BookingConfirmForm
            selectedTime={selectedTime}
            bookingURL={confirmBookingURL}
            onConfirm={handleConfirm}
            onBack={handleBack}
            isLoading={isSubmitting}
          />
        )}

        {step === "complete" && completedBooking && (
          <BookingComplete booking={completedBooking} />
        )}

        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50">
            <Card variant="default" padding="lg">
              <LoadingSpinner size="lg" label="予約を作成中..." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
