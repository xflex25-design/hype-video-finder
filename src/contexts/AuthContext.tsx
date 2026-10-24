import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  isSupabaseConfigured,
  getUserProfile,
  type UserProfile,
} from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  credits: number;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number>(90);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Offline/Local demo state
      const localUser = localStorage.getItem("hype_local_user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          setUser(parsed);
          setCredits(parsed.credits ?? 90);
          setProfile({
            id: parsed.id,
            email: parsed.email,
            full_name: parsed.user_metadata?.full_name || "Creator",
            avatar_url: parsed.user_metadata?.avatar_url || null,
            credits: parsed.credits ?? 90,
            created_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Supabase Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setCredits(90);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      let p = await getUserProfile(userId);
      // If profile doesn't exist yet (e.g. freshly created by Google OAuth), wait briefly and retry
      if (!p && isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        p = await getUserProfile(userId);
      }
      if (p) {
        setProfile(p);
        setCredits(p.credits ?? 90);
      } else {
        setCredits(90);
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      const demoUser = {
        id: "demo_google_user",
        email: "google.creator@example.com",
        user_metadata: { full_name: "Google Creator", avatar_url: null },
        credits: 90,
      } as unknown as User;
      localStorage.setItem("hype_local_user", JSON.stringify(demoUser));
      setUser(demoUser);
      setCredits(90);
      setIsAuthModalOpen(false);
      return {};
    }

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error.message);
        return { error: error.message };
      }

      if (data?.url && typeof window !== "undefined") {
        window.location.assign(data.url);
      }
      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google OAuth initiation failed";
      console.error("Google sign in exception:", err);
      return { error: msg };
    }
  }

  async function signInWithEmail(email: string, password: string) {
    if (!isSupabaseConfigured) {
      const demoUser = {
        id: `user_${Date.now()}`,
        email,
        user_metadata: { full_name: email.split("@")[0] },
        credits: 90,
      } as unknown as User;
      localStorage.setItem("hype_local_user", JSON.stringify(demoUser));
      setUser(demoUser);
      setCredits(90);
      setIsAuthModalOpen(false);
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    setIsAuthModalOpen(false);
    return {};
  }

  async function signUpWithEmail(email: string, password: string) {
    if (!isSupabaseConfigured) {
      const demoUser = {
        id: `user_${Date.now()}`,
        email,
        user_metadata: { full_name: email.split("@")[0] },
        credits: 90,
      } as unknown as User;
      localStorage.setItem("hype_local_user", JSON.stringify(demoUser));
      setUser(demoUser);
      setCredits(90);
      setIsAuthModalOpen(false);
      return {};
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split("@")[0],
          credits: 90,
        },
      },
    });

    if (error) return { error: error.message };
    setIsAuthModalOpen(false);
    return {};
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      localStorage.removeItem("hype_local_user");
      setUser(null);
      setProfile(null);
      setCredits(90);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCredits(90);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        credits,
        loading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
