import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoonlitBackground } from "@/components/MoonlitBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Quiz } from "@/components/Quiz";
import { BadgeUnlock } from "@/components/BadgeUnlock";
import { DarkGardenScene } from "@/components/scenes/DarkGardenScene";
import { LightSourcesScene } from "@/components/scenes/LightSourcesScene";
import { LightTravelsScene } from "@/components/scenes/LightTravelsScene";
import { ReflectionMysteryScene } from "@/components/scenes/ReflectionMysteryScene";
import { ShadowChallengeScene } from "@/components/scenes/ShadowChallengeScene";
import { GardenRestorationScene } from "@/components/scenes/GardenRestorationScene";
import { SCENES, type SceneMeta } from "@/lib/scenes";
import { useGame, type SceneId } from "@/lib/game-state";

export const Route = createFileRoute("/scene/$id")({
  loader: ({ params }) => {
    const scene = SCENES.find((s) => s.id === (params.id as SceneId));
    if (!scene) throw notFound();
    return { scene };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.scene.title} — Moonlight Garden` },
      { name: "description", content: loaderData?.scene.outcome ?? "" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Chapter not found. <Link to="/play" className="underline">Back to play</Link>
    </div>
  ),
  component: SceneRoute,
});

type Phase = "intro" | "play" | "quiz" | "done";

import { ProtectedRoute } from "@/components/ProtectedRoute";

function SceneRoute() {
  const { scene } = Route.useLoaderData();
  const navigate = useNavigate();
  const { completeScene, recordQuiz } = useGame();
  const [phase, setPhase] = useState<Phase>("intro");
  const [badge, setBadge] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<{ s: number; t: number } | null>(null);

  function finishPlay() {
    setPhase("quiz");
  }
  function finishQuiz(score: number, total: number) {
    recordQuiz(scene.id, score, total);
    completeScene(scene.id, scene.points, scene.badge);
    setFinalScore({ s: score, t: total });
    if (scene.badge) setBadge(scene.badge);
    setPhase("done");
  }

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        <MoonlitBackground />
        <SiteHeader />

        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <Link to="/play" className="hover:text-foreground">← All chapters</Link>
            <span>Chapter {scene.number} of {SCENES.length}</span>
          </div>

          <AnimatePresence mode="wait">
            {phase === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <IntroCard scene={scene} onStart={() => setPhase("play")} />
              </motion.div>
            )}
            {phase === "play" && (
              <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="mb-2 font-display text-3xl">{scene.title}</h1>
                <p className="mb-6 text-muted-foreground">{scene.objective}</p>
                {scene.id === "dark-garden" && <DarkGardenScene onComplete={finishPlay} />}
                {scene.id === "light-sources" && <LightSourcesScene onComplete={finishPlay} />}
                {scene.id === "light-travels" && <LightTravelsScene onComplete={finishPlay} />}
                {scene.id === "reflection-mystery" && <ReflectionMysteryScene onComplete={finishPlay} />}
                {scene.id === "shadow-challenge" && <ShadowChallengeScene onComplete={finishPlay} />}
                {scene.id === "garden-restoration" && <GardenRestorationScene onComplete={finishPlay} />}
              </motion.div>
            )}
            {phase === "quiz" && (
              <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="mb-6 text-center font-display text-2xl">Quick Check ✨</h2>
                <Quiz id={scene.id} questions={scene.quiz} onDone={finishQuiz} />
              </motion.div>
            )}
            {phase === "done" && finalScore && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass mx-auto max-w-2xl rounded-3xl p-10 text-center"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter complete</p>
                <h2 className="mt-2 font-display text-4xl text-glow-magic">+{scene.points} points</h2>
                <p className="mt-4 text-muted-foreground">{scene.outcome}</p>
                <p className="mt-2">Quiz: {finalScore.s} / {finalScore.t}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link to="/play" className="rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm hover:bg-card">
                    All chapters
                  </Link>
                  {nextSceneAfter(scene.id) ? (
                    <button
                      onClick={() => {
                        const n = nextSceneAfter(scene.id)!;
                        navigate({ to: "/scene/$id", params: { id: n } });
                        setPhase("intro");
                        setFinalScore(null);
                      }}
                      className="btn-magic"
                    >
                      Next chapter →
                    </button>
                  ) : (
                    <Link to="/dashboard" className="btn-magic">See your progress</Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BadgeUnlock open={!!badge} badge={badge} onClose={() => setBadge(null)} />
      </div>
    </ProtectedRoute>
  );
}

function IntroCard({ scene, onStart }: { scene: SceneMeta; onStart: () => void }) {
  return (
    <div className="glass mx-auto max-w-2xl rounded-3xl p-10 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter {scene.number}</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">{scene.title}</h1>
      <p className="mt-3 text-muted-foreground">{scene.subtitle}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card/40 p-5 text-left">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your mission</p>
        <p className="mt-1">{scene.objective}</p>
      </div>
      <button onClick={onStart} className="btn-magic mt-8 hover:scale-105">
        Begin chapter →
      </button>
    </div>
  );
}

function nextSceneAfter(id: SceneId): SceneId | null {
  const i = SCENES.findIndex((s) => s.id === id);
  return i >= 0 && i + 1 < SCENES.length ? SCENES[i + 1].id : null;
}
