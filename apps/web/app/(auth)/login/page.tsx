"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@nevermiss/ui";
import { useAuth } from "@nevermiss/core";
import type { AuthFormData } from "@nevermiss/ui";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: AuthFormData) => {
    setError(undefined);
    setIsLoading(true);

    try {
      const result = await signInWithEmail(data.email, data.password);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "ログインに失敗しました");
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

  const handleForgotPassword = () => {
    router.push("/reset-password");
  };

  const handleModeChange = () => {
    router.push("/register");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          ログイン
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          アカウントにログインしてください
        </p>
      </div>

      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        onModeChange={handleModeChange}
        onForgotPassword={handleForgotPassword}
        onGoogleLogin={handleGoogleLogin}
        error={error}
        isLoading={isLoading}
      />
    </div>
  );
}
