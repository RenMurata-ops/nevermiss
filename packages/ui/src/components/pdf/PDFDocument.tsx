"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ==============================================
// Types
// ==============================================

export interface PDFBooking {
  id: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingType: "zoom" | "google_meet" | "onsite";
}

export interface PDFDocumentProps {
  year: number;
  month: number;
  bookings: PDFBooking[];
}

// ==============================================
// Styles
// ==============================================

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e2e8f0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeaderCell: {
    width: 30,
    padding: 4,
    textAlign: "center",
    fontSize: 7,
    color: "#64748b",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  dateCell: {
    width: 50,
    padding: 4,
    fontSize: 8,
    color: "#0f172a",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 24,
    position: "relative",
  },
  timeCell: {
    width: 30,
    borderRightWidth: 1,
    borderRightColor: "#f1f5f9",
  },
  bookingBlock: {
    position: "absolute",
    top: 2,
    height: 20,
    backgroundColor: "#3b82f6",
    borderRadius: 2,
    padding: 2,
    overflow: "hidden",
  },
  bookingText: {
    fontSize: 6,
    color: "#ffffff",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
  weekendRow: {
    backgroundColor: "#fef2f2",
  },
  saturdayRow: {
    backgroundColor: "#eff6ff",
  },
});

// ==============================================
// Helper functions
// ==============================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function getDayLabel(dayOfWeek: number): string {
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  return labels[dayOfWeek];
}

function getBookingsForDay(
  bookings: PDFBooking[],
  year: number,
  month: number,
  day: number
): PDFBooking[] {
  return bookings.filter((booking) => {
    const bookingDate = booking.startAt;
    return (
      bookingDate.getFullYear() === year &&
      bookingDate.getMonth() + 1 === month &&
      bookingDate.getDate() === day
    );
  });
}

// Hours displayed in header (0-24, every 2 hours)
const HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
const HOUR_WIDTH = 30; // Width per 2-hour cell
const DATE_CELL_WIDTH = 50;

// ==============================================
// Component
// ==============================================

export function PDFDocument({ year, month, bookings }: PDFDocumentProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate position and width for a booking block
  const getBookingStyle = (booking: PDFBooking) => {
    const startHour =
      booking.startAt.getHours() + booking.startAt.getMinutes() / 60;
    const endHour =
      booking.endAt.getHours() + booking.endAt.getMinutes() / 60;
    const duration = endHour - startHour;

    // Position from left (after date cell)
    const left = DATE_CELL_WIDTH + (startHour / 2) * HOUR_WIDTH;
    // Width based on duration
    const width = (duration / 2) * HOUR_WIDTH;

    // Color based on meeting type
    let backgroundColor = "#3b82f6"; // Default blue
    if (booking.meetingType === "google_meet") {
      backgroundColor = "#10b981"; // Green
    } else if (booking.meetingType === "onsite") {
      backgroundColor = "#f59e0b"; // Amber
    }

    return {
      ...styles.bookingBlock,
      left,
      width: Math.max(width, 20), // Minimum width
      backgroundColor,
    };
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Nevermiss - {year}年{month}月
          </Text>
          <Text style={styles.subtitle}>予約スケジュール一覧</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.dateCell}>
              <Text>日付</Text>
            </View>
            {HOURS.map((hour) => (
              <View key={hour} style={styles.tableHeaderCell}>
                <Text>{hour}時</Text>
              </View>
            ))}
          </View>

          {/* Table Body */}
          {days.map((day) => {
            const dayOfWeek = getDayOfWeek(year, month, day);
            const dayBookings = getBookingsForDay(bookings, year, month, day);
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            const rowStyle = [
              styles.tableRow,
              isSunday && styles.weekendRow,
              isSaturday && styles.saturdayRow,
            ].filter(Boolean);

            return (
              <View key={day} style={rowStyle} wrap={false}>
                {/* Date cell */}
                <View style={styles.dateCell}>
                  <Text>
                    {day}日({getDayLabel(dayOfWeek)})
                  </Text>
                </View>

                {/* Time cells (background grid) */}
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.timeCell} />
                ))}

                {/* Booking blocks */}
                {dayBookings.map((booking) => (
                  <View key={booking.id} style={getBookingStyle(booking)}>
                    <Text style={styles.bookingText} numberOfLines={1}>
                      {booking.guestName}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
