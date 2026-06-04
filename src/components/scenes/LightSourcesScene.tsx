import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { audioSystem } from "@/lib/audio";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";

type Item = {
  id: number;
  label: string;
  emoji: string;
  isLight: boolean;
  x: number;
  y: number;
  speed: number;
  size: number;
};

const POOL = [
  // Correct light sources (produce their own light)
  { label: "Sun", emoji: "☀️", isLight: true },
  { label: "Lantern", emoji: "🏮", isLight: true },
  { label: "Bulb", emoji: "💡", isLight: true },
  { label: "Torch", emoji: "🔦", isLight: true },
  { label: "Candle", emoji: "🕯️", isLight: true },
  { label: "Firefly", emoji: "🪰", isLight: true },
  
  // Incorrect ordinary objects (only reflect light)
  { label: "Rock", emoji: "🪨", isLight: false },
  { label: "Leaf", emoji: "🍃", isLight: false },
  { label: "Chair", emoji: "🪑", isLight: false },
  { label: "Book", emoji: "📕", isLight: false },
  { label: "Bucket", emoji: "🪣", isLight: false },
  { label: "Tree Branch", emoji: "🌿", isLight: false },
];

export function LightSourcesScene({ onComplete }: { onComplete: () => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds
  const [combo, setCombo] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [gameState, setGameState] = useState<"ready" | "playing" | "paused" | "failed" | "won">("ready");
  
  const idRef = useRef(0);
  const targetScore = 20;

  // Sound effects helper
  const playSfx = (type: "correct" | "wrong" | "click") => {
    if (type === "correct") {
      audioSystem.playSuccess();
    } else if (type === "wrong") {
      audioSystem.playFailure();
    } else {
      audioSystem.playClick();
    }
  };

  // Start the game
  const startGame = () => {
    playSfx("click");
    setScore(0);
    setTimeLeft(30);
    setCombo(1);
    setItems([]);
    setGameState("playing");
  };

  // Timer Tick
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState("failed");
          playSfx("wrong");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Spawn Items Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    // Difficulty increases with score: spawn faster
    const baseSpawnRate = Math.max(500, 1100 - score * 30);

    const spawn = setInterval(() => {
      const base = POOL[Math.floor(Math.random() * POOL.length)];
      const id = ++idRef.current;
      
      // Fall speed scales with score (much slower base to allow easy clicks)
      const speed = 0.35 + Math.random() * 0.15 + (score * 0.012);
      const size = base.isLight ? 72 : 64; // larger hitbox for easy tapping

      setItems((prev) => [
        ...prev,
        {
          id,
          ...base,
          x: 10 + Math.random() * 80,
          y: -10,
          speed,
          size,
        },
      ]);
    }, baseSpawnRate);

    return () => clearInterval(spawn);
  }, [gameState, score]);

  // Physics Movement Loop (approx 60fps)
  useEffect(() => {
    if (gameState !== "playing") return;

    const tick = setInterval(() => {
      setItems((prev) =>
        prev
          .map((it) => ({ ...it, y: it.y + it.speed }))
          .filter((it) => {
            if (it.y >= 105) {
              // If we miss a correct light source, break combo!
              if (it.isLight) {
                setCombo(1);
              }
              return false;
            }
            return true;
          })
      );
    }, 16);

    return () => clearInterval(tick);
  }, [gameState]);

  // Handle Item Tap / Click
  const handleTap = (it: Item, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (gameState !== "playing") return;

    setItems((prev) => prev.filter((p) => p.id !== it.id));

    if (it.isLight) {
      playSfx("correct");
      // Add particle flash locally at position
      createSparks(it.x, it.y);

      const pointsEarned = 1 * combo;
      setScore((s) => {
        const ns = s + pointsEarned;
        if (ns >= targetScore) {
          setGameState("won");
          audioSystem.playLevelComplete();
        }
        return ns;
      });
      // Increment combo (max 5x)
      setCombo((c) => Math.min(5, c + 1));
    } else {
      playSfx("wrong");
      // Reset combo and deduct time
      setCombo(1);
      setTimeLeft((t) => Math.max(0, t - 3)); // Deduct 3 seconds
    }
  };

  // Spark burst particles
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const sparkIdRef = useRef(0);

  const createSparks = (x: number, y: number) => {
    const newSparks = [...Array(6)].map(() => ({
      id: ++sparkIdRef.current,
      x: x + (Math.random() * 10 - 5),
      y: y + (Math.random() * 10 - 5),
    }));
    setSparks((prev) => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.some(n => n.id === s.id)));
    }, 800);
  };

  return (
    <div className="mx-auto w-full max-w-4xl select-none">
      {/* Game Dashboard */}
      <div className="mb-4 flex items-center justify-between text-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-card/60 px-4 py-1.5 backdrop-blur border border-white/5 flex items-center gap-1.5">
            ✨ Score: <span className="text-glow-magic font-bold text-base">{score}</span> / {targetScore}
          </span>
          <span className="rounded-full bg-card/60 px-4 py-1.5 backdrop-blur border border-white/5 flex items-center gap-1">
            ⏱️ Timer: <span className={`font-bold ${timeLeft <= 5 ? "text-rose-400 animate-pulse text-base" : ""}`}>{timeLeft}s</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 text-xs font-bold"
            >
              <Zap className="h-3 w-3 fill-yellow-300" />
              {combo}x Multiplier!
            </motion.div>
          )}

          {gameState === "playing" && (
            <button
              onClick={() => { playSfx("click"); setGameState("paused"); }}
              className="rounded-full bg-card/40 p-2 hover:bg-card/75 border border-white/5 transition-colors"
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Arcade Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-indigo-950/60 to-purple-950/60 shadow-2xl">
        
        {/* Game play state renderer */}
        <AnimatePresence>
          {items.map((it) => (
            <motion.button
              key={it.id}
              // Bind unified pointer down event for instant touch/mouse response
              onPointerDown={(e) => handleTap(it, e)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none z-10 active:scale-95 touch-none"
              style={{
                left: `${it.x}%`,
                top: `${it.y}%`,
                width: `${it.size}px`,
                height: `${it.size}px`,
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-3xl select-none"
                style={{
                  background: it.isLight
                    ? "radial-gradient(circle, rgba(255,209,102,0.45) 0%, transparent 75%)"
                    : "transparent",
                  filter: it.isLight ? "drop-shadow(0 0 10px rgba(255,209,102,0.5))" : "none"
                }}
              >
                {it.emoji}
              </div>
            </motion.button>
          ))}

          {/* Spark Particles */}
          {sparks.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 1, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.5, y: -20 }}
              className="absolute h-1 w-1 bg-yellow-300 rounded-full blur-[1px] pointer-events-none"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            />
          ))}
        </AnimatePresence>

        {/* 1. START OVERLAY */}
        {gameState === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm z-20 text-center p-6"
          >
            <h2 className="font-display text-4xl text-glow-magic text-white">Light Source Discovery</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Tap only objects that **produce their own light** (Natural or Artificial). Avoid other objects. 
              Earn score multipliers with combos, but watch the timer!
            </p>
            <button onClick={startGame} className="btn-magic hover:scale-105 px-8 py-3 text-base">
              Start Arcade Game
            </button>
          </motion.div>
        )}

        {/* 2. PAUSE OVERLAY */}
        {gameState === "paused" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-md z-20"
          >
            <p className="font-display text-3xl text-white">Game Paused</p>
            <div className="flex gap-4">
              <button
                onClick={() => { playSfx("click"); setGameState("playing"); }}
                className="btn-magic flex items-center gap-2 hover:scale-105"
              >
                <Play className="h-4 w-4 fill-white" /> Resume
              </button>
              <button
                onClick={startGame}
                className="rounded-full border border-border bg-card/60 px-6 py-2.5 text-sm hover:bg-card flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Restart
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. WON OVERLAY */}
        {gameState === "won" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/65 backdrop-blur-md z-20 text-center p-6"
          >
            <p className="text-yellow-300 text-5xl">🏅</p>
            <h2 className="font-display text-3xl text-glow-magic text-white">Awesome Job, Detective!</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              You correctly identified the light sources and reached the score target of {targetScore}!
            </p>
            <button onClick={onComplete} className="btn-magic hover:scale-105 px-8 py-3">
              Proceed to Quick Check →
            </button>
          </motion.div>
        )}

        {/* 4. FAILED OVERLAY */}
        {gameState === "failed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-sm z-20 text-center p-6"
          >
            <p className="text-rose-400 text-5xl">⌛</p>
            <h2 className="font-display text-3xl text-rose-300">Time's Up!</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              You scored {score} points. Try again and avoid the non-light sources to boost your time!
            </p>
            <button onClick={startGame} className="btn-magic bg-rose-500 hover:bg-rose-600 hover:scale-105 flex items-center gap-2 px-6 py-2.5">
              <RotateCcw className="h-4 w-4" /> Try Again
            </button>
          </motion.div>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        **Target:** Score {targetScore} points. Light sources give out their own light. Objects reflect them.
      </p>
    </div>
  );
}
