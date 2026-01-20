import { useState, useCallback, useMemo } from "react";
import { getSupabase } from "@nevermiss/supabase";
import type { MeetingType, InsertTables, BookingRow } from "@nevermiss/supabase";

// ==============================================
// Types
// ==============================================

export interface CreateBookingData {
  guestName: string;
  startAt: Date;
  endAt: Date;
  bookingUrlId: string;
  userId: string;
  meetingType: MeetingType;
  locationAddress?: string | null;
}

export interface CreateBookingResult {
  bookingId: string;
  meetingUrl?: string | null;
}

export interface UseCreateBookingState {
  loading: boolean;
  error: string | null;
}

export interface UseCreateBookingReturn extends UseCreateBookingState {
  createBooking: (data: CreateBookingData) => Promise<CreateBookingResult | null>;
}

// ==============================================
// Hook
// ==============================================

export function useCreateBooking(): UseCreateBookingReturn {
  const [state, setState] = useState<UseCreateBookingState>({
    loading: false,
    error: null,
  });

  const supabase = useMemo(() => getSupabase(), []);

  // Call Edge Function to create meeting URL
  const callMeetingFunction = useCallback(
    async (
      functionName: string,
      bookingId: string
    ): Promise<string | null> => {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { booking_id: bookingId },
        });

        if (error) {
          console.error(`${functionName} error:`, error.message);
          return null;
        }

        return data?.meeting_url || null;
      } catch (err) {
        console.error(`${functionName} error:`, err);
        return null;
      }
    },
    [supabase]
  );

  // Create booking with optional meeting URL generation
  const createBooking = useCallback(
    async (data: CreateBookingData): Promise<CreateBookingResult | null> => {
      setState({ loading: true, error: null });

      try {
        // Calculate cancel_deadline (3 days before start_at)
        const cancelDeadline = new Date(data.startAt);
        cancelDeadline.setDate(cancelDeadline.getDate() - 3);

        // Insert booking
        const insertData: InsertTables<"bookings"> = {
          guest_name: data.guestName,
          start_at: data.startAt.toISOString(),
          end_at: data.endAt.toISOString(),
          booking_url_id: data.bookingUrlId,
          user_id: data.userId,
          meeting_type: data.meetingType,
          location_address: data.locationAddress || null,
          status: "confirmed",
          cancel_deadline: cancelDeadline.toISOString(),
        };

        const { data: booking, error: insertError } = await supabase
          .from("bookings")
          .insert(insertData as never)
          .select("id")
          .single();

        if (insertError || !booking) {
          console.error("Booking insert error:", insertError?.message);
          setState({
            loading: false,
            error: "予約の作成に失敗しました: " + (insertError?.message || "Unknown error"),
          });
          return null;
        }

        const bookingId = (booking as { id: string }).id;
        let meetingUrl: string | null = null;

        // Call appropriate Edge Function based on meeting type
        if (data.meetingType === "zoom") {
          meetingUrl = await callMeetingFunction("create-zoom-meeting", bookingId);

          if (!meetingUrl) {
            // Edge Function failed, but booking was created
            console.warn("Failed to create Zoom meeting, but booking was created");
            setState({
              loading: false,
              error: "Zoomミーティングの作成に失敗しました。後から会議URLを設定できます。",
            });
            return { bookingId, meetingUrl: null };
          }
        } else if (data.meetingType === "google_meet") {
          meetingUrl = await callMeetingFunction("create-google-meet", bookingId);

          if (!meetingUrl) {
            // Edge Function failed, but booking was created
            console.warn("Failed to create Google Meet, but booking was created");
            setState({
              loading: false,
              error: "Google Meetの作成に失敗しました。後から会議URLを設定できます。",
            });
            return { bookingId, meetingUrl: null };
          }
        }
        // For "onsite", meetingUrl stays null

        setState({ loading: false, error: null });
        return { bookingId, meetingUrl };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約の作成に失敗しました";
        console.error("Create booking error:", err);
        setState({ loading: false, error: message });
        return null;
      }
    },
    [supabase, callMeetingFunction]
  );

  return {
    ...state,
    createBooking,
  };
}
