"use client";

import React, { useState, useEffect } from "react";
import { Video, MapPin } from "lucide-react";
import { Button } from "../Button";
import { Input } from "../Input";
import { Card } from "../Card";

export interface BookingURLFormData {
  title: string;
  durationMinutes: number;
  meetingType: "zoom" | "google_meet" | "onsite";
  locationAddress?: string;
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  minNoticeHours: number;
  maxDaysAhead: number;
  expiresAt?: string;
}

export interface BookingURLFormProps {
  initialData?: Partial<BookingURLFormData>;
  onSubmit: (data: BookingURLFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const durationOptions = [
  { value: 30, label: "30分" },
  { value: 60, label: "60分" },
  { value: 90, label: "90分" },
  { value: 120, label: "120分" },
];

const meetingTypeOptions = [
  { value: "zoom", label: "Zoom", icon: <Video className="w-4 h-4" /> },
  { value: "google_meet", label: "Google Meet", icon: <Video className="w-4 h-4" /> },
  { value: "onsite", label: "対面", icon: <MapPin className="w-4 h-4" /> },
];

const dayOptions = [
  { value: 0, label: "日" },
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
];

// Generate time options (00:00 - 23:30, 30min intervals)
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      options.push(
        `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
      );
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const defaultFormData: BookingURLFormData = {
  title: "",
  durationMinutes: 60,
  meetingType: "zoom",
  locationAddress: "",
  availableDays: [1, 2, 3, 4, 5], // 平日
  availableStartTime: "09:00",
  availableEndTime: "18:00",
  minNoticeHours: 24,
  maxDaysAhead: 30,
  expiresAt: "",
};

export function BookingURLForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BookingURLFormProps) {
  const [formData, setFormData] = useState<BookingURLFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = <K extends keyof BookingURLFormData>(
    field: K,
    value: BookingURLFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev) => {
      const days = prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day].sort();
      return { ...prev, availableDays: days };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "タイトルを入力してください";
    }

    if (formData.availableDays.length === 0) {
      newErrors.availableDays = "少なくとも1日選択してください";
    }

    if (formData.availableStartTime >= formData.availableEndTime) {
      newErrors.availableEndTime = "終了時間は開始時間より後にしてください";
    }

    if (formData.meetingType === "onsite" && !formData.locationAddress?.trim()) {
      newErrors.locationAddress = "場所を入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(formData);
  };

  const isEdit = !!initialData?.title;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="タイトル"
        placeholder="初回相談、ミーティングなど"
        value={formData.title}
        onChange={(e) => handleChange("title", e.target.value)}
        error={errors.title}
        fullWidth
        disabled={isLoading}
      />

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
          所要時間
        </label>
        <div className="flex flex-wrap gap-2">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange("durationMinutes", option.value)}
              disabled={isLoading}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${
                  formData.durationMinutes === option.value
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }
                disabled:opacity-50
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting Type */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
          会議タイプ
        </label>
        <div className="flex flex-wrap gap-2">
          {meetingTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                handleChange("meetingType", option.value as BookingURLFormData["meetingType"])
              }
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${
                  formData.meetingType === option.value
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }
                disabled:opacity-50
              `}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location Address (onsite only) */}
      {formData.meetingType === "onsite" && (
        <Input
          label="場所"
          placeholder="住所や場所の説明"
          value={formData.locationAddress || ""}
          onChange={(e) => handleChange("locationAddress", e.target.value)}
          error={errors.locationAddress}
          fullWidth
          disabled={isLoading}
        />
      )}

      {/* Available Days */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
          予約可能な曜日
        </label>
        <div className="flex flex-wrap gap-2">
          {dayOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDayToggle(option.value)}
              disabled={isLoading}
              className={`
                w-10 h-10 rounded-full text-sm font-medium transition-colors
                ${
                  formData.availableDays.includes(option.value)
                    ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }
                disabled:opacity-50
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.availableDays && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
            {errors.availableDays}
          </p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
            開始時間
          </label>
          <select
            value={formData.availableStartTime}
            onChange={(e) => handleChange("availableStartTime", e.target.value)}
            disabled={isLoading}
            className="
              w-full px-4 py-2 rounded-2xl border shadow-sm
              bg-white dark:bg-slate-950
              text-slate-900 dark:text-slate-50
              border-slate-200 dark:border-slate-700
              focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600
              disabled:opacity-50
            "
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
            終了時間
          </label>
          <select
            value={formData.availableEndTime}
            onChange={(e) => handleChange("availableEndTime", e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-4 py-2 rounded-2xl border shadow-sm
              bg-white dark:bg-slate-950
              text-slate-900 dark:text-slate-50
              border-slate-200 dark:border-slate-700
              focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600
              disabled:opacity-50
              ${errors.availableEndTime ? "border-red-500 dark:border-red-400" : ""}
            `}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {errors.availableEndTime && (
            <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
              {errors.availableEndTime}
            </p>
          )}
        </div>
      </div>

      {/* Notice and Ahead settings */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="最小通知時間（時間前）"
          type="number"
          min={1}
          value={formData.minNoticeHours}
          onChange={(e) =>
            handleChange("minNoticeHours", parseInt(e.target.value) || 1)
          }
          hint="予約の何時間前まで受付"
          fullWidth
          disabled={isLoading}
        />
        <Input
          label="予約可能期間（日先まで）"
          type="number"
          min={1}
          value={formData.maxDaysAhead}
          onChange={(e) =>
            handleChange("maxDaysAhead", parseInt(e.target.value) || 1)
          }
          hint="何日先まで予約可能"
          fullWidth
          disabled={isLoading}
        />
      </div>

      {/* Expires At */}
      <Input
        label="URL有効期限（任意）"
        type="date"
        value={formData.expiresAt || ""}
        onChange={(e) => handleChange("expiresAt", e.target.value)}
        hint="設定しない場合は無期限"
        fullWidth
        disabled={isLoading}
      />

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          {isEdit ? "更新" : "作成"}
        </Button>
      </div>
    </form>
  );
}
