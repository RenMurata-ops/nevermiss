"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordResetForm } from "@nevermiss/ui";
import { useAuth } from "@nevermiss/core";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (email: string) => {
    setError(undefined);
    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "パスワードリセットメールの送信に失敗しました");
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          パスワードをリセット
        </h2>
      </div>

      <PasswordResetForm
        onSubmit={handleSubmit}
        onBackToLogin={handleBackToLogin}
        error={error}
        isLoading={isLoading}
        success={success}
      />
    </div>
  );
}
