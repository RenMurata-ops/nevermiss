# CLAUDE.md - Nevermiss開発ガイド

## プロジェクト概要

**Nevermiss** - TimeRex/Jicooライクな個人向けスケジュール予約ツール

### コア機能
- 独自カレンダー（Googleカレンダー非連携）
- 予約URL発行・共有
- Zoom / Google Meet / オンサイト対応
- 複数デバイス同期（iMac / MacBook / iPhone）
- PDF出力（月単位ガントチャート）
- プッシュ通知
- Apple Watch連携

### 将来拡張（UIには現状反映しないがデータ構造には含める）
- チーム機能（組織ID、ロール）
- 課金機能（プランフィールド）

---

## 技術スタック（固定・変更禁止）

```yaml
Frontend:
  framework: React 18
  language: TypeScript 5.x
  styling: Tailwind CSS 3.x
  state: React useState / useReducer のみ（外部ライブラリ禁止）

Desktop (macOS):
  framework: Tauri 2

Mobile (iOS):
  framework: React Native + Expo
  distribution: Ad Hoc（初期）→ App Store（将来）

Backend:
  platform: Supabase
  database: PostgreSQL（Supabase管理）
  auth: Supabase Auth
  realtime: Supabase Realtime
  functions: Supabase Edge Functions

Hosting:
  frontend: Vercel
  backend: Supabase

External APIs:
  - Zoom API（Server-to-Server OAuth）
  - Google Calendar API（Meetリンク生成専用）

PDF:
  library: "@react-pdf/renderer"

Push Notifications:
  ios: Expo Notifications + APNs
  macos: Tauri native notifications
```

---

## 絶対的制約（違反禁止）

### 1. 状態管理
```
許可: useState, useReducer, useContext
禁止: Redux, Zustand, Jotai, MobX, Recoil, その他全て
```

### 2. スタイリング
```
許可: Tailwind CSS クラスのみ
禁止: styled-components, CSS Modules, Emotion, インラインstyle属性
```

### 3. カラーパレット（ライトモード）
```css
--background: white
--foreground: slate-900
--muted: slate-100
--muted-foreground: slate-500
--accent: slate-900
--accent-foreground: white
--border: slate-200
--highlight-today: blue-500（当日ハイライト用）
--danger: red-500（キャンセル・エラー用）
```

### 4. カラーパレット（ダークモード）
```css
--background: slate-950
--foreground: slate-50
--muted: slate-800
--muted-foreground: slate-400
--accent: slate-50
--accent-foreground: slate-900
--border: slate-700
--highlight-today: blue-400
--danger: red-400
```

### 5. デザイントークン
```
角丸: rounded-2xl（カード）, rounded-full（ボタン・バッジ）
シャドウ: shadow-sm のみ
フォント: システムフォント（追加フォント禁止）
アイコン: Lucide React のみ
```

### 6. 外部ライブラリ制限
```
許可:
  - @supabase/supabase-js
  - @react-pdf/renderer
  - lucide-react
  - date-fns（日付処理）
  - zod（バリデーション）
  - react-router-dom（Web）
  - @react-navigation/native（React Native）
  - expo-notifications
  - expo-secure-store

禁止:
  - 上記以外の全てのnpmパッケージ（追加前に必ず確認）
  - ガントチャート系ライブラリ（自作必須）
  - カレンダーUIライブラリ（自作必須）
```

---

## ファイル構成（確定）

```
nevermiss/
├── apps/
│   ├── web/                    # Vercelデプロイ用（公開予約ページ）
│   ├── desktop/                # Tauri（macOS）
│   └── mobile/                 # React Native + Expo（iOS）
│
├── packages/
│   ├── ui/                     # 共通UIコンポーネント
│   │   └── src/
│   │       └── components/     # 下記「コンポーネント一覧」参照
│   ├── core/                   # ビジネスロジック
│   │   └── src/
│   │       ├── hooks/
│   │       ├── utils/
│   │       └── types/
│   └── supabase/               # Supabase設定・型定義
│       └── src/
│           ├── client.ts
│           ├── types.ts
│           └── migrations/
│
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── create-zoom-meeting/
│   │   ├── create-google-meet/
│   │   └── send-push-notification/
│   └── migrations/             # DBマイグレーション
│
└── docs/
    ├── CLAUDE.md               # このファイル
    ├── DATABASE.md             # DB設計書
    └── API.md                  # API設計書
```

