"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@nevermiss/ui";
import { useAuth } from "@nevermiss/core";
import type { AuthFormData } from "@nevermiss/ui";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: AuthFormData) => {
    setError(undefined);
    setIsLoading(true);

    try {
      if (!data.name) {
        setError("名前を入力してください");
        return;
      }

      const result = await signUp(data.email, data.password, data.name);

      if (result.success) {
        // Redirect to email verification page
        router.push("/verify-email");
      } else {
        setError(result.error || "アカウント作成に失敗しました");
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(undefined);
    const result = await signInWithGoogle();

    if (!result.success) {
      setError(result.error || "Googleログインに失敗しました");
    }
    // Redirect is handled by Supabase OAuth
  };

  const handleModeChange = () => {
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          アカウント作成
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          新規アカウントを作成してください
        </p>
      </div>

      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        onModeChange={handleModeChange}
        onGoogleLogin={handleGoogleLogin}
        error={error}
        isLoading={isLoading}
      />
    </div>
  );
}
