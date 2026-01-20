// ==============================================
// @nevermiss/core - Hooks
// ==============================================

export { useAuth } from "./useAuth";
export type { AuthResult, UseAuthReturn } from "./useAuth";

export { useBookings } from "./useBookings";
export type { UseBookingsState, UseBookingsReturn } from "./useBookings";

export { useBookingURLs } from "./useBookingURLs";
export type {
  UseBookingURLsState,
  UseBookingURLsReturn,
  BookingURLCreateData,
  BookingURLUpdateData,
} from "./useBookingURLs";

export { useCreateBooking } from "./useCreateBooking";
export type {
  UseCreateBookingState,
  UseCreateBookingReturn,
  CreateBookingData,
  CreateBookingResult,
} from "./useCreateBooking";

export { useNotifications } from "./useNotifications";
export type {
  UseNotificationsState,
  UseNotificationsReturn,
} from "./useNotifications";

export { useGoogleConnect } from "./useGoogleConnect";
export type {
  UseGoogleConnectState,
  UseGoogleConnectReturn,
} from "./useGoogleConnect";