---

## コンポーネント一覧（これ以外の作成禁止）

### レイアウト系（3）
```
Layout.tsx              # 全画面共通レイアウト
BottomNav.tsx           # モバイル用ボトムナビゲーション（3タブ: Home/URL/Settings）
Sidebar.tsx             # デスクトップ用サイドバー
```

### 認証系（4）
```
AuthForm.tsx            # ログイン/新規登録フォーム（切り替え式）
PasswordResetForm.tsx   # パスワードリセット
EmailVerification.tsx   # メール認証待ち画面
GoogleAuthButton.tsx    # Googleログインボタン
```

### ダッシュボード系（4）
```
GanttChart.tsx          # ガントチャート本体
GanttRow.tsx            # ガントチャートの1行（1日分）
GanttBlock.tsx          # 予約ブロック（1件）
BookingDetailModal.tsx  # 予約詳細モーダル
```

### 予約URL発行系（3）
```
BookingURLList.tsx      # 発行済みURL一覧
BookingURLForm.tsx      # 新規URL発行フォーム
BookingURLCard.tsx      # URL1件のカード表示
```

### 公開予約ページ系（5）
```
PublicBookingPage.tsx   # 公開予約ページ本体
TimeSlotPicker.tsx      # 時間枠選択UI
BookingConfirmForm.tsx  # 予約確認フォーム（名前入力）
BookingComplete.tsx     # 予約完了画面（URL表示）
BookingExpired.tsx      # 期限切れ画面
```

### キャンセル系（2）
```
CancelConfirm.tsx       # キャンセル確認画面
CancelComplete.tsx      # キャンセル完了画面
```

### 設定系（3）
```
SettingsPage.tsx        # 設定画面本体
ThemeToggle.tsx         # ダークモード切り替え
NotificationSettings.tsx # 通知設定
```

### PDF系（2）
```
PDFExportButton.tsx     # PDF出力ボタン
PDFDocument.tsx         # PDF本体（@react-pdf/renderer）
```

### 通知系（2）
```
NotificationBadge.tsx   # バッジ表示
NotificationList.tsx    # 通知一覧
```

### 共通UI（5）
```
Button.tsx              # ボタン
Input.tsx               # 入力フィールド
Modal.tsx               # モーダル
Card.tsx                # カード
LoadingSpinner.tsx      # ローディング
```

### Apple Watch（別リポジトリまたはネイティブ拡張）
```
※ React Nativeから WatchConnectivity で連携
※ WatchOS側は Swift で別途実装
```

**合計: 33コンポーネント（これ以上追加禁止）**

---

## ページ一覧（これ以外の作成禁止）

### 認証済みユーザー用（5）
```
/dashboard              # ダッシュボード（ガントチャート）
/booking-urls           # 予約URL管理
/booking-urls/new       # 新規URL発行
/settings               # 設定
/notifications          # 通知一覧
```

### 認証ページ（4）
```
/login                  # ログイン
/register               # 新規登録
/reset-password         # パスワードリセット
/verify-email           # メール認証待ち
```

### 公開ページ（4）
```
/b/[slug]               # 公開予約ページ
/b/[slug]/complete      # 予約完了
/b/[slug]/cancel/[id]   # キャンセル確認
/b/[slug]/cancel/[id]/complete  # キャンセル完了
```

**合計: 13ページ（これ以上追加禁止）**

---

## データベース設計

### テーブル一覧

