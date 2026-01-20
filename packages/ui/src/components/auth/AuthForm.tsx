"use client";

import React, { useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";

export type AuthMode = "login" | "register";

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: AuthFormData) => Promise<void>;
  onModeChange?: (mode: AuthMode) => void;
  onForgotPassword?: () => void;
  onGoogleLogin?: () => void;
  error?: string;
  isLoading?: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export function AuthForm({
  mode,
  onSubmit,
  onModeChange,
  onForgotPassword,
  onGoogleLogin,
  error,
  isLoading = false,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic validation
    if (!email || !password) {
      setValidationError("メールアドレスとパスワードを入力してください");
      return;
    }

    if (mode === "register" && !name) {
      setValidationError("名前を入力してください");
      return;
    }

    if (password.length < 6) {
      setValidationError("パスワードは6文字以上で入力してください");
      return;
    }

    await onSubmit({ email, password, name: mode === "register" ? name : undefined });
  };

  const displayError = error || validationError;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {displayError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
        </div>
      )}

      {/* Name field (register only) */}
      {mode === "register" && (
        <Input
          label="名前"
          type="text"
          placeholder="山田 太郎"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          fullWidth
        />
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

      {/* Password field */}
      <Input
        label="パスワード"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={mode === "register" ? "6文字以上" : undefined}
        disabled={isLoading}
        fullWidth
      />

      {/* Forgot password link (login only) */}
      {mode === "login" && onForgotPassword && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
          >
            パスワードをお忘れですか？
          </button>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {mode === "login" ? "ログイン" : "アカウント作成"}
      </Button>

      {/* Google login */}
      {onGoogleLogin && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                または
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onGoogleLogin}
            disabled={isLoading}
            leftIcon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            Googleでログイン
          </Button>
        </>
      )}

      {/* Mode switch */}
      {onModeChange && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === "login" ? (
            <>
              アカウントをお持ちでないですか？{" "}
              <button
                type="button"
                onClick={() => onModeChange("register")}
                className="text-slate-900 dark:text-slate-50 font-medium hover:underline"
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              すでにアカウントをお持ちですか？{" "}
              <button
                type="button"
                onClick={() => onModeChange("login")}
                className="text-slate-900 dark:text-slate-50 font-medium hover:underline"
              >
                ログイン
              </button>
            </>
          )}
        </p>
      )}
    </form>
  );
}
