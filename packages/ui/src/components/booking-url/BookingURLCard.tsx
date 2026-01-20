"use client";

import React, { useState } from "react";
import { Copy, Check, Pencil, Trash2, Video, MapPin, Clock } from "lucide-react";
import { Card } from "../Card";
import { Button } from "../Button";

export interface BookingURLData {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number;
  meetingType: "zoom" | "google_meet" | "onsite";
  locationAddress?: string | null;
  availableDays: number[];
  availableStartTime: string;
  availableEndTime: string;
  isActive: boolean;
}

export interface BookingURLCardProps {
  url: BookingURLData;
  baseUrl?: string;
  onEdit?: (url: BookingURLData) => void;
  onDelete?: (id: string) => void;
}

const meetingTypeLabels: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  onsite: "対面",
};

const meetingTypeIcons: Record<string, React.ReactNode> = {
  zoom: <Video className="w-4 h-4" />,
  google_meet: <Video className="w-4 h-4" />,
  onsite: <MapPin className="w-4 h-4" />,
};

const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function BookingURLCard({
  url,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
  onEdit,
  onDelete,
}: BookingURLCardProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl = `${baseUrl}/b/${url.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return "毎日";
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
      return "平日";
    }
    return days.map((d) => dayLabels[d]).join(", ");
  };

  return (
    <Card
      variant="default"
      padding="none"
      className={url.isActive ? "" : "opacity-60"}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                {url.title}
              </h3>
              {!url.isActive && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full">
                  無効
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(url)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="編集"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(url.id)}
                className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          {/* Duration */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{url.durationMinutes}分</span>
          </div>

          {/* Meeting type */}
          <div className="flex items-center gap-1.5">
            {meetingTypeIcons[url.meetingType]}
            <span>{meetingTypeLabels[url.meetingType]}</span>
          </div>

          {/* Available days */}
          <div className="flex items-center gap-1.5">
            <span>{formatDays(url.availableDays)}</span>
          </div>

          {/* Time range */}
          <div className="flex items-center gap-1.5">
            <span>
              {url.availableStartTime} - {url.availableEndTime}
            </span>
          </div>
        </div>

        {/* URL section */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              公開URL
            </p>
            <p className="text-sm text-slate-900 dark:text-slate-50 truncate font-mono">
              {publicUrl}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            leftIcon={
              copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
          >
            {copied ? "コピー済み" : "コピー"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
