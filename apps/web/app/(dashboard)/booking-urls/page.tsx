"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Link } from "lucide-react";
import {
  BookingURLList,
  Button,
  Card,
  Modal,
  type BookingURLData,
} from "@nevermiss/ui";
import { useAuth, useBookingURLs } from "@nevermiss/core";

export default function BookingURLsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    bookingURLs,
    loading,
    error,
    fetchBookingURLs,
    deleteBookingURL,
  } = useBookingURLs();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch booking URLs when user is available
  useEffect(() => {
    if (user?.id) {
      fetchBookingURLs(user.id);
    }
  }, [user?.id, fetchBookingURLs]);

  // Handle create new
  const handleCreate = () => {
    router.push("/booking-urls/new");
  };

  // Handle edit
  const handleEdit = (url: BookingURLData) => {
    router.push(`/booking-urls/new?id=${url.id}`);
  };

  // Handle delete click (open confirmation)
  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteBookingURL(deleteTarget);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  // Convert BookingURL to BookingURLData for UI component
  const urlsForList: BookingURLData[] = bookingURLs.map((url) => ({
    id: url.id,
    slug: url.slug,
    title: url.title,
    durationMinutes: url.durationMinutes,
    meetingType: url.meetingType,
    locationAddress: url.locationAddress,
    availableDays: url.availableDays,
    availableStartTime: url.availableStartTime,
    availableEndTime: url.availableEndTime,
    isActive: url.isActive,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          予約URL管理
        </h1>

        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          新規作成
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card variant="default" padding="md">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </Card>
      )}

      {/* Booking URL List */}
      <BookingURLList
        urls={urlsForList}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onCreate={handleCreate}
        isLoading={loading}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        title="予約URLを削除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            この予約URLを削除してもよろしいですか？
            削除後、このURLからの新規予約はできなくなります。
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              削除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