```sql
-- ユーザー
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization_id UUID,          -- 将来のチーム機能用
  role TEXT DEFAULT 'member',    -- 将来のチーム機能用（admin/member）
  plan TEXT DEFAULT 'free',      -- 将来の課金用（free/pro/enterprise）
  google_refresh_token TEXT,     -- Google Meet用
  zoom_credentials JSONB,        -- Zoom用
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 組織（将来用、現状は使用しない）
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ
)

-- 予約URL
booking_urls (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  slug TEXT UNIQUE NOT NULL,     -- 公開URL用スラッグ
  title TEXT NOT NULL,           -- 「初回相談」など
  duration_minutes INT NOT NULL, -- 30/60/90/120
  meeting_type TEXT NOT NULL,    -- zoom/google_meet/onsite
  location_address TEXT,         -- オンサイトの場合の住所
  available_days INT[],          -- 曜日（0-6、0=日曜）
  available_start_time TIME,     -- 開始時間
  available_end_time TIME,       -- 終了時間
  min_notice_hours INT,          -- 何時間前まで予約可
  max_days_ahead INT,            -- 何日先まで予約可
  expires_at TIMESTAMPTZ,        -- URL有効期限
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 予約
bookings (
  id UUID PRIMARY KEY,
  booking_url_id UUID REFERENCES booking_urls,
  user_id UUID REFERENCES users, -- 予約を受けるユーザー
  guest_name TEXT NOT NULL,      -- 予約者名
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,              -- Zoom/Meet URL
  meeting_type TEXT NOT NULL,
  location_address TEXT,
  status TEXT DEFAULT 'confirmed', -- confirmed/cancelled
  cancelled_at TIMESTAMPTZ,
  cancel_deadline TIMESTAMPTZ,   -- キャンセル期限（3日前）
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 通知
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  type TEXT NOT NULL,            -- new_booking/booking_cancelled
  booking_id UUID REFERENCES bookings,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
)

-- プッシュ通知トークン
push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,        -- ios/macos
  created_at TIMESTAMPTZ
)
```

### Row Level Security（RLS）ポリシー

```sql
-- users: 自分のレコードのみ
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self ON users FOR ALL USING (auth.uid() = id);

-- booking_urls: 自分が作成したもののみ
ALTER TABLE booking_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_urls_owner ON booking_urls FOR ALL USING (auth.uid() = user_id);

-- bookings: 自分宛ての予約のみ（作成は誰でも可能）
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_owner ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bookings_insert ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY bookings_update ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- notifications: 自分宛てのみ
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_owner ON notifications FOR ALL USING (auth.uid() = user_id);
```

---

## API設計（Supabase Edge Functions）

### 1. create-zoom-meeting
```
POST /functions/v1/create-zoom-meeting
Body: { booking_id: string }
Response: { meeting_url: string }
```

### 2. create-google-meet
```
POST /functions/v1/create-google-meet
Body: { booking_id: string }
Response: { meeting_url: string }
```

### 3. send-push-notification
```
POST /functions/v1/send-push-notification
Body: { user_id: string, type: 'new_booking' | 'booking_cancelled', booking_id: string }
Response: { success: boolean }
```

---

## ガントチャート仕様

### 表示モード
- **週表示**: 7日間（横スクロール不要）
- **月表示**: 当月全日（横スクロール可能）

### 時間軸
- 0:00〜24:00（1時間単位の目盛り）
- 1時間 = 60px幅

### 日跨ぎ予約
- 23:00-01:00 の場合、2行に分割表示
  - 1日目: 23:00-24:00
  - 2日目: 00:00-01:00

### 当日ハイライト
- 当日の行: `bg-blue-50`（ライト）/ `bg-blue-950`（ダーク）
- 現在時刻: 赤い縦線（`border-red-500`、リアルタイム更新）

### 予約ブロック
```tsx
<div className="bg-slate-900 dark:bg-slate-100 rounded-lg px-2 py-1 text-white dark:text-slate-900 text-xs truncate">
  {title}
</div>
```

---

## PDF出力仕様

