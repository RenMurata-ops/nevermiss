"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  addHours,
  setHours,
  setMinutes,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Card } from "../Card";

export interface TimeSlotBookingURL {
  durationMinutes: number;
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  minNoticeHours: number;
  maxDaysAhead: number;
}

export interface TimeSlotBooking {
  startAt: Date;
  endAt: Date;
}

export interface TimeSlotPickerProps {
  bookingURL: TimeSlotBookingURL;
  existingBookings: TimeSlotBooking[];
  onSelect: (start: Date, end: Date) => void;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// Parse time string "HH:mm" to hours and minutes
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

// Check if two time ranges overlap
function isOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

export function TimeSlotPicker({
  bookingURL,
  existingBookings,
  onSelect,
}: TimeSlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const now = new Date();
  const minNoticeTime = addHours(now, bookingURL.minNoticeHours);
  const maxDate = addDays(now, bookingURL.maxDaysAhead);

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Check if a date is available for booking
  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = getDay(date);

    // Check if day of week is in available days
    if (!bookingURL.availableDays.includes(dayOfWeek)) {
      return false;
    }

    // Check if date is in the past
    if (isBefore(date, new Date().setHours(0, 0, 0, 0))) {
      return false;
    }

    // Check min notice hours (compare with end of day for day-level check)
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    if (isBefore(dayEnd, minNoticeTime)) {
      return false;
    }

    // Check max days ahead
    if (isAfter(date, maxDate)) {
      return false;
    }

    return true;
  };

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const slots: { start: Date; end: Date }[] = [];
    const startTime = parseTime(bookingURL.availableStartTime);
    const endTime = parseTime(bookingURL.availableEndTime);

    let slotStart = setMinutes(
      setHours(selectedDate, startTime.hours),
      startTime.minutes
    );
    const dayEnd = setMinutes(
      setHours(selectedDate, endTime.hours),
      endTime.minutes
    );

    while (slotStart < dayEnd) {
      const slotEnd = new Date(
        slotStart.getTime() + bookingURL.durationMinutes * 60 * 1000
      );

      // Don't add slots that extend beyond the available end time
      if (slotEnd > dayEnd) break;

      // Check if slot is after min notice time
      if (isAfter(slotStart, minNoticeTime)) {
        // Check if slot overlaps with existing bookings
        const hasConflict = existingBookings.some((booking) =>
          isOverlapping(slotStart, slotEnd, booking.startAt, booking.endAt)
        );

        if (!hasConflict) {
          slots.push({ start: slotStart, end: slotEnd });
        }
      }

      slotStart = slotEnd;
    }

    return slots;
  }, [selectedDate, bookingURL, existingBookings, minNoticeTime]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
    }
  };

  const handleTimeSlotClick = (start: Date, end: Date) => {
    onSelect(start, end);
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card variant="default" padding="none">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="前月"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="次月"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={`
                py-2 text-center text-sm font-medium
                ${index === 0 ? "text-red-500" : ""}
                ${index === 6 ? "text-blue-500" : ""}
                ${index > 0 && index < 6 ? "text-slate-600 dark:text-slate-400" : ""}
              `}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isAvailable = isDateAvailable(day);
            const isToday = isSameDay(day, now);
            const dayOfWeek = getDay(day);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={!isCurrentMonth || !isAvailable}
                className={`
                  relative p-3 text-center text-sm transition-colors
                  ${!isCurrentMonth ? "text-slate-300 dark:text-slate-700" : ""}
                  ${isCurrentMonth && !isAvailable ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : ""}
                  ${isCurrentMonth && isAvailable ? "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" : ""}
                  ${isSelected ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200" : ""}
                  ${!isSelected && isCurrentMonth && isAvailable && dayOfWeek === 0 ? "text-red-500" : ""}
                  ${!isSelected && isCurrentMonth && isAvailable && dayOfWeek === 6 ? "text-blue-500" : ""}
                `}
              >
                {format(day, "d")}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-900 dark:bg-slate-50 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Time slots */}
      {selectedDate && (
        <Card variant="default" padding="md">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
            {format(selectedDate, "M月d日（E）", { locale: ja })}の空き時間
          </h3>

          {timeSlots.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              この日に予約可能な時間枠はありません
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSlotClick(slot.start, slot.end)}
                  className="
                    flex items-center justify-center gap-1.5 px-3 py-2
                    bg-slate-100 dark:bg-slate-800
                    hover:bg-slate-900 hover:text-white
                    dark:hover:bg-slate-50 dark:hover:text-slate-900
                    text-slate-700 dark:text-slate-300
                    text-sm font-medium rounded-full transition-colors
                  "
                >
                  <Clock className="w-3.5 h-3.5" />
                  {format(slot.start, "HH:mm")}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Instructions */}
      {!selectedDate && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          カレンダーから日付を選択してください
        </p>
      )}
    </div>
  );
}
