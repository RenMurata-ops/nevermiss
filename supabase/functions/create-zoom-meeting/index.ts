// ==============================================
// Supabase Edge Function: create-zoom-meeting
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

// Get Zoom access token via Server-to-Server OAuth
async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");
  const clientId = Deno.env.get("ZOOM_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET");

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "account_credentials",
      account_id: accountId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom OAuth error:", errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create Zoom meeting
async function createZoomMeeting(
  accessToken: string,
  topic: string,
  startTime: string,
  durationMinutes: number
): Promise<{ join_url: string; id: number }> {
  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration: durationMinutes,
      timezone: "Asia/Tokyo",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: "none",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom API error:", errorText);
    throw new Error(`Failed to create Zoom meeting: ${response.status}`);
  }

  const data = await response.json();
  return {
    join_url: data.join_url,
    id: data.id,
  };
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

    // Check if meeting_type is zoom
    if (booking.meeting_type !== "zoom") {
      return errorResponse("This booking does not require a Zoom meeting");
    }

    // Fetch booking URL for title and duration
    const { data: bookingUrl, error: urlError } = await supabase
      .from("booking_urls")
      .select("title, duration_minutes")
      .eq("id", booking.booking_url_id)
      .single();

    if (urlError || !bookingUrl) {
      console.error("Booking URL fetch error:", urlError?.message);
      return errorResponse("Booking URL not found", 404);
    }

    // Fetch user's zoom credentials (for future per-user OAuth)
    // Currently using environment variables
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("zoom_credentials")
      .eq("id", booking.user_id)
      .single();

    if (userError) {
      console.error("User fetch error:", userError.message);
      // Continue with env credentials
    }

    // TODO: Use user's zoom_credentials if available
    // const userZoomCredentials = user?.zoom_credentials;

    // Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // Format start time for Zoom (ISO8601)
    const startTime = new Date(booking.start_at).toISOString();

    // Create meeting topic
    const topic = `${bookingUrl.title} - ${booking.guest_name}`;

    // Create Zoom meeting
    const meeting = await createZoomMeeting(
      accessToken,
      topic,
      startTime,
      bookingUrl.duration_minutes
    );

    // Update booking with meeting URL
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ meeting_url: meeting.join_url })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Booking update error:", updateError.message);
      // Meeting was created, return URL anyway
    }

    return jsonResponse({
      meeting_url: meeting.join_url,
      meeting_id: meeting.id,
    });
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
