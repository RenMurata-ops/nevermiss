import { useState, useEffect, useCallback } from "react";
import { createClient } from "@nevermiss/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User, UserRow } from "@nevermiss/supabase";

// ==============================================
// Types
// ==============================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface UseAuthReturn extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendVerificationEmail: () => Promise<AuthResult>;
}

// ==============================================
// Helper: Convert DB row to User type
// ==============================================

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    organizationId: row.organization_id,
    role: row.role as User["role"],
    plan: row.plan as User["plan"],
    googleRefreshToken: row.google_refresh_token,
    zoomCredentials: row.zoom_credentials as User["zoomCredentials"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ==============================================
// Hook
// ==============================================

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const supabase = createClient();

  // Fetch user profile from users table
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error.message);
          return null;
        }

        return data ? mapRowToUser(data) : null;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    },
    [supabase]
  );

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setState({
            user: userProfile,
            session,
            loading: false,
          });
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        if (mounted) {
          setState({
            user: null,
            session: null,
            loading: false,
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setState({
          user: userProfile,
          session,
          loading: false,
        });
      } else {
        setState({
          user: null,
          session: null,
          loading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  // Sign in with email and password
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "ログインに失敗しました";
        return { success: false, error: message };
      }
    },
    [supabase]
  );

  // Sign in with Google (redirect)
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Googleログインに失敗しました";
      return { success: false, error: message };
    }
  }, [supabase]);

  // Sign up with email, password, and name
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<AuthResult> => {
      try {
        // Create auth user with metadata (trigger will create users record)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
            },
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        });

        if (signUpError) {
          return { success: false, error: signUpError.message };
        }

        // If user was created but email confirmation is required
        if (data.user && !data.session) {
          return { success: true };
        }

        // If auto-confirmed (e.g., in development), update the name
        if (data.user && data.session) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ name })
            .eq("id", data.user.id);

          if (updateError) {
            console.error("Error updating user name:", updateError.message);
          }
        }

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "アカウント作成に失敗しました";
        return { success: false, error: message };
      }
    },
    [supabase]
  );

  // Sign out
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      setState({
        user: null,
        session: null,
        loading: false,
      });

      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ログアウトに失敗しました";
      return { success: false, error: message };
    }
  }, [supabase]);

  // Reset password
  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "パスワードリセットメールの送信に失敗しました";
        return { success: false, error: message };
      }
    },
    [supabase]
  );

  // Resend verification email
  const resendVerificationEmail = useCallback(async (): Promise<AuthResult> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        return { success: false, error: "メールアドレスが見つかりません" };
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: session.user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "認証メールの再送信に失敗しました";
      return { success: false, error: message };
    }
  }, [supabase]);

  return {
    ...state,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    resendVerificationEmail,
  };
}
