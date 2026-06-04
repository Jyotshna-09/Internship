import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { audioSystem } from "@/lib/audio";

// Scene 1: Click to find the hidden lantern. Once found, the garden lights up.
export function DarkGardenScene({ onComplete }: { onComplete: () => void }) {
  const [found, setFound] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // The lantern hides at a fixed-but-not-obvious spot.
  const lanternPos = { x: 68, y: 58 };

  useEffect(() => {
    // Start forest BGM and ambience on mount
    audioSystem.startAmbience();
    audioSystem.startMusic();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (found || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (found || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y });
  };

  const handleSearchClick = () => {
    if (found) return;
    // Play light click sound
    audioSystem.playClick();
  };

  const handleFindLantern = () => {
    if (found) return;
    setFound(true);
    // Play magical success fanfares
    audioSystem.playSuccess();
    audioSystem.playLevelComplete();
  };

  // Light beam calculations
  const lightRadius = found ? 1200 : 80;
  const lightX = found ? lanternPos.x : mouse.x;
  const lightY = found ? lanternPos.y : mouse.y;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={handleSearchClick}
      className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-3xl border border-border cursor-none select-none"
    >
      {/* Garden Background (always rendered, obscured by darkness layer) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230c0828"/><ellipse cx="400" cy="460" rx="600" ry="180" fill="%2313173d"/><path d="M-50 450 Q200 350 400 450 Z" fill="%231a2254" opacity="0.6"/><path d="M350 450 Q550 370 850 450 Z" fill="%231e245b" opacity="0.6"/></svg>')`,
        }}
      />

      {/* Floating Fireflies (Drifting particles) */}
      {[...Array(12)].map((_, i) => {
        const speed = 4 + (i % 3) * 2;
        const delay = i * 0.4;
        return (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              left: `${(i * 13) % 90 + 5}%`,
              top: `${(i * 17) % 80 + 10}%`,
              background: "oklch(0.88 0.16 195)",
              boxShadow: "0 0 10px 3px oklch(0.88 0.16 195 / 0.8)",
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, 8, 0],
              opacity: [0.1, 0.9, 0.1],
            }}
            transition={{
              duration: speed,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Hidden flowers — only bloom when found */}
      <AnimatePresence>
        {found &&
          [18, 33, 50, 68, 83].map((x, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.15 + 0.3, type: "spring", stiffness: 120 }}
              className="absolute"
              style={{ left: `${x}%`, bottom: `${12 + (i % 2) * 5}%` }}
            >
              <Flower hue={290 + i * 22} />
              {/* Petal shine particles */}
              <motion.div
                className="absolute -top-3 left-3 h-1 w-1 rounded-full bg-white shadow-glow-moon"
                animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5 + (i % 2), repeat: Infinity }}
              />
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Lantern Glow aura under the lantern */}
      {found && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-[60px] pointer-events-none"
          style={{
            left: `${lanternPos.x}%`,
            top: `${lanternPos.y}%`,
            background: "radial-gradient(circle, rgba(255, 209, 102, 0.25) 0%, transparent 70%)"
          }}
        />
      )}

      {/* The lantern object */}
      <button
        onClick={handleFindLantern}
        aria-label="Lantern hotspot"
        className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full focus:outline-none"
        style={{ left: `${lanternPos.x}%`, top: `${lanternPos.y}%` }}
      >
        <AnimatePresence>
          {found ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="relative h-14 w-10 flex flex-col items-center"
            >
              {/* Lantern Glass Case & Bulb */}
              <div className="absolute top-2 w-7 h-8 rounded-md border border-[#ff8fb8]/30 bg-amber-400/30 flex items-center justify-center shadow-[0_0_30px_#ffd166]">
                <div className="h-4 w-4 rounded-full bg-yellow-100 animate-pulse" />
              </div>
              {/* Lantern Cap & Handle */}
              <div className="w-8 h-2 bg-[#2a1668] rounded-t-sm" />
              <div className="w-8 h-1 bg-[#2a1668] absolute bottom-4" />
              <div className="w-6 h-6 border-2 border-[#2a1668] border-b-0 rounded-t-full absolute -top-3" />
            </motion.div>
          ) : (
            // A barely visible, pulsing shadow outline of the lantern before it is clicked
            <motion.div
              animate={{ opacity: [0.03, 0.15, 0.03], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-10 w-8 rounded bg-yellow-200/10 border border-yellow-200/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
            />
          )}
        </AnimatePresence>
      </button>

      {/* DYNAMIC DARKNESS MASK OVERLAY */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle ${lightRadius}px at ${lightX}% ${lightY}%, transparent 0%, rgba(4, 3, 15, 0.98) 100%)`,
          transition: found ? "background 2.4s cubic-bezier(0.1, 0.8, 0.3, 1)" : "none",
        }}
      />

      {/* Instructions / Story overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
        <p className="rounded-full bg-black/60 px-5 py-2 text-xs font-medium text-foreground tracking-wide border border-white/5 shadow-2xl backdrop-blur-md">
          {found
            ? "✨ The lantern lights up! Light makes the flowers visible to our eyes."
            : "🔦 Move your flashlight to search the dark garden and tap to light the lantern..."}
        </p>
      </div>

      {/* Chapter completion action button */}
      {found && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, type: "spring" }}
          className="absolute inset-x-0 bottom-8 flex justify-center"
        >
          <button onClick={onComplete} className="btn-magic hover:scale-105 shadow-glow-magic px-8 py-3">
            Continue to Quick Check →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function Flower({ hue }: { hue: number }) {
  return (
    <svg width="50" height="70" viewBox="0 0 50 70" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
      {/* Stem */}
      <line x1="25" y1="70" x2="25" y2="35" stroke="#2f663b" strokeWidth="2.5" />
      {/* Leaves */}
      <path d="M25 50 Q12 45 15 38" fill="none" stroke="#2f663b" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 58 Q38 53 35 46" fill="none" stroke="#2f663b" strokeWidth="2" strokeLinecap="round" />
      {/* Petals */}
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="25"
          cy="22"
          rx="7"
          ry="12"
          fill={`hsl(${hue} 85% 68%)`}
          opacity="0.95"
          transform={`rotate(${a} 25 28)`}
        />
      ))}
      {/* Center Pistil */}
      <circle cx="25" cy="28" r="5" fill="#ffeaa7" />
    </svg>
  );
}
