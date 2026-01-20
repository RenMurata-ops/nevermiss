"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient, type BookingRow } from "@nevermiss/supabase";
import {
  CancelComplete,
  Card,
  LoadingSpinner,
  type CancelCompleteBooking,
} from "@nevermiss/ui";
import { AlertCircle } from "lucide-react";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; booking: CancelCompleteBooking };

export default function CancelCompletePage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [state, setState] = useState<PageState>({ status: "loading" });

  const supabase = createClient();

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("guest_name, start_at, end_at")
          .eq("id", bookingId)
          .single();

        if (error || !data) {
          console.error("Booking fetch error:", error?.message);
          setState({ status: "error", message: "予約情報の取得に失敗しました" });
          return;
        }

        const row = data as Pick<BookingRow, "guest_name" | "start_at" | "end_at">;
        const booking: CancelCompleteBooking = {
          guestName: row.guest_name,
          startAt: new Date(row.start_at),
          endAt: new Date(row.end_at),
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
  return <CancelComplete booking={state.booking} />;
}
