"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, type BookingRow } from "@nevermiss/supabase";
import {
  BookingComplete,
  Card,
  LoadingSpinner,
  type BookingCompleteData,
} from "@nevermiss/ui";
import { AlertCircle } from "lucide-react";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; booking: BookingCompleteData };

function BookingCompletePage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  const [state, setState] = useState<PageState>({ status: "loading" });

  const supabase = createClient();

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setState({ status: "error", message: "予約IDが指定されていません" });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (error) {
          console.error("Error fetching booking:", error.message);
          setState({ status: "error", message: "予約情報の取得に失敗しました" });
          return;
        }

        if (!data) {
          setState({ status: "error", message: "予約が見つかりません" });
          return;
        }

        const row = data as BookingRow;
        const booking: BookingCompleteData = {
          guestName: row.guest_name,
          startAt: new Date(row.start_at),
          endAt: new Date(row.end_at),
          meetingUrl: row.meeting_url,
          meetingType: row.meeting_type as BookingCompleteData["meetingType"],
          locationAddress: row.location_address,
        };

        setState({ status: "ready", booking });
      } catch (err) {
        console.error("Error loading booking:", err);
        setState({ status: "error", message: "エラーが発生しました" });
      }
    };

    fetchBooking();
  }, [bookingId, supabase]);

  // Loading state
  if (state.status === "loading") {
    return (
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" label="読み込み中..." />
        </div>
      </Card>
    );
  }

  // Error state
  if (state.status === "error") {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              エラー
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {state.message}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Ready state
  return <BookingComplete booking={state.booking} />;
}

// Wrap with Suspense for useSearchParams
export default function BookingCompletePageRoute() {
  return (
    <Suspense
      fallback={
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" label="読み込み中..." />
          </div>
        </Card>
      }
    >
      <BookingCompletePage />
    </Suspense>
  );
}
