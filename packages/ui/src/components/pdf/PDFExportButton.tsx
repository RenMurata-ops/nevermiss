"use client";

import React, { useState, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileText, Download } from "lucide-react";
import { Button } from "../Button";
import { PDFDocument, type PDFBooking } from "./PDFDocument";

// ==============================================
// Types
// ==============================================

export interface PDFExportBooking {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: "zoom" | "google_meet" | "onsite";
}

export interface PDFExportButtonProps {
  bookings: PDFExportBooking[];
}

// ==============================================
// Helper functions
// ==============================================

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    options.push({
      value: `${year}-${month}`,
      label: `${year}年${month}月`,
    });
  }

  return options;
}

function filterBookingsByMonth(
  bookings: PDFExportBooking[],
  year: number,
  month: number
): PDFBooking[] {
  return bookings
    .filter((booking) => {
      const bookingDate = booking.startAt;
      return (
        bookingDate.getFullYear() === year &&
        bookingDate.getMonth() + 1 === month
      );
    })
    .map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      startAt: booking.startAt,
      endAt: booking.endAt,
      meetingType: booking.meetingType,
    }));
}

// ==============================================
// Component
// ==============================================

export function PDFExportButton({ bookings }: PDFExportButtonProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${now.getMonth() + 1}`
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      // Filter bookings for selected month
      const filteredBookings = filterBookingsByMonth(bookings, year, month);

      // Generate PDF blob
      const doc = <PDFDocument year={year} month={month} bookings={filteredBookings} />;
      const blob = await pdf(doc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Nevermiss_${year}_${String(month).padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Month selector */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        disabled={isGenerating}
        className="
          px-3 py-2 rounded-2xl border shadow-sm text-sm
          bg-white dark:bg-slate-950
          text-slate-900 dark:text-slate-50
          border-slate-200 dark:border-slate-700
          focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600
          disabled:opacity-50
        "
      >
        {monthOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Export button */}
      <Button
        variant="secondary"
        size="md"
        onClick={handleExport}
        disabled={isGenerating}
        isLoading={isGenerating}
        leftIcon={isGenerating ? undefined : <FileText className="w-4 h-4" />}
      >
        {isGenerating ? "生成中..." : "PDF出力"}
      </Button>
    </div>
  );
}
