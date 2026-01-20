import { useState, useEffect, useCallback } from "react";
import { createClient } from "@nevermiss/supabase";
import type { Notification, NotificationRow, NotificationType } from "@nevermiss/supabase";

// ==============================================
// Types
// ==============================================

export interface UseNotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface UseNotificationsReturn extends UseNotificationsState {
  fetchNotifications: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: (userId: string) => Promise<boolean>;
  unsubscribe: () => void;
}

// ==============================================
// Helper: Convert DB row to Notification type
// ==============================================

function mapRowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    bookingId: row.booking_id,
    isRead: row.is_read,
    createdAt: new Date(row.created_at),
  };
}

// ==============================================
// Hook
// ==============================================

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });

  const supabase = createClient();
  let subscription: ReturnType<typeof supabase.channel> | null = null;

  // Calculate unread count from notifications
  const calculateUnreadCount = (notifications: Notification[]): number => {
    return notifications.filter((n) => !n.isRead).length;
  };

  // Fetch notifications for user
  const fetchNotifications = useCallback(
    async (userId: string): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return;
        }

        const notifications = (data || []).map(mapRowToNotification);
        setState({
          notifications,
          unreadCount: calculateUnreadCount(notifications),
          loading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "通知の取得に失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    },
    [supabase]
  );

  // Subscribe to realtime notifications
  const subscribeToNotifications = useCallback(
    (userId: string) => {
      subscription = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = mapRowToNotification(
              payload.new as NotificationRow
            );
            setState((prev) => {
              const updated = [newNotification, ...prev.notifications];
              return {
                ...prev,
                notifications: updated,
                unreadCount: calculateUnreadCount(updated),
              };
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedNotification = mapRowToNotification(
              payload.new as NotificationRow
            );
            setState((prev) => {
              const updated = prev.notifications.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              );
              return {
                ...prev,
                notifications: updated,
                unreadCount: calculateUnreadCount(updated),
              };
            });
          }
        )
        .subscribe();
    },
    [supabase]
  );

  // Unsubscribe from realtime
  const unsubscribe = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
  }, [supabase]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notificationId);

        if (error) {
          console.error("Mark as read error:", error.message);
          return false;
        }

        // Update local state
        setState((prev) => {
          const updated = prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          return {
            ...prev,
            notifications: updated,
            unreadCount: calculateUnreadCount(updated),
          };
        });

        return true;
      } catch (err) {
        console.error("Mark as read error:", err);
        return false;
      }
    },
    [supabase]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", userId)
          .eq("is_read", false);

        if (error) {
          console.error("Mark all as read error:", error.message);
          return false;
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        }));

        return true;
      } catch (err) {
        console.error("Mark all as read error:", err);
        return false;
      }
    },
    [supabase]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    ...state,
    fetchNotifications,
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
    unsubscribe,
  };
}
