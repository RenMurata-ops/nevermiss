// ==============================================
// Supabase Edge Function: send-push-notification
// ==============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@3";
import { ja } from "https://esm.sh/date-fns@3/locale";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Notification types
type NotificationType = "new_booking" | "booking_cancelled";

// Response helper
function jsonResponse(
  data: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Error response helper
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Get notification title based on type
function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case "new_booking":
      return "新しい予約が入りました";
    case "booking_cancelled":
      return "予約がキャンセルされました";
    default:
      return "通知";
  }
}

// Format booking info for notification body
function formatNotificationBody(
  guestName: string,
  startAt: string,
  type: NotificationType
): string {
  const date = new Date(startAt);
  const formattedDate = format(date, "M月d日(E) HH:mm", { locale: ja });

  switch (type) {
    case "new_booking":
      return `${guestName}様から${formattedDate}の予約`;
    case "booking_cancelled":
      return `${guestName}様の${formattedDate}の予約`;
    default:
      return `${guestName}様 - ${formattedDate}`;
  }
}

// Send push notification via Expo Push API
async function sendExpoPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
  badge: number
): Promise<void> {
  if (tokens.length === 0) {
    console.log("No push tokens to send to");
    return;
  }

  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default" as const,
    badge,
  }));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add Expo access token if available (for higher rate limits)
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (expoAccessToken) {
    headers["Authorization"] = `Bearer ${expoAccessToken}`;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Expo Push API error:", errorText);
      return;
    }

    const result = await response.json();
    console.log("Expo Push API response:", JSON.stringify(result));

    // Check for individual ticket errors
    if (result.data) {
      result.data.forEach((ticket: { status: string; message?: string }, index: number) => {
        if (ticket.status === "error") {
          console.error(`Push notification error for token ${index}:`, ticket.message);
        }
      });
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // Parse request body
    const body = await req.json();
    const { user_id, type, booking_id } = body;

    if (!user_id) {
      return errorResponse("user_id is required");
    }

    if (!type || !["new_booking", "booking_cancelled"].includes(type)) {
      return errorResponse("type must be 'new_booking' or 'booking_cancelled'");
    }

    if (!booking_id) {
      return errorResponse("booking_id is required");
    }

    // Initialize Supabase Admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse("Supabase configuration missing", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch push tokens for the user
    const { data: pushTokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (tokensError) {
      console.error("Push tokens fetch error:", tokensError.message);
      // Continue without push notifications
    }

    const tokens = (pushTokens || []).map((t) => t.token);

    // Fetch booking information for notification message
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("guest_name, start_at")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking fetch error:", bookingError?.message);
      return errorResponse("Booking not found", 404);
    }

    // Insert notification record
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        type,
        booking_id,
        is_read: false,
      });

    if (notificationError) {
      console.error("Notification insert error:", notificationError.message);
      // Continue - push notification can still be sent
    }

    // Get unread notification count for badge
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("is_read", false);

    if (countError) {
      console.error("Unread count error:", countError.message);
    }

    const badge = unreadCount || 1;

    // Prepare notification content
    const title = getNotificationTitle(type as NotificationType);
    const notificationBody = formatNotificationBody(
      booking.guest_name,
      booking.start_at,
      type as NotificationType
    );
    const data = {
      booking_id,
      type,
    };

    // Send push notifications
    await sendExpoPushNotification(tokens, title, notificationBody, data, badge);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Error sending push notification:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
