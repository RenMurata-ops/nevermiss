// Supabase型定義
// `supabase gen types typescript --local` で自動生成されます

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          min_notice_hours: number;
          max_days_ahead: number;
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
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
