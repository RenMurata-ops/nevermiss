"use client";

import React, { useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";

export interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBackToLogin?: () => void;
  error?: string;
  isLoading?: boolean;
  success?: boolean;
}

export function PasswordResetForm({
  onSubmit,
  onBackToLogin,
  error,
  isLoading = false,
  success = false,
}: PasswordResetFormProps) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email) {
      setValidationError("メールアドレスを入力してください");
      return;
    }

    await onSubmit(email);
  };

  const displayError = error || validationError;

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                メールを送信しました
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                パスワードリセット用のリンクを {email} に送信しました。
                メールをご確認ください。
              </p>
            </div>
          </div>
        </div>

        {onBackToLogin && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onBackToLogin}
          >
            ログインに戻る
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        登録したメールアドレスを入力してください。
        パスワードリセット用のリンクをお送りします。
      </p>

      {/* Error message */}
      {displayError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
        </div>
      )}

      {/* Email field */}
      <Input
        label="メールアドレス"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        fullWidth
      />

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        リセットリンクを送信
      </Button>

      {/* Back to login */}
      {onBackToLogin && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-slate-900 dark:text-slate-50 font-medium hover:underline"
          >
            ログインに戻る
          </button>
        </p>
      )}
    </form>
  );
}
