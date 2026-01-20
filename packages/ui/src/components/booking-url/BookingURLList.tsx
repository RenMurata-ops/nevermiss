"use client";

import React from "react";
import { Link, Plus } from "lucide-react";
import { BookingURLCard, BookingURLData } from "./BookingURLCard";
import { Card } from "../Card";
import { Button } from "../Button";

export interface BookingURLListProps {
  urls: BookingURLData[];
  onEdit?: (url: BookingURLData) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
  isLoading?: boolean;
}

export function BookingURLList({
  urls,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false,
}: BookingURLListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="default" padding="md">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Link className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            予約URLがありません
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            予約URLを作成して、クライアントと予約可能な時間を共有しましょう。
          </p>
          {onCreate && (
            <Button
              variant="primary"
              onClick={onCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              予約URLを作成
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {urls.map((url) => (
        <BookingURLCard
          key={url.id}
          url={url}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
