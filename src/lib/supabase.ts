import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("https://")
);

// Fallback dummy client for build time / unconfigured environments
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  created_at: string;
  updated_at?: string;
}

export interface SavedClip {
  id: string;
  user_id: string;
  title: string;
  source_url?: string;
  duration: number;
  hype_score: number;
  video_url?: string;
  clip_data: {
    start: number;
    end: number;
    reason?: string;
  };
  created_at: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    const cached = localStorage.getItem(`hype_profile_${userId}`);
    if (cached) return JSON.parse(cached);
    return {
      id: userId,
      email: "creator@example.com",
      full_name: "Content Creator",
      avatar_url: null,
      credits: 90,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("Could not fetch profile:", error.message);
    return null;
  }
  return data;
}

export async function deductUserCredits(userId: string, amount: number = 5): Promise<number | null> {
  if (!isSupabaseConfigured) {
    const cached = localStorage.getItem(`hype_profile_${userId}`);
    const prof = cached ? JSON.parse(cached) : { credits: 90 };
    prof.credits = Math.max(0, (prof.credits ?? 90) - amount);
    localStorage.setItem(`hype_profile_${userId}`, JSON.stringify(prof));
    return prof.credits;
  }

  // Fetch current credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!profile) return null;
  const newBalance = Math.max(0, (profile.credits || 0) - amount);

  const { error } = await supabase
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update credits:", error.message);
    return null;
  }
  return newBalance;
}

export async function saveUserClip(clip: Omit<SavedClip, "id" | "created_at">): Promise<SavedClip | null> {
  if (!isSupabaseConfigured) {
    const localClips: SavedClip[] = JSON.parse(localStorage.getItem("hype_local_clips") || "[]");
    const newClip: SavedClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    localClips.unshift(newClip);
    localStorage.setItem("hype_local_clips", JSON.stringify(localClips));
    return newClip;
  }

  const { data, error } = await supabase
    .from("clips")
    .insert([clip])
    .select()
    .single();

  if (error) {
    console.error("Failed to save clip:", error.message);
    return null;
  }
  return data;
}

export async function getUserClips(userId: string): Promise<SavedClip[]> {
  if (!isSupabaseConfigured) {
    const localClips: SavedClip[] = JSON.parse(localStorage.getItem("hype_local_clips") || "[]");
    return localClips;
  }

  const { data, error } = await supabase
    .from("clips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch clips:", error.message);
    return [];
  }
  return data || [];
}

export async function deleteUserClip(clipId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const localClips: SavedClip[] = JSON.parse(localStorage.getItem("hype_local_clips") || "[]");
    const updated = localClips.filter((c) => c.id !== clipId);
    localStorage.setItem("hype_local_clips", JSON.stringify(updated));
    return true;
  }

  const { error } = await supabase.from("clips").delete().eq("id", clipId);
  if (error) {
    console.error("Failed to delete clip:", error.message);
    return false;
  }
  return true;
}
