import { createFileRoute, Link } from "@tanstack/react-router";
import { MoonlitBackground } from "@/components/MoonlitBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SCENES } from "@/lib/scenes";
import { useGame } from "@/lib/game-state";
import { motion } from "framer-motion";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Moonlight Garden" },
      { name: "description", content: "Pick a chapter and play." },
    ],
  }),
  component: PlayHub,
});

import { ProtectedRoute } from "@/components/ProtectedRoute";

function PlayHub() {
  const { state } = useGame();
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        <MoonlitBackground />
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-center font-display text-4xl md:text-5xl">Choose your chapter</h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Each chapter is a short interactive adventure followed by a quick check.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SCENES.map((s, i) => {
              const done = state.completedScenes.includes(s.id);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to="/scene/$id"
                    params={{ id: s.id }}
                    className="glass block rounded-3xl p-7 transition-transform hover:-translate-y-1"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                            style={{ background: "var(--gradient-magic)" }}>
                        {s.number}
                      </span>
                      {done && <span className="text-xs text-emerald-300">✓</span>}
                    </div>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
                    <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">Play →</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
