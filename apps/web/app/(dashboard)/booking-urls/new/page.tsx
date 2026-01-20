"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BookingURLForm,
  Button,
  Card,
  LoadingSpinner,
  type BookingURLFormData,
} from "@nevermiss/ui";
import { useAuth, useBookingURLs } from "@nevermiss/core";
import type { BookingURL, BookingURLRow } from "@nevermiss/supabase";

function BookingURLFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    createBookingURL,
    updateBookingURL,
    getBookingURLBySlug,
  } = useBookingURLs();

  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [existingData, setExistingData] = useState<BookingURL | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  // Fetch existing data for edit mode
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!editId) return;

      setIsFetching(true);
      try {
        // We need to fetch by ID, but we only have getBookingURLBySlug
        // Let's use Supabase client directly for this case
        const { createClient } = await import("@nevermiss/supabase");
        const supabase = createClient();

        const { data, error } = await supabase
          .from("booking_urls")
          .select("*")
          .eq("id", editId)
          .single();

        if (error || !data) {
          console.error("Error fetching booking URL:", error?.message);
          return;
        }

        const row = data as BookingURLRow;
        setExistingData({
          id: row.id,
          userId: row.user_id,
          slug: row.slug,
          title: row.title,
          durationMinutes: row.duration_minutes,
          meetingType: row.meeting_type as BookingURL["meetingType"],
          locationAddress: row.location_address,
          availableDays: row.available_days,
          availableStartTime: row.available_start_time,
          availableEndTime: row.available_end_time,
          minNoticeHours: row.min_notice_hours,
          maxDaysAhead: row.max_days_ahead,
          expiresAt: row.expires_at ? new Date(row.expires_at) : null,
          isActive: row.is_active,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchExistingData();
  }, [editId]);

  // Convert existing data to form data
  const initialFormData: Partial<BookingURLFormData> | undefined = existingData
    ? {
        title: existingData.title,
        durationMinutes: existingData.durationMinutes,
        meetingType: existingData.meetingType,
        locationAddress: existingData.locationAddress || undefined,
        availableDays: existingData.availableDays,
        availableStartTime: existingData.availableStartTime,
        availableEndTime: existingData.availableEndTime,
        minNoticeHours: existingData.minNoticeHours,
        maxDaysAhead: existingData.maxDaysAhead,
        expiresAt: existingData.expiresAt
          ? existingData.expiresAt.toISOString().split("T")[0]
          : undefined,
      }
    : undefined;

  // Handle form submit
  const handleSubmit = async (data: BookingURLFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      if (isEditMode && editId) {
        // Update existing
        const result = await updateBookingURL(editId, {
          title: data.title,
          durationMinutes: data.durationMinutes,
          meetingType: data.meetingType,
          locationAddress: data.locationAddress || null,
          availableDays: data.availableDays,
          availableStartTime: data.availableStartTime,
          availableEndTime: data.availableEndTime,
          minNoticeHours: data.minNoticeHours,
          maxDaysAhead: data.maxDaysAhead,
          expiresAt: data.expiresAt || null,
        });

        if (result) {
          router.push("/booking-urls");
        }
      } else {
        // Create new
        const result = await createBookingURL(user.id, {
          title: data.title,
          durationMinutes: data.durationMinutes,
          meetingType: data.meetingType,
          locationAddress: data.locationAddress || null,
          availableDays: data.availableDays,
          availableStartTime: data.availableStartTime,
          availableEndTime: data.availableEndTime,
          minNoticeHours: data.minNoticeHours,
          maxDaysAhead: data.maxDaysAhead,
          expiresAt: data.expiresAt || null,
        });

        if (result) {
          router.push("/booking-urls");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/booking-urls");
  };

  // Show loading while fetching existing data
  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            戻る
          </Button>
        </div>
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" label="読み込み中..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          戻る
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {isEditMode ? "予約URLを編集" : "予約URLを作成"}
        </h1>
      </div>

      {/* Form */}
      <Card variant="default" padding="lg">
        <BookingURLForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function BookingURLNewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" label="読み込み中..." />
            </div>
          </Card>
        </div>
      }
    >
      <BookingURLFormPage />
    </Suspense>
  );
}
