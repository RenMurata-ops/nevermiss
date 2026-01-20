"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, type UserRow } from "@nevermiss/supabase";
import {
  SettingsPage,
  LoadingSpinner,
  Card,
  type Theme,
  type SettingsUser,
} from "@nevermiss/ui";
import { useAuth, useGoogleConnect } from "@nevermiss/core";

// ==============================================
// Theme utilities
// ==============================================

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem("theme", theme);
}

// ==============================================
// Notification utilities
// ==============================================

function getNotificationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("notificationsEnabled");
  return stored === null ? true : stored === "true";
}

function setNotificationEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("notificationsEnabled", String(enabled));
}

// ==============================================
// Component
// ==============================================

export default function SettingsPageRoute() {
  const { user, loading: authLoading } = useAuth();
  const {
    isConnected: isGoogleConnected,
    loading: googleLoading,
    connectGoogle,
    disconnectGoogle,
    checkConnection,
  } = useGoogleConnect();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settingsUser, setSettingsUser] = useState<SettingsUser | null>(null);

  // Check for Google connection success/error from callback
  useEffect(() => {
    const googleConnected = searchParams.get("google_connected");
    const error = searchParams.get("error");

    if (googleConnected === "true" && user?.id) {
      // Refresh connection status
      checkConnection(user.id);
    }

    if (error) {
      console.error("Google OAuth error:", error);
    }
  }, [searchParams, user?.id, checkConnection]);

  // Initialize theme and notifications from localStorage
  useEffect(() => {
    setCurrentTheme(getStoredTheme());
    setNotificationsEnabled(getNotificationEnabled());

    // Apply initial theme
    applyTheme(getStoredTheme());

    // Listen for system theme changes when using "system" theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Fetch user data and check Google connection
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, google_refresh_token")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }

      if (data) {
        const row = data as Pick<UserRow, "id" | "email" | "name" | "google_refresh_token">;
        setSettingsUser({
          id: row.id,
          email: row.email,
          name: row.name,
          googleRefreshToken: row.google_refresh_token,
        });

        // Check Google connection status
        checkConnection(user.id);
      }
    };

    fetchUserData();
  }, [user?.id, supabase, checkConnection]);

  // Handle theme change
  const handleThemeChange = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  }, []);

  // Handle notification change
  const handleNotificationChange = useCallback((enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setNotificationEnabled(enabled);

    // Request notification permission if enabling
    if (enabled && typeof Notification !== "undefined") {
      Notification.requestPermission();
    }
  }, []);

  // Handle Google connect
  const handleGoogleConnect = useCallback(() => {
    connectGoogle();
  }, [connectGoogle]);

  // Handle Google disconnect
  const handleGoogleDisconnect = useCallback(async () => {
    if (!user?.id) return;

    const success = await disconnectGoogle(user.id);
    if (success) {
      // Update local settings user state
      setSettingsUser((prev) =>
        prev ? { ...prev, googleRefreshToken: null } : null
      );
    }
  }, [user?.id, disconnectGoogle]);

  // Loading state
  if (authLoading || !settingsUser) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" label="読み込み中..." />
        </div>
      </Card>
    );
  }

  // Update settingsUser with current connection status
  const displayUser: SettingsUser = {
    ...settingsUser,
    googleRefreshToken: isGoogleConnected ? "connected" : null,
  };

  return (
    <SettingsPage
      user={displayUser}
      currentTheme={currentTheme}
      notificationsEnabled={notificationsEnabled}
      onThemeChange={handleThemeChange}
      onNotificationChange={handleNotificationChange}
      onGoogleConnect={handleGoogleConnect}
      onGoogleDisconnect={handleGoogleDisconnect}
      isConnectingGoogle={googleLoading}
    />
  );
}
