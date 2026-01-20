-- ==============================================
-- Migration: 002_notification_trigger.sql
-- Description: Triggers for booking notifications
-- ==============================================

-- Enable pg_net extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ==============================================
-- Configuration: Store Edge Function URL and key
-- Use Supabase Vault in production for secure key storage
-- ==============================================

-- Create a config table for storing Edge Function settings
-- This avoids hardcoding sensitive values in triggers
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert configuration (update these values after deployment)
-- In production, use: SELECT vault.create_secret('service_role_key', 'your-key');
INSERT INTO app_config (key, value) VALUES
  ('supabase_url', 'YOUR_SUPABASE_URL'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO NOTHING;

-- ==============================================
-- Function: Insert notification record
-- This runs synchronously and is always reliable
-- ==============================================

CREATE OR REPLACE FUNCTION insert_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification record
  INSERT INTO notifications (user_id, type, booking_id, is_read)
  VALUES (NEW.user_id, TG_ARGV[0]::TEXT, NEW.id, FALSE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Function: Call Edge Function via pg_net (async)
-- This is fire-and-forget, errors don't affect the transaction
-- ==============================================

CREATE OR REPLACE FUNCTION call_notification_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  _supabase_url TEXT;
  _service_role_key TEXT;
  _notification_type TEXT;
  _request_id BIGINT;
BEGIN
  -- Get configuration
  SELECT value INTO _supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO _service_role_key FROM app_config WHERE key = 'service_role_key';

  -- Skip if not configured
  IF _supabase_url IS NULL OR _supabase_url = 'YOUR_SUPABASE_URL' THEN
    RAISE NOTICE 'Edge Function URL not configured, skipping push notification';
    RETURN NEW;
  END IF;

  -- Determine notification type from trigger argument
  _notification_type := TG_ARGV[0];

  -- Call Edge Function asynchronously via pg_net
  SELECT net.http_post(
    url := _supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'type', _notification_type,
      'booking_id', NEW.id
    )
  ) INTO _request_id;

  RAISE NOTICE 'Push notification request sent, request_id: %', _request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to call Edge Function: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Trigger: New booking notification
-- ==============================================

-- Insert notification record (synchronous, reliable)
CREATE TRIGGER trigger_booking_created_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION insert_booking_notification('new_booking');

-- Call Edge Function for push notification (async, best-effort)
CREATE TRIGGER trigger_booking_created_push
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION call_notification_edge_function('new_booking');

-- ==============================================
-- Trigger: Booking cancelled notification
-- ==============================================

-- Function to check if booking was just cancelled
CREATE OR REPLACE FUNCTION check_and_notify_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed to 'cancelled'
  IF OLD.status IS DISTINCT FROM 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Insert notification record
    INSERT INTO notifications (user_id, type, booking_id, is_read)
    VALUES (NEW.user_id, 'booking_cancelled', NEW.id, FALSE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to call Edge Function on cancellation
CREATE OR REPLACE FUNCTION call_cancellation_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  _supabase_url TEXT;
  _service_role_key TEXT;
  _request_id BIGINT;
BEGIN
  -- Only trigger if status changed to 'cancelled'
  IF OLD.status IS DISTINCT FROM 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Get configuration
    SELECT value INTO _supabase_url FROM app_config WHERE key = 'supabase_url';
    SELECT value INTO _service_role_key FROM app_config WHERE key = 'service_role_key';

    -- Skip if not configured
    IF _supabase_url IS NULL OR _supabase_url = 'YOUR_SUPABASE_URL' THEN
      RETURN NEW;
    END IF;

    -- Call Edge Function asynchronously
    SELECT net.http_post(
      url := _supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_role_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'type', 'booking_cancelled',
        'booking_id', NEW.id
      )
    ) INTO _request_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call Edge Function: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert notification record on cancellation
CREATE TRIGGER trigger_booking_cancelled_notification
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_and_notify_cancellation();

-- Call Edge Function on cancellation
CREATE TRIGGER trigger_booking_cancelled_push
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION call_cancellation_edge_function();

-- ==============================================
-- RLS Policy for app_config (admin only)
-- ==============================================

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access config
CREATE POLICY "Service role only" ON app_config
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

-- ==============================================
-- Setup Instructions
-- ==============================================

/*
After deploying this migration:

1. Update app_config with your actual values:

   UPDATE app_config
   SET value = 'https://YOUR-PROJECT-REF.supabase.co'
   WHERE key = 'supabase_url';

   UPDATE app_config
   SET value = 'YOUR-SERVICE-ROLE-KEY'
   WHERE key = 'service_role_key';

2. For production, use Supabase Vault instead:

   -- Store secret in vault
   SELECT vault.create_secret('service_role_key', 'YOUR-SERVICE-ROLE-KEY');

   -- Access in function
   SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key';

3. Alternative: Use Database Webhooks (Supabase Dashboard)

   - Go to Database > Webhooks
   - Create webhook for INSERT on bookings table
   - URL: https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-push-notification
   - Add Authorization header with service_role_key

   This is easier to manage and more secure than storing keys in the database.

4. Test the triggers:

   -- Insert a test booking (should create notification + send push)
   INSERT INTO bookings (booking_url_id, user_id, guest_name, start_at, end_at, meeting_type, status, cancel_deadline)
   VALUES ('...', '...', 'Test Guest', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'zoom', 'confirmed', NOW() + INTERVAL '1 day' - INTERVAL '3 days');

   -- Check notifications table
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
*/
