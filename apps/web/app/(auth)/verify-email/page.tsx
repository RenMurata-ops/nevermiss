"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailVerification } from "@nevermiss/ui";
import { useAuth } from "@nevermiss/core";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, resendVerificationEmail } = useAuth();
  const [error, setError] = useState<string | undefined>();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    setError(undefined);
    setResendSuccess(false);
    setIsResending(true);

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        setResendSuccess(true);
      } else {
        setError(result.error || "確認メールの再送信に失敗しました");
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <EmailVerification
      email={user?.email}
      onResendEmail={handleResendEmail}
      onBackToLogin={handleBackToLogin}
      isResending={isResending}
      resendSuccess={resendSuccess}
      error={error}
    />
  );
}
