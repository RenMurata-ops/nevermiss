// ==============================================
// Supabase Database Types for Nevermiss
// ==============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ==============================================
// Enum Types
// ==============================================

export type MeetingType = "zoom" | "google_meet" | "onsite";
export type BookingStatus = "confirmed" | "cancelled";
export type NotificationType = "new_booking" | "booking_cancelled";
export type Platform = "ios" | "macos";
export type UserRole = "admin" | "member";
export type Plan = "free" | "pro" | "enterprise";

// ==============================================
// Entity Types (Application-level)
// ==============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  organizationId: string | null;
  role: UserRole;
  plan: Plan;
  googleRefreshToken: string | null;
  zoomCredentials: ZoomCredentials | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoomCredentials {
  accountId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  createdAt: Date;
}

export interface BookingURL {
  id: string;
  userId: string;
  slug: string;
  title: string;
  durationMinutes: number;
  meetingType: MeetingType;
  locationAddress: string | null;
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  minNoticeHours: number;
  maxDaysAhead: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  bookingUrlId: string;
  userId: string;
  guestName: string;
  startAt: Date;
  endAt: Date;
  meetingUrl: string | null;
  meetingType: MeetingType;
  locationAddress: string | null;
  status: BookingStatus;
  cancelledAt: Date | null;
  cancelDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  bookingId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: Platform;
  createdAt: Date;
}

// ==============================================
// Database Types (Supabase-level)
// ==============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          organization_id: string | null;
          role: string;
          plan: string;
          google_refresh_token: string | null;
          zoom_credentials: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          organization_id?: string | null;
          role?: string;
          plan?: string;
          google_refresh_token?: string | null;
          zoom_credentials?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          organization_id?: string | null;
          role?: string;
          plan?: string;
          google_refresh_token?: string | null;
          zoom_credentials?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          plan: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      booking_urls: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          title: string;
          duration_minutes: number;
          meeting_type: string;
          location_address: string | null;
          available_days: number[];
          available_start_time: string;
          available_end_time: string;
          min_notice_hours: number;
          max_days_ahead: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          title: string;
          duration_minutes: number;
          meeting_type: string;
          location_address?: string | null;
          available_days: number[];
          available_start_time: string;
          available_end_time: string;
          min_notice_hours?: number;
          max_days_ahead?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          title?: string;
          duration_minutes?: number;
          meeting_type?: string;
          location_address?: string | null;
          available_days?: number[];
          available_start_time?: string;
          available_end_time?: string;
          min_notice_hours?: number;
          max_days_ahead?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_urls_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          booking_url_id: string;
          user_id: string;
          guest_name: string;
          start_at: string;
          end_at: string;
          meeting_url: string | null;
          meeting_type: string;
          location_address: string | null;
          status: string;
          cancelled_at: string | null;
          cancel_deadline: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_url_id: string;
          user_id: string;
          guest_name: string;
          start_at: string;
          end_at: string;
          meeting_url?: string | null;
          meeting_type: string;
          location_address?: string | null;
          status?: string;
          cancelled_at?: string | null;
          cancel_deadline: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_url_id?: string;
          user_id?: string;
          guest_name?: string;
          start_at?: string;
          end_at?: string;
          meeting_url?: string | null;
          meeting_type?: string;
          location_address?: string | null;
          status?: string;
          cancelled_at?: string | null;
          cancel_deadline?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_booking_url_id_fkey";
            columns: ["booking_url_id"];
            referencedRelation: "booking_urls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          booking_id: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          booking_id: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          booking_id?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      meeting_type: MeetingType;
      booking_status: BookingStatus;
      notification_type: NotificationType;
      platform: Platform;
    };
  };
}

// ==============================================
// Helper Types
// ==============================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Shorthand types for common use
export type UserRow = Tables<"users">;
export type OrganizationRow = Tables<"organizations">;
export type BookingURLRow = Tables<"booking_urls">;
export type BookingRow = Tables<"bookings">;
export type NotificationRow = Tables<"notifications">;
export type PushTokenRow = Tables<"push_tokens">;
