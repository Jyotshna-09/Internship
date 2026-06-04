import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoonlitBackground } from "@/components/MoonlitBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { audioSystem } from "@/lib/audio";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Moonlight Garden" },
      { name: "description", content: "Sign in or play as a guest to restore the Moonlight Garden." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { profile, signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);

  // If already authenticated, redirect to /play
  useEffect(() => {
    if (profile) {
      navigate({ to: "/play" });
    }
  }, [profile, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabaseConfig) {
      setErrorMsg("Supabase configuration is missing. Please play as a guest.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    audioSystem.playClick();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        alert("Verification email sent! You can also proceed to log in if email confirmation is disabled.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      audioSystem.playSuccess();
    } catch (err: any) {
      audioSystem.playFailure();
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!hasSupabaseConfig) {
      setErrorMsg("Supabase configuration is missing. Please play as a guest.");
      return;
    }
    audioSystem.playClick();
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/play",
        },
      });
      if (error) throw error;
    } catch (err: any) {
      audioSystem.playFailure();
      setErrorMsg(err.message || "Could not launch Google Login.");
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    audioSystem.playClick();
    audioSystem.playSuccess();
    signInAsGuest(guestName.trim());
  };

  return (
    <div className="relative min-h-screen">
      <MoonlitBackground />
      <SiteHeader />

      <main className="mx-auto max-w-md px-6 py-16">
        <AnimatePresence mode="wait">
          {!showGuestForm ? (
            <motion.div
              key="auth-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass rounded-3xl p-8"
            >
              <h1 className="font-display text-3xl text-center mb-2">
                {isSignUp ? "Join the Quest" : "Welcome back, Detective"}
              </h1>
              <p className="text-center text-xs text-muted-foreground mb-6">
                {isSignUp ? "Create an account to save your progress online" : "Log in to retrieve your badges and scores"}
              </p>

              {errorMsg && (
                <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}

              {hasSupabaseConfig ? (
                <form onSubmit={handleAuth} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Detective Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Luna"
                        className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-ring"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="detective@science.org"
                      className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-ring"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-magic w-full py-3 hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading ? "Please wait..." : isSignUp ? "Create account" : "Log In"}
                  </button>
                </form>
              ) : (
                <div className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-xs text-yellow-100">
                  ⚠️ Supabase variables are not set in the environment yet. Online saving, sign-ups, and leaderboard ranks are disabled. Please play in Guest Mode below.
                </div>
              )}

              {hasSupabaseConfig && (
                <>
                  <div className="relative my-6 text-center">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-border -translate-y-1/2" />
                    <span className="relative bg-background px-3 text-xs text-muted-foreground">or</span>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 rounded-full border border-border bg-card/40 py-3 text-sm font-semibold hover:bg-card/75 transition"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}

              <div className="mt-6 text-center text-sm">
                {hasSupabaseConfig && (
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline text-xs"
                  >
                    {isSignUp ? "Already have an account? Log in" : "Need an account? Sign up"}
                  </button>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      audioSystem.playClick();
                      setShowGuestForm(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Play as Guest (Offline Mode)
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="guest-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass rounded-3xl p-8"
            >
              <h1 className="font-display text-3xl text-center mb-2">Guest Play</h1>
              <p className="text-center text-xs text-muted-foreground mb-6">
                Enter your name to begin. Your progress will be saved in your browser's local storage.
              </p>

              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Detective Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Luna"
                    className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-ring"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-magic w-full py-3 hover:scale-[1.02]"
                >
                  Enter the Garden
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    audioSystem.playClick();
                    setShowGuestForm(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  ← Back to Online Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