### フォーマット
- A4縦向き
- 月単位（1ページ = 1ヶ月）
- ガントチャート形式

### ファイル名
```
Nevermiss_2026_01.pdf
Nevermiss_2026_02.pdf
```

### 内容
- ヘッダー: アプリ名 + 年月
- 縦軸: 日付（1〜31）
- 横軸: 時間（0〜24）
- 予約ブロック: 開始-終了時間 + 予約者名

---

## キャンセル仕様

- キャンセル可能期限: 予約日の**3日前 23:59:59**まで
- キャンセル時の処理:
  1. bookings.status を 'cancelled' に更新
  2. bookings.cancelled_at を現在時刻に設定
  3. notifications に 'booking_cancelled' を追加
  4. プッシュ通知送信
  5. キャンセル完了画面表示

---

## 開発フェーズ

### Phase 1: 基盤構築（Week 1-2）
- [ ] Supabaseプロジェクト作成
- [ ] DBマイグレーション実行
- [ ] 認証実装（メール+パスワード、Google）
- [ ] 共通UIコンポーネント作成

### Phase 2: ダッシュボード（Week 3-4）
- [ ] ガントチャート実装
- [ ] 週/月表示切り替え
- [ ] 当日ハイライト
- [ ] 予約詳細モーダル

### Phase 3: 予約URL発行（Week 5-6）
- [ ] URL発行フォーム
- [ ] URL一覧表示
- [ ] 公開予約ページ
- [ ] 時間枠選択UI

### Phase 4: 会議ツール連携（Week 7-8）
- [ ] Zoom API連携
- [ ] Google Calendar API連携（Meetリンク生成）
- [ ] オンサイト対応
- [ ] 予約完了画面

### Phase 5: 通知・キャンセル（Week 9-10）
- [ ] プッシュ通知設定
- [ ] バッジ通知
- [ ] キャンセル機能
- [ ] 通知一覧

### Phase 6: PDF・ダークモード（Week 11）
- [ ] PDF出力
- [ ] ダークモード対応

### Phase 7: ネイティブアプリ化（Week 12-14）
- [ ] Tauri（macOS）ビルド
- [ ] React Native（iOS）ビルド
- [ ] Ad Hoc配布設定

### Phase 8: Apple Watch（Week 15-16）
- [ ] WatchOS拡張実装
- [ ] 予定一覧表示
- [ ] カウントダウン
- [ ] 通知連携

---

## 禁止事項チェックリスト

実装前に必ず確認:

- [ ] 新規コンポーネント作成していないか？（33個固定）
- [ ] 新規ページ作成していないか？（13ページ固定）
- [ ] 許可されていない npm パッケージを追加していないか？
- [ ] Tailwind以外のスタイリング使用していないか？
- [ ] 指定カラーパレット以外使用していないか？
- [ ] 外部状態管理ライブラリ導入していないか？
- [ ] 「あったら便利」機能を追加していないか？
- [ ] Googleカレンダーの予定を表示しようとしていないか？（Meetリンク生成専用）

---

## コマンド

```bash
# 開発サーバー（Web）
cd apps/web && npm run dev

# 開発サーバー（モバイル）
cd apps/mobile && npx expo start

# デスクトップビルド（Tauri）
cd apps/desktop && npm run tauri build

# iOSビルド
cd apps/mobile && eas build --platform ios --profile development

# Supabase ローカル開発
supabase start
supabase db reset

# 型生成
supabase gen types typescript --local > packages/supabase/src/types.ts

# デプロイ（Vercel）
vercel --prod
```

---

## 最重要原則

> **「シンプルさは機能である」**
>
> 何かを追加したくなったら、それは設計ミスの兆候。
> 既存の33コンポーネント・13ページで解決できないか再考せよ。
>
> **「Googleカレンダーは見えない」**
>
> ユーザーに見えるのはNevermiss独自カレンダーのみ。
> Google Calendar APIはMeetリンク生成のためだけにバックグラウンドで動作する。
