import { useState, useCallback } from "react";
import { createClient } from "@nevermiss/supabase";
import type { BookingURL, BookingURLRow, MeetingType } from "@nevermiss/supabase";

// ==============================================
// Types
// ==============================================

export interface UseBookingURLsState {
  bookingURLs: BookingURL[];
  loading: boolean;
  error: string | null;
}

export interface BookingURLCreateData {
  title: string;
  durationMinutes: number;
  meetingType: MeetingType;
  locationAddress?: string | null;
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  minNoticeHours?: number;
  maxDaysAhead?: number;
  expiresAt?: string | null;
}

export interface BookingURLUpdateData {
  title?: string;
  durationMinutes?: number;
  meetingType?: MeetingType;
  locationAddress?: string | null;
  availableDays?: number[];
  availableStartTime?: string;
  availableEndTime?: string;
  minNoticeHours?: number;
  maxDaysAhead?: number;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface UseBookingURLsReturn extends UseBookingURLsState {
  fetchBookingURLs: (userId: string) => Promise<void>;
  getBookingURLBySlug: (slug: string) => Promise<BookingURL | null>;
  createBookingURL: (userId: string, data: BookingURLCreateData) => Promise<BookingURL | null>;
  updateBookingURL: (id: string, data: BookingURLUpdateData) => Promise<BookingURL | null>;
  deleteBookingURL: (id: string) => Promise<boolean>;
  generateUniqueSlug: (title: string) => Promise<string>;
}

// ==============================================
// Helper: Convert DB row to BookingURL type
// ==============================================

function mapRowToBookingURL(row: BookingURLRow): BookingURL {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title,
    durationMinutes: row.duration_minutes,
    meetingType: row.meeting_type as MeetingType,
    locationAddress: row.location_address,
    availableDays: row.available_days,
    availableStartTime: row.available_start_time,
    availableEndTime: row.available_end_time,
    minNoticeHours: row.min_notice_hours,
    maxDaysAhead: row.max_days_ahead,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ==============================================
// Helper: Generate random string (nanoid-style)
// ==============================================

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function generateRandomString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return result;
}

// ==============================================
// Helper: Sanitize title for slug
// ==============================================

function sanitizeForSlug(title: string): string {
  // Remove or replace special characters, keep alphanumeric and hyphens
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars except word chars, spaces, hyphens
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 10); // Take first 10 characters
}

// ==============================================
// Hook
// ==============================================

export function useBookingURLs(): UseBookingURLsReturn {
  const [state, setState] = useState<UseBookingURLsState>({
    bookingURLs: [],
    loading: false,
    error: null,
  });

  const supabase = createClient();

  // Generate unique slug from title
  const generateUniqueSlug = useCallback(
    async (title: string): Promise<string> => {
      const maxAttempts = 10;
      let attempt = 0;

      while (attempt < maxAttempts) {
        const sanitized = sanitizeForSlug(title);
        const random = generateRandomString(6);
        const slug = sanitized ? `${sanitized}-${random}` : random;

        // Check if slug exists
        const { data, error } = await supabase
          .from("booking_urls")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Error checking slug:", error.message);
          // Continue with this slug anyway
          return slug;
        }

        if (!data) {
          // Slug is unique
          return slug;
        }

        attempt++;
      }

      // Fallback: use only random string
      return generateRandomString(12);
    },
    [supabase]
  );

  // Fetch user's booking URLs (is_active = true only)
  const fetchBookingURLs = useCallback(
    async (userId: string): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase
          .from("booking_urls")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return;
        }

        const bookingURLs = (data || []).map(mapRowToBookingURL);
        setState({
          bookingURLs,
          loading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約URLの取得に失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    },
    [supabase]
  );

  // Get booking URL by slug (for public page, no RLS restriction)
  const getBookingURLBySlug = useCallback(
    async (slug: string): Promise<BookingURL | null> => {
      try {
        const { data, error } = await supabase
          .from("booking_urls")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Error fetching booking URL by slug:", error.message);
          return null;
        }

        return data ? mapRowToBookingURL(data) : null;
      } catch (err) {
        console.error("Error fetching booking URL by slug:", err);
        return null;
      }
    },
    [supabase]
  );

  // Create new booking URL with auto-generated slug
  const createBookingURL = useCallback(
    async (
      userId: string,
      data: BookingURLCreateData
    ): Promise<BookingURL | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Generate unique slug
        const slug = await generateUniqueSlug(data.title);

        const insertData = {
          user_id: userId,
          slug,
          title: data.title,
          duration_minutes: data.durationMinutes,
          meeting_type: data.meetingType,
          location_address: data.locationAddress || null,
          available_days: data.availableDays,
          available_start_time: data.availableStartTime,
          available_end_time: data.availableEndTime,
          min_notice_hours: data.minNoticeHours ?? 24,
          max_days_ahead: data.maxDaysAhead ?? 30,
          expires_at: data.expiresAt || null,
        };

        const { data: result, error } = await supabase
          .from("booking_urls")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return null;
        }

        const newBookingURL = mapRowToBookingURL(result);

        // Update local state
        setState((prev) => ({
          bookingURLs: [newBookingURL, ...prev.bookingURLs],
          loading: false,
          error: null,
        }));

        return newBookingURL;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約URLの作成に失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        return null;
      }
    },
    [supabase, generateUniqueSlug]
  );

  // Update booking URL
  const updateBookingURL = useCallback(
    async (
      id: string,
      data: BookingURLUpdateData
    ): Promise<BookingURL | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const updateData: Record<string, unknown> = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.durationMinutes !== undefined)
          updateData.duration_minutes = data.durationMinutes;
        if (data.meetingType !== undefined)
          updateData.meeting_type = data.meetingType;
        if (data.locationAddress !== undefined)
          updateData.location_address = data.locationAddress;
        if (data.availableDays !== undefined)
          updateData.available_days = data.availableDays;
        if (data.availableStartTime !== undefined)
          updateData.available_start_time = data.availableStartTime;
        if (data.availableEndTime !== undefined)
          updateData.available_end_time = data.availableEndTime;
        if (data.minNoticeHours !== undefined)
          updateData.min_notice_hours = data.minNoticeHours;
        if (data.maxDaysAhead !== undefined)
          updateData.max_days_ahead = data.maxDaysAhead;
        if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;

        const { data: result, error } = await supabase
          .from("booking_urls")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return null;
        }

        const updatedBookingURL = mapRowToBookingURL(result);

        // Update local state
        setState((prev) => ({
          bookingURLs: prev.bookingURLs.map((url) =>
            url.id === id ? updatedBookingURL : url
          ),
          loading: false,
          error: null,
        }));

        return updatedBookingURL;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約URLの更新に失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        return null;
      }
    },
    [supabase]
  );

  // Delete booking URL (soft delete: set is_active = false)
  const deleteBookingURL = useCallback(
    async (id: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase
          .from("booking_urls")
          .update({ is_active: false })
          .eq("id", id);

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return false;
        }

        // Remove from local state
        setState((prev) => ({
          bookingURLs: prev.bookingURLs.filter((url) => url.id !== id),
          loading: false,
          error: null,
        }));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "予約URLの削除に失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        return false;
      }
    },
    [supabase]
  );

  return {
    ...state,
    fetchBookingURLs,
    getBookingURLBySlug,
    createBookingURL,
    updateBookingURL,
    deleteBookingURL,
    generateUniqueSlug,
  };
}
