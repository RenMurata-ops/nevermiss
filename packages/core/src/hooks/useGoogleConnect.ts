import { useState, useCallback, useMemo } from "react";
import { getSupabase } from "@nevermiss/supabase";

// ==============================================
// Types
// ==============================================

export interface UseGoogleConnectState {
  isConnected: boolean;
  loading: boolean;
}

export interface UseGoogleConnectReturn extends UseGoogleConnectState {
  connectGoogle: () => void;
  disconnectGoogle: (userId: string) => Promise<boolean>;
  checkConnection: (userId: string) => Promise<boolean>;
}

// ==============================================
// Hook
// ==============================================

export function useGoogleConnect(): UseGoogleConnectReturn {
  const [state, setState] = useState<UseGoogleConnectState>({
    isConnected: false,
    loading: false,
  });

  const supabase = useMemo(() => getSupabase(), []);

  // Check if user has Google connected
  const checkConnection = useCallback(
    async (userId: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const { data, error } = await supabase
          .from("users")
          .select("google_refresh_token")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Check connection error:", error.message);
          setState({ isConnected: false, loading: false });
          return false;
        }

        const isConnected = !!data?.google_refresh_token;
        setState({ isConnected, loading: false });
        return isConnected;
      } catch (err) {
        console.error("Check connection error:", err);
        setState({ isConnected: false, loading: false });
        return false;
      }
    },
    [supabase]
  );

  // Start Google OAuth flow by redirecting to API route
  const connectGoogle = useCallback(() => {
    // Redirect to the API route that handles OAuth
    window.location.href = "/api/auth/google";
  }, []);

  // Disconnect Google by removing refresh token
  const disconnectGoogle = useCallback(
    async (userId: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const { error } = await supabase
          .from("users")
          .update({ google_refresh_token: null })
          .eq("id", userId);

        if (error) {
          console.error("Disconnect Google error:", error.message);
          setState((prev) => ({ ...prev, loading: false }));
          return false;
        }

        setState({ isConnected: false, loading: false });
        return true;
      } catch (err) {
        console.error("Disconnect Google error:", err);
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }
    },
    [supabase]
  );

  return {
    ...state,
    connectGoogle,
    disconnectGoogle,
    checkConnection,
  };
}
