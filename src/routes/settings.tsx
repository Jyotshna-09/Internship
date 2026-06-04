import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MoonlitBackground } from "@/components/MoonlitBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { audioSystem } from "@/lib/audio";
import { useGame } from "@/lib/game-state";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Moonlight Garden" },
      { name: "description", content: "Configure game volume, reset progress, and set accessibility preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { reset } = useGame();
  const { profile } = useAuth();
  const [music, setMusic] = useState(true);
  const [sound, setSound] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setMusic(audioSystem.isMusicEnabled());
    setSound(audioSystem.isSoundEnabled());
    setLargeText(localStorage.getItem("accessibility_large_text") === "true");
    setHighContrast(localStorage.getItem("accessibility_high_contrast") === "true");
  }, []);

  const toggleMusic = () => {
    const val = !music;
    setMusic(val);
    audioSystem.setMusicEnabled(val);
    if (sound) audioSystem.playClick();
  };

  const toggleSound = () => {
    const val = !sound;
    setSound(val);
    audioSystem.setSoundEnabled(val);
    if (val) audioSystem.playClick();
  };

  const toggleLargeText = () => {
    const val = !largeText;
    setLargeText(val);
    localStorage.setItem("accessibility_large_text", String(val));
    document.documentElement.classList.toggle("large-text", val);
    if (sound) audioSystem.playClick();
  };

  const toggleHighContrast = () => {
    const val = !highContrast;
    setHighContrast(val);
    localStorage.setItem("accessibility_high_contrast", String(val));
    document.documentElement.classList.toggle("high-contrast", val);
    if (sound) audioSystem.playClick();
  };

  const handleReset = async () => {
    if (confirm("Are you absolutely sure you want to reset all progress? This will delete all your badges and scores permanently.")) {
      if (sound) audioSystem.playFailure();
      await reset();
      alert("Progress reset successful!");
    }
  };

  return (
    <div className="relative min-h-screen">
      <MoonlitBackground />
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-display text-3xl md:text-4xl">Settings</h1>
            <Link to="/play" className="text-sm text-muted-foreground hover:text-foreground">
              ← Return to game
            </Link>
          </div>

          {/* Sound settings */}
          <section className="border-b border-border py-5">
            <h2 className="text-lg font-semibold mb-4">Audio Options</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ambient Music</h3>
                  <p className="text-xs text-muted-foreground">Soft, magical backing track</p>
                </div>
                <button
                  onClick={toggleMusic}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    music ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      music ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Effects</h3>
                  <p className="text-xs text-muted-foreground">Clicks, success chimes, and badges</p>
                </div>
                <button
                  onClick={toggleSound}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sound ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sound ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Accessibility settings */}
          <section className="border-b border-border py-5">
            <h2 className="text-lg font-semibold mb-4">Accessibility</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Large Font Mode</h3>
                  <p className="text-xs text-muted-foreground">Increases sizing of game text</p>
                </div>
                <button
                  onClick={toggleLargeText}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    largeText ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      largeText ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">High Contrast Mode</h3>
                  <p className="text-xs text-muted-foreground">Enhances visual borders and contrast</p>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    highContrast ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      highContrast ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Reset progress */}
          <section className="py-5">
            <h2 className="text-lg font-semibold mb-2 text-rose-300">Danger Zone</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Once you reset your progress, all unlocked chapters, points, badges, and records are cleared.
            </p>
            <button
              onClick={handleReset}
              className="rounded-full border border-destructive bg-destructive/15 px-6 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/30 transition"
            >
              Reset All Progress
            </button>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
