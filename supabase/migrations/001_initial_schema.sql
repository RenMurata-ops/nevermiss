-- Nevermiss Initial Schema
-- Based on CLAUDE.md Database Design

-- ============================================
-- 1. Helper Functions
-- ============================================

-- updated_at自動更新用のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Tables
-- ============================================

-- 組織（将来用、現状は使用しない）
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ユーザー（auth.usersと連携）
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member',
  plan TEXT NOT NULL DEFAULT 'free',
  google_refresh_token TEXT,
  zoom_credentials JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 予約URL
CREATE TABLE booking_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('zoom', 'google_meet', 'onsite')),
  location_address TEXT,
  available_days INT[] NOT NULL CHECK (array_length(available_days, 1) > 0),
  available_start_time TIME NOT NULL,
  available_end_time TIME NOT NULL,
  min_notice_hours INT NOT NULL DEFAULT 24,
  max_days_ahead INT NOT NULL DEFAULT 30,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (available_start_time < available_end_time),
  CONSTRAINT valid_days CHECK (
    available_days <@ ARRAY[0,1,2,3,4,5,6]::INT[]
  )
);

-- 予約
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_url_id UUID NOT NULL REFERENCES booking_urls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('zoom', 'google_meet', 'onsite')),
  location_address TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  cancel_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_booking_time CHECK (start_at < end_at)
);

-- 通知
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_booking', 'booking_cancelled')),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- プッシュ通知トークン
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'macos')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, token)
);

-- ============================================
-- 3. Indexes
-- ============================================

-- users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- booking_urls
CREATE INDEX idx_booking_urls_user_id ON booking_urls(user_id);
CREATE INDEX idx_booking_urls_slug ON booking_urls(slug);
CREATE INDEX idx_booking_urls_is_active ON booking_urls(is_active);

-- bookings
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_booking_url_id ON bookings(booking_url_id);
CREATE INDEX idx_bookings_start_at ON bookings(start_at);
CREATE INDEX idx_bookings_status ON bookings(status);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- push_tokens
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- ============================================
-- 4. Triggers for updated_at
-- ============================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_urls_updated_at
  BEFORE UPDATE ON booking_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies
-- ============================================

-- organizations: 将来用（現状は管理者のみ）
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = organizations.id
    )
  );

-- users: 自分のレコードのみ
CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_delete ON users
  FOR DELETE USING (auth.uid() = id);

-- booking_urls: 自分が作成したもののみ（公開URLは別途）
CREATE POLICY booking_urls_select_owner ON booking_urls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY booking_urls_select_public ON booking_urls
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY booking_urls_insert ON booking_urls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY booking_urls_update ON booking_urls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY booking_urls_delete ON booking_urls
  FOR DELETE USING (auth.uid() = user_id);

-- bookings: 自分宛ての予約の閲覧・更新、ゲストは作成可能
CREATE POLICY bookings_select ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY bookings_insert ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY bookings_update ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- notifications: 自分宛てのみ
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- push_tokens: 自分のトークンのみ
CREATE POLICY push_tokens_select ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_tokens_insert ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_update ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY push_tokens_delete ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. Functions for Auth Trigger
-- ============================================

-- 新規ユーザー登録時にusersテーブルにレコードを自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersにトリガーを設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
