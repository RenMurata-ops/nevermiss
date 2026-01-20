"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@nevermiss/supabase";
import {
  PublicBookingPage,
  BookingExpired,
  Card,
  LoadingSpinner,
  type PublicBookingURL,
  type PublicBooking,
  type BookingSubmitData,
} from "@nevermiss/ui";
import { AlertCircle } from "lucide-react";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "inactive" }
  | { status: "expired" }
  | { status: "ready"; bookingURL: PublicBookingURL; existingBookings: PublicBooking[] };

export default function PublicBookingPageRoute() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch booking URL and existing bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch booking URL by slug
        const { data: urlData, error: urlError } = await supabase
          .from("booking_urls")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (urlError) {
          console.error("Error fetching booking URL:", urlError.message);
          setState({ status: "not_found" });
          return;
        }

        if (!urlData) {
          setState({ status: "not_found" });
          return;
        }

        // Check if active
        if (!urlData.is_active) {
          setState({ status: "inactive" });
          return;
        }

        // Check if expired
        if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
          setState({ status: "expired" });
          return;
        }

        // Store user_id for booking creation
        setUserId(urlData.user_id);

        // Fetch existing confirmed bookings for this booking URL
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("start_at, end_at")
          .eq("booking_url_id", urlData.id)
          .eq("status", "confirmed");

        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError.message);
        }

        const existingBookings: PublicBooking[] = (bookingsData || []).map(
          (b) => ({
            startAt: new Date(b.start_at),
            endAt: new Date(b.end_at),
          })
        );

        const bookingURL: PublicBookingURL = {
          id: urlData.id,
          title: urlData.title,
          durationMinutes: urlData.duration_minutes,
          meetingType: urlData.meeting_type as PublicBookingURL["meetingType"],
          locationAddress: urlData.location_address,
          availableDays: urlData.available_days,
          availableStartTime: urlData.available_start_time,
          availableEndTime: urlData.available_end_time,
          minNoticeHours: urlData.min_notice_hours,
          maxDaysAhead: urlData.max_days_ahead,
        };

        setState({
          status: "ready",
          bookingURL,
          existingBookings,
        });
      } catch (err) {
        console.error("Error loading booking page:", err);
        setState({ status: "not_found" });
      }
    };

    fetchData();
  }, [slug, supabase]);

  // Handle booking submission
  const handleSubmit = async (data: BookingSubmitData) => {
    if (state.status !== "ready" || !userId) {
      throw new Error("Invalid state");
    }

    // Calculate cancel_deadline (3 days before start_at)
    const cancelDeadline = new Date(data.startAt);
    cancelDeadline.setDate(cancelDeadline.getDate() - 3);

    // Insert booking
    const { data: bookingData, error } = await supabase
      .from("bookings")
      .insert({
        booking_url_id: state.bookingURL.id,
        user_id: userId,
        guest_name: data.guestName,
        start_at: data.startAt.toISOString(),
        end_at: data.endAt.toISOString(),
        meeting_type: state.bookingURL.meetingType,
        status: "confirmed",
        cancel_deadline: cancelDeadline.toISOString(),
        location_address: state.bookingURL.locationAddress,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating booking:", error.message);
      throw new Error("予約の作成に失敗しました");
    }

    // Redirect to complete page
    router.push(`/b/${slug}/complete?booking_id=${bookingData.id}`);

    // Return empty result (meeting_url will be added later)
    return { meetingUrl: null };
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
              予約ページが見つかりません
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              URLが正しいかご確認ください。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Inactive state
  if (state.status === "inactive") {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              この予約ページは無効です
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              この予約ページは現在利用できません。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Expired state
  if (state.status === "expired") {
    return <BookingExpired />;
  }

  // Ready state - render booking page
  return (
    <PublicBookingPage
      bookingURL={state.bookingURL}
      existingBookings={state.existingBookings}
      onSubmit={handleSubmit}
    />
  );
}
