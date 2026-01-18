"use client";

import React from "react";
import { Button } from "../Button";

export interface EmailVerificationProps {
  email?: string;
  onResendEmail?: () => Promise<void>;
  onBackToLogin?: () => void;
  isResending?: boolean;
  resendSuccess?: boolean;
  error?: string;
}

export function EmailVerification({
  email,
  onResendEmail,
  onBackToLogin,
  isResending = false,
  resendSuccess = false,
  error,
}: EmailVerificationProps) {
  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-600 dark:text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Title and description */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          メールをご確認ください
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {email ? (
            <>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {email}
              </span>{" "}
              に確認メールを送信しました。
            </>
          ) : (
            "登録したメールアドレスに確認メールを送信しました。"
          )}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          メール内のリンクをクリックして、アカウントを有効化してください。
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success message */}
      {resendSuccess && (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">
            確認メールを再送信しました。
          </p>
        </div>
      )}

      {/* Resend button */}
      {onResendEmail && (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            メールが届きませんか？
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onResendEmail}
            isLoading={isResending}
          >
            確認メールを再送信
          </Button>
        </div>
      )}

      {/* Back to login */}
      {onBackToLogin && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onBackToLogin}
          >
            ログインに戻る
          </Button>
        </div>
      )}
    </div>
  );
}
