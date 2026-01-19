"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@nevermiss/supabase";
import {
  SettingsPage,
  LoadingSpinner,
  Card,
  type Theme,
  type SettingsUser,
} from "@nevermiss/ui";
import { useAuth } from "@nevermiss/core";

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
  const supabase = createClient();

  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [settingsUser, setSettingsUser] = useState<SettingsUser | null>(null);

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

  // Fetch user data including google_refresh_token
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
        setSettingsUser({
          id: data.id,
          email: data.email,
          name: data.name,
          googleRefreshToken: data.google_refresh_token,
        });
      }
    };

    fetchUserData();
  }, [user?.id, supabase]);

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
  const handleGoogleConnect = useCallback(async () => {
    setIsConnectingGoogle(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar.events",
          redirectTo: `${window.location.origin}/settings`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error.message);
      }
    } catch (err) {
      console.error("Google connect error:", err);
    } finally {
      setIsConnectingGoogle(false);
    }
  }, [supabase]);

  // Handle Google disconnect
  const handleGoogleDisconnect = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ google_refresh_token: null })
        .eq("id", user.id);

      if (error) {
        console.error("Google disconnect error:", error.message);
        return;
      }

      // Update local state
      setSettingsUser((prev) =>
        prev ? { ...prev, googleRefreshToken: null } : null
      );
    } catch (err) {
      console.error("Google disconnect error:", err);
    }
  }, [user?.id, supabase]);

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

  return (
    <SettingsPage
      user={settingsUser}
      currentTheme={currentTheme}
      notificationsEnabled={notificationsEnabled}
      onThemeChange={handleThemeChange}
      onNotificationChange={handleNotificationChange}
      onGoogleConnect={handleGoogleConnect}
      onGoogleDisconnect={handleGoogleDisconnect}
      isConnectingGoogle={isConnectingGoogle}
    />
  );
}
