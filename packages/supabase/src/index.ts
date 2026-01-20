// ==============================================
// @nevermiss/supabase - Supabase Client & Types
// ==============================================

// Client
export {
  createClient,
  createClientWithConfig,
  getSupabase,
  createSupabaseClient,
} from "./client";

// Types - Entity types (application-level)
export type {
  User,
  Organization,
  BookingURL,
  Booking,
  Notification,
  PushToken,
  ZoomCredentials,
} from "./types";

// Types - Enum types
export type {
  MeetingType,
  BookingStatus,
  NotificationType,
  Platform,
  UserRole,
  Plan,
} from "./types";

// Types - Database types (Supabase-level)
export type {
  Database,
  Json,
  Tables,
  InsertTables,
  UpdateTables,
  UserRow,
  OrganizationRow,
  BookingURLRow,
  BookingRow,
  NotificationRow,
  PushTokenRow,
} from "./types";
