"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@nevermiss/supabase";
import {
  CancelConfirm,
  Card,
  LoadingSpinner,
  type CancelConfirmBooking,
} from "@nevermiss/ui";
import { AlertCircle } from "lucide-react";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "already_cancelled" }
  | { status: "ready"; booking: CancelConfirmBooking };

export default function CancelConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const bookingId = params.id as string;

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, guest_name, start_at, end_at, meeting_type, status, cancel_deadline")
          .eq("id", bookingId)
          .single();

        if (error || !data) {
          console.error("Booking fetch error:", error?.message);
          setState({ status: "not_found" });
          return;
        }

        // Check if already cancelled
        if (data.status === "cancelled") {
          setState({ status: "already_cancelled" });
          return;
        }

        const booking: CancelConfirmBooking = {
          id: data.id,
          guestName: data.guest_name,
          startAt: new Date(data.start_at),
          endAt: new Date(data.end_at),
          meetingType: data.meeting_type as CancelConfirmBooking["meetingType"],
          cancelDeadline: new Date(data.cancel_deadline),
        };

        setState({ status: "ready", booking });
      } catch (err) {
        console.error("Error loading booking:", err);
        setState({ status: "not_found" });
      }
    };

    fetchBooking();
  }, [bookingId, supabase]);

  // Handle cancel confirmation
  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Cancel error:", error.message);
        setIsSubmitting(false);
        return;
      }

      // Redirect to complete page
      router.push(`/b/${slug}/cancel/${bookingId}/complete`);
    } catch (err) {
      console.error("Cancel error:", err);
      setIsSubmitting(false);
    }
  };

  // Handle back
  const handleBack = () => {
    router.back();
  };

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

  // Not found state
  if (state.status === "not_found") {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              予約が見つかりません
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              URLが正しいかご確認ください。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Already cancelled state
  if (state.status === "already_cancelled") {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              この予約は既にキャンセルされています
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              この予約は既にキャンセル処理が完了しています。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Ready state
  return (
    <CancelConfirm
      booking={state.booking}
      onConfirm={handleConfirm}
      onBack={handleBack}
      loading={isSubmitting}
    />
  );
}
