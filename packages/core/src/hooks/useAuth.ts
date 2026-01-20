import { useState, useEffect } from "react";
import { getSupabase } from "@nevermiss/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendVerificationEmail: () => Promise<AuthResult>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    // 初回セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // セッション変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const resendVerificationEmail = async (): Promise<AuthResult> => {
    const supabase = getSupabase();
    const email = user?.email;
    if (!email) {
      return { success: false, error: "ユーザーのメールアドレスが見つかりません" };
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  return {
    user,
    session,
    loading,
    signOut,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    resetPassword,
    resendVerificationEmail,
  };
}
