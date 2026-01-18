"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, LoadingSpinner } from "@nevermiss/ui";
import { useAuth, useNotifications } from "@nevermiss/core";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const {
    unreadCount,
    fetchNotifications,
    subscribeToNotifications,
    unsubscribe,
  } = useNotifications();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Fetch and subscribe to notifications
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
      subscribeToNotifications(user.id);
      return () => unsubscribe();
    }
  }, [user?.id, fetchNotifications, subscribeToNotifications, unsubscribe]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const handleNotificationClick = () => {
    router.push("/notifications");
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" label="読み込み中..." />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <Layout
      currentPath={pathname}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onNotificationClick={handleNotificationClick}
      userName={user.name || undefined}
      notificationCount={unreadCount}
    >
      {children}
    </Layout>
  );
}
