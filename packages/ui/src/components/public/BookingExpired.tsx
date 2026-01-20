"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "../Card";

export interface BookingExpiredProps {
  message?: string;
}

export function BookingExpired({ message }: BookingExpiredProps) {
  return (
    <Card variant="default" padding="lg">
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            このリンクは有効期限切れです
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {message ||
              "再度予約URLを発行してもらってください。"}
          </p>
        </div>
      </div>
    </Card>
  );
}
