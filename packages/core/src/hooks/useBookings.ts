import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getSupabase } from "@nevermiss/supabase";
import type { Booking, BookingRow } from "@nevermiss/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ==============================================
// Types
// ==============================================

export interface UseBookingsState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

export interface UseBookingsReturn extends UseBookingsState {
  fetchBookings: (
    userId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<void>;
  subscribeToBookings: (userId: string) => void;
  cancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  checkDoubleBooking: (
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeBookingId?: string
  ) => Promise<boolean>;
  unsubscribe: () => void;
}

// ==============================================
// Helper: Convert DB row to Booking type
// ==============================================

function mapRowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    bookingUrlId: row.booking_url_id,
    userId: row.user_id,
    guestName: row.guest_name,
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    meetingUrl: row.meeting_url,
    meetingType: row.meeting_type as Booking["meetingType"],
    locationAddress: row.location_address,
    status: row.status as Booking["status"],
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
    cancelDeadline: new Date(row.cancel_deadline),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ==============================================
// Hook
// ==============================================

export function useBookings(): UseBookingsReturn {
  const [state, setState] = useState<UseBookingsState>({
    bookings: [],
    loading: false,
    error: null,
  });

  const supabase = useMemo(() => getSupabase(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Fetch bookings for a date range
  const fetchBookings = useCallback(
    async (userId: string, startDate: Date, endDate: Date) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "confirmed")
          .gte("start_at", startDate.toISOString())
          .lte("start_at", endDate.toISOString())
          .order("start_at", { ascending: true });

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return;
        }

        const bookings = (data || []).map(mapRowToBooking);
        setState({ bookings, loading: false, error: null });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約の取得に失敗しました";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [supabase]
  );

  // Subscribe to realtime changes
  const subscribeToBookings = useCallback(
    (userId: string) => {
      // Unsubscribe from previous channel if exists
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      currentUserIdRef.current = userId;

      const channel = supabase
        .channel(`bookings:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;

            setState((prev) => {
              let updatedBookings = [...prev.bookings];

              switch (eventType) {
                case "INSERT":
                  if (newRecord && (newRecord as BookingRow).status === "confirmed") {
                    const newBooking = mapRowToBooking(newRecord as BookingRow);
                    updatedBookings.push(newBooking);
                    updatedBookings.sort(
                      (a, b) => a.startAt.getTime() - b.startAt.getTime()
                    );
                  }
                  break;

                case "UPDATE":
                  if (newRecord) {
                    const updated = newRecord as BookingRow;
                    const index = updatedBookings.findIndex(
                      (b) => b.id === updated.id
                    );

                    if (updated.status === "cancelled") {
                      // Remove cancelled booking from list
                      if (index !== -1) {
                        updatedBookings.splice(index, 1);
                      }
                    } else if (index !== -1) {
                      // Update existing booking
                      updatedBookings[index] = mapRowToBooking(updated);
                    } else if (updated.status === "confirmed") {
                      // Add if not in list and confirmed
                      updatedBookings.push(mapRowToBooking(updated));
                      updatedBookings.sort(
                        (a, b) => a.startAt.getTime() - b.startAt.getTime()
                      );
                    }
                  }
                  break;

                case "DELETE":
                  if (oldRecord) {
                    const deletedId = (oldRecord as BookingRow).id;
                    updatedBookings = updatedBookings.filter(
                      (b) => b.id !== deletedId
                    );
                  }
                  break;
              }

              return { ...prev, bookings: updatedBookings };
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [supabase]
  );

  // Unsubscribe from realtime
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    currentUserIdRef.current = null;
  }, [supabase]);

  // Cancel a booking
  const cancelBooking = useCallback(
    async (
      bookingId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const now = new Date().toISOString();

        const { error } = await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: now,
          } as never)
          .eq("id", bookingId);

        if (error) {
          return { success: false, error: error.message };
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          bookings: prev.bookings.filter((b) => b.id !== bookingId),
        }));

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約のキャンセルに失敗しました";
        return { success: false, error: message };
      }
    },
    [supabase]
  );

  // Check for double booking
  const checkDoubleBooking = useCallback(
    async (
      userId: string,
      startAt: Date,
      endAt: Date,
      excludeBookingId?: string
    ): Promise<boolean> => {
      try {
        // Find overlapping bookings
        // Overlap condition: existing.start < new.end AND existing.end > new.start
        let query = supabase
          .from("bookings")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "confirmed")
          .lt("start_at", endAt.toISOString())
          .gt("end_at", startAt.toISOString());

        if (excludeBookingId) {
          query = query.neq("id", excludeBookingId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error checking double booking:", error.message);
          return true; // Return true (has conflict) on error to be safe
        }

        return (data || []).length > 0;
      } catch (err) {
        console.error("Error checking double booking:", err);
        return true; // Return true on error to be safe
      }
    },
    [supabase]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    ...state,
    fetchBookings,
    subscribeToBookings,
    cancelBooking,
    checkDoubleBooking,
    unsubscribe,
  };
}
