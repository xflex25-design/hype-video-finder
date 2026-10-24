import { i as __toESM } from "../_runtime.mjs";
import { r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthContext-BfNoi7qp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var supabaseUrl = "https://tyzaovxqyxqtymflytqc.supabase.co/rest/v1/".trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
var supabaseAnonKey = "sb_publishable_3nO5csObjXdukmXmZUC-BQ_aIb75-99".trim();
var isSupabaseConfigured = Boolean(supabaseUrl && supabaseUrl.startsWith("https://"));
var supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, { auth: {
	persistSession: true,
	autoRefreshToken: true,
	detectSessionInUrl: true
} }) : createClient("https://placeholder.supabase.co", "placeholder-key", { auth: {
	persistSession: false,
	autoRefreshToken: false
} });
async function getUserProfile(userId) {
	if (!isSupabaseConfigured) {
		const cached = localStorage.getItem(`hype_profile_${userId}`);
		if (cached) return JSON.parse(cached);
		return {
			id: userId,
			email: "creator@example.com",
			full_name: "Content Creator",
			avatar_url: null,
			credits: 90,
			created_at: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
	if (error) {
		console.warn("Could not fetch profile:", error.message);
		return null;
	}
	return data;
}
async function deductUserCredits(userId, amount = 5) {
	if (!isSupabaseConfigured) {
		const cached = localStorage.getItem(`hype_profile_${userId}`);
		const prof = cached ? JSON.parse(cached) : { credits: 90 };
		prof.credits = Math.max(0, (prof.credits ?? 90) - amount);
		localStorage.setItem(`hype_profile_${userId}`, JSON.stringify(prof));
		return prof.credits;
	}
	const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();
	if (!profile) return null;
	const newBalance = Math.max(0, (profile.credits || 0) - amount);
	const { error } = await supabase.from("profiles").update({
		credits: newBalance,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", userId);
	if (error) {
		console.error("Failed to update credits:", error.message);
		return null;
	}
	return newBalance;
}
async function saveUserClip(clip) {
	if (!isSupabaseConfigured) {
		const localClips = JSON.parse(localStorage.getItem("hype_local_clips") || "[]");
		const newClip = {
			...clip,
			id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
			created_at: (/* @__PURE__ */ new Date()).toISOString()
		};
		localClips.unshift(newClip);
		localStorage.setItem("hype_local_clips", JSON.stringify(localClips));
		return newClip;
	}
	const { data, error } = await supabase.from("clips").insert([clip]).select().single();
	if (error) {
		console.error("Failed to save clip:", error.message);
		return null;
	}
	return data;
}
async function getUserClips(userId) {
	if (!isSupabaseConfigured) return JSON.parse(localStorage.getItem("hype_local_clips") || "[]");
	const { data, error } = await supabase.from("clips").select("*").eq("user_id", userId).order("created_at", { ascending: false });
	if (error) {
		console.error("Failed to fetch clips:", error.message);
		return [];
	}
	return data || [];
}
async function deleteUserClip(clipId) {
	if (!isSupabaseConfigured) {
		const updated = JSON.parse(localStorage.getItem("hype_local_clips") || "[]").filter((c) => c.id !== clipId);
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
var _jsxFileName = "/app/applet/src/contexts/AuthContext.tsx";
var AuthContext = (0, import_react.createContext)(void 0);
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [session, setSession] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [credits, setCredits] = (0, import_react.useState)(90);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [isAuthModalOpen, setIsAuthModalOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!isSupabaseConfigured) {
			const localUser = localStorage.getItem("hype_local_user");
			if (localUser) try {
				const parsed = JSON.parse(localUser);
				setUser(parsed);
				setCredits(parsed.credits ?? 90);
				setProfile({
					id: parsed.id,
					email: parsed.email,
					full_name: parsed.user_metadata?.full_name || "Creator",
					avatar_url: parsed.user_metadata?.avatar_url || null,
					credits: parsed.credits ?? 90,
					created_at: (/* @__PURE__ */ new Date()).toISOString()
				});
			} catch {}
			setLoading(false);
			return;
		}
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) loadProfile(session.user.id);
			else setLoading(false);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) loadProfile(session.user.id);
			else {
				setProfile(null);
				setCredits(90);
				setLoading(false);
			}
		});
		return () => subscription.unsubscribe();
	}, []);
	async function loadProfile(userId) {
		try {
			let p = await getUserProfile(userId);
			if (!p && isSupabaseConfigured) {
				await new Promise((resolve) => setTimeout(resolve, 600));
				p = await getUserProfile(userId);
			}
			if (p) {
				setProfile(p);
				setCredits(p.credits ?? 90);
			} else setCredits(90);
		} catch (e) {
			console.error("Error loading user profile:", e);
		} finally {
			setLoading(false);
		}
	}
	async function refreshProfile() {
		if (user) await loadProfile(user.id);
	}
	async function signInWithGoogle() {
		if (!isSupabaseConfigured) {
			const demoUser = {
				id: "demo_google_user",
				email: "google.creator@example.com",
				user_metadata: {
					full_name: "Google Creator",
					avatar_url: null
				},
				credits: 90
			};
			localStorage.setItem("hype_local_user", JSON.stringify(demoUser));
			setUser(demoUser);
			setCredits(90);
			setIsAuthModalOpen(false);
			return {};
		}
		try {
			const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : void 0;
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo,
					queryParams: {
						access_type: "offline",
						prompt: "consent"
					}
				}
			});
			if (error) {
				console.error("Google OAuth error:", error.message);
				return { error: error.message };
			}
			if (data?.url && typeof window !== "undefined") window.location.assign(data.url);
			return {};
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Google OAuth initiation failed";
			console.error("Google sign in exception:", err);
			return { error: msg };
		}
	}
	async function signInWithEmail(email, password) {
		if (!isSupabaseConfigured) {
			const demoUser = {
				id: `user_${Date.now()}`,
				email,
				user_metadata: { full_name: email.split("@")[0] },
				credits: 90
			};
			localStorage.setItem("hype_local_user", JSON.stringify(demoUser));
			setUser(demoUser);
			setCredits(90);
			setIsAuthModalOpen(false);
			return {};
		}
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		if (error) return { error: error.message };
		setIsAuthModalOpen(false);
		return {};
	}
	async function signUpWithEmail(email, password) {
		if (!isSupabaseConfigured) {
			const demoUser = {
				id: `user_${Date.now()}`,
				email,
				user_metadata: { full_name: email.split("@")[0] },
				credits: 90
			};
			localStorage.setItem("hype_local_user", JSON.stringify(demoUser));
			setUser(demoUser);
			setCredits(90);
			setIsAuthModalOpen(false);
			return {};
		}
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: {
				full_name: email.split("@")[0],
				credits: 90
			} }
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
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AuthContext.Provider, {
		value: {
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
			refreshProfile
		},
		children
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 233,
		columnNumber: 5
	}, this);
}
function useAuth() {
	const context = (0, import_react.useContext)(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
//#endregion
export { isSupabaseConfigured as a, getUserClips as i, deductUserCredits as n, saveUserClip as o, deleteUserClip as r, useAuth as s, AuthProvider as t };
