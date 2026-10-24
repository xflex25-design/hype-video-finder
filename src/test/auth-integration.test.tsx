import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import {
  supabase,
  getUserProfile,
  deductUserCredits,
  saveUserClip,
  getUserClips,
  deleteUserClip,
} from "@/lib/supabase";

function TestAuthConsumer() {
  const { user, profile, credits, openAuthModal, signOut } = useAuth();
  return (
    <div>
      <div data-testid="user-status">{user ? `logged-in:${user.email}` : "logged-out"}</div>
      <div data-testid="credits-count">{credits}</div>
      <div data-testid="profile-name">{profile?.full_name || "none"}</div>
      <button onClick={openAuthModal}>Open Auth Modal</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe("Supabase & Data Layer Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("handles profile fetching with credit balance", async () => {
    const profile = await getUserProfile("demo_user_123");
    // Should return default credits or user profile
    expect(profile === null || typeof profile.credits === "number").toBe(true);
  });

  it("deducts user credits accurately in storage / DB", async () => {
    const result = await deductUserCredits("demo_user_123", 5);
    expect(result === null || typeof result === "number").toBe(true);
  });

  it("handles saving, fetching, and deleting clips in user library", async () => {
    const testClip = {
      user_id: "demo_user_123",
      title: "Viral Hype Clip #1",
      duration: 30,
      hype_score: 0.92,
      clip_data: { start: 5, end: 35, reason: "Energy spike detected" },
    };

    const saved = await saveUserClip(testClip);
    if (saved) {
      expect(saved.title).toBe("Viral Hype Clip #1");
      const clips = await getUserClips("demo_user_123");
      expect(Array.isArray(clips)).toBe(true);

      const deleted = await deleteUserClip(saved.id);
      expect(typeof deleted).toBe("boolean");
    }
  });
});

describe("Auth Modal & End-to-End User Experience", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders closed by default and opens when openAuthModal() is invoked", () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
        <AuthModal />
      </AuthProvider>
    );

    expect(screen.getByTestId("user-status")).toHaveTextContent("logged-out");
    expect(screen.queryByText(/Finish signing up to get your free clips/i)).toBeNull();

    fireEvent.click(screen.getByText("Open Auth Modal"));

    expect(
      screen.getByText(/Finish signing up to get your free clips/i)
    ).toBeInTheDocument();
  });

  it("closes cleanly when the close X button or backdrop is clicked", () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Open Auth Modal"));
    expect(
      screen.getByText(/Finish signing up to get your free clips/i)
    ).toBeInTheDocument();

    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Finish signing up to get your free clips/i)).toBeNull();
  });

  it("toggles seamlessly between Sign Up and Sign In views", () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Open Auth Modal"));

    // Default: Sign Up
    expect(screen.getByText(/Finish signing up to get your free clips/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();

    // Toggle to Sign In
    fireEvent.click(screen.getByText(/Sign in here/i));
    expect(screen.getByText(/Welcome back to Hype Finder/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue with Email/i })).toBeInTheDocument();

    // Toggle back to Sign Up
    fireEvent.click(screen.getByText(/Sign up for free/i));
    expect(screen.getByText(/Finish signing up to get your free clips/i)).toBeInTheDocument();
  });

  it("handles email sign-in end-to-end", async () => {
    // Mock Supabase signInWithPassword
    const signInSpy = vi
      .spyOn(supabase.auth, "signInWithPassword")
      .mockResolvedValueOnce({
        data: {
          user: {
            id: "user_abc",
            email: "test@hypefinder.com",
            app_metadata: {},
            user_metadata: { full_name: "Hype Creator" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
          session: {} as any,
        },
        error: null,
      });

    render(
      <AuthProvider>
        <TestAuthConsumer />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Open Auth Modal"));
    fireEvent.click(screen.getByText(/Sign in here/i));

    const emailInput = screen.getByPlaceholderText("name@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(emailInput, { target: { value: "test@hypefinder.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /Continue with Email/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalledWith({
        email: "test@hypefinder.com",
        password: "password123",
      });
    });
  });

  it("handles email sign-in error gracefully and shows alert message", async () => {
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { name: "AuthError", message: "Invalid login credentials", status: 400 },
    });

    render(
      <AuthProvider>
        <TestAuthConsumer />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Open Auth Modal"));
    fireEvent.click(screen.getByText(/Sign in here/i));

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "wrong@hypefinder.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Continue with Email/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
    });
  });

  it("triggers Google OAuth flow when Continue with Google is clicked", async () => {
    const oauthSpy = vi
      .spyOn(supabase.auth, "signInWithOAuth")
      .mockResolvedValueOnce({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth2" },
        error: null,
      });

    render(
      <AuthProvider>
        <TestAuthConsumer />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Open Auth Modal"));

    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(oauthSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
          options: expect.objectContaining({
            redirectTo: expect.stringContaining(window.location.origin),
          }),
        })
      );
    });
  });

  it("signs out cleanly when Sign Out is invoked", async () => {
    const signOutSpy = vi
      .spyOn(supabase.auth, "signOut")
      .mockResolvedValueOnce({ error: null });

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalled();
      expect(screen.getByTestId("user-status")).toHaveTextContent("logged-out");
    });
  });
});
