// ==============================================
// Supabase Edge Function: create-google-meet
// ==============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

// Generate UUID for conference request
function generateUUID(): string {
  return crypto.randomUUID();
}

// Get Google access token from refresh token
async function getGoogleAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Google OAuth error:", errorData);

    if (errorData.error === "invalid_grant") {
      throw new Error(
        "Google連携の有効期限が切れています。再度Google連携を行ってください。"
      );
    }

    throw new Error(`Failed to refresh Google access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create Google Calendar event with Meet link
async function createCalendarEventWithMeet(
  accessToken: string,
  summary: string,
  startTime: string,
  endTime: string
): Promise<string> {
  const requestId = generateUUID();

  const eventData = {
    summary,
    start: {
      dateTime: startTime,
      timeZone: "Asia/Tokyo",
    },
    end: {
      dateTime: endTime,
      timeZone: "Asia/Tokyo",
    },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Calendar API error:", errorText);

    if (response.status === 401) {
      throw new Error(
        "Google認証が無効です。再度Google連携を行ってください。"
      );
    }

    throw new Error(`Failed to create calendar event: ${response.status}`);
  }

  const data = await response.json();

  // Extract Meet URL from conference data
  const meetUrl = data.conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string; uri: string }) =>
      ep.entryPointType === "video"
  )?.uri;

  if (!meetUrl) {
    throw new Error("Failed to get Meet URL from calendar event");
  }

  return meetUrl;
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
    const { booking_id } = body;

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

    // Fetch booking information
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        start_at,
        end_at,
        guest_name,
        meeting_type,
        booking_url_id,
        user_id
      `
      )
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking fetch error:", bookingError?.message);
      return errorResponse("Booking not found", 404);
    }

    // Check if meeting_type is google_meet
    if (booking.meeting_type !== "google_meet") {
      return errorResponse("This booking does not require a Google Meet");
    }

    // Fetch booking URL for title
    const { data: bookingUrl, error: urlError } = await supabase
      .from("booking_urls")
      .select("title")
      .eq("id", booking.booking_url_id)
      .single();

    if (urlError || !bookingUrl) {
      console.error("Booking URL fetch error:", urlError?.message);
      return errorResponse("Booking URL not found", 404);
    }

    // Fetch user's Google refresh token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("google_refresh_token")
      .eq("id", booking.user_id)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError?.message);
      return errorResponse("User not found", 404);
    }

    if (!user.google_refresh_token) {
      return errorResponse(
        "Google連携が必要です。設定画面からGoogleアカウントを連携してください。",
        400
      );
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken(user.google_refresh_token);

    // Format times for Google Calendar (ISO8601)
    const startTime = new Date(booking.start_at).toISOString();
    const endTime = new Date(booking.end_at).toISOString();

    // Create event summary
    const summary = `${booking.guest_name} との予約`;

    // Create calendar event with Meet
    const meetUrl = await createCalendarEventWithMeet(
      accessToken,
      summary,
      startTime,
      endTime
    );

    // Update booking with meeting URL
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ meeting_url: meetUrl })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Booking update error:", updateError.message);
      // Meet was created, return URL anyway
    }

    return jsonResponse({
      meeting_url: meetUrl,
    });
  } catch (error) {
    console.error("Error creating Google Meet:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
