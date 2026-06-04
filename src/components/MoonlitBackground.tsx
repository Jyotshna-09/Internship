import { motion } from "framer-motion";
import { useMemo } from "react";

// Decorative animated background: moon, stars, fireflies.
export function MoonlitBackground({ showMoon = true }: { showMoon?: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 3,
      })),
    [],
  );
  const fireflies = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        x: Math.random() * 100,
        y: 30 + Math.random() * 60,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * 4,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {/* Aurora wash */}
      <div className="absolute inset-0 opacity-60"
           style={{ background: "radial-gradient(ellipse at 70% 10%, color-mix(in oklab, var(--magic) 35%, transparent), transparent 55%), radial-gradient(ellipse at 10% 80%, color-mix(in oklab, var(--firefly) 25%, transparent), transparent 60%)" }} />

      {/* Stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Moon */}
      {showMoon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute top-[8%] right-[8%] w-44 h-44 rounded-full"
          style={{
            background: "var(--gradient-moon)",
            boxShadow: "var(--shadow-glow-moon), 0 0 120px 20px color-mix(in oklab, var(--moon) 35%, transparent)",
          }}
        />
      )}

      {/* Fireflies */}
      {fireflies.map((f, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: 6,
            height: 6,
            background: "var(--color-firefly)",
            boxShadow: "0 0 16px 4px color-mix(in oklab, var(--firefly) 70%, transparent)",
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 20, -10, 15, 0],
            opacity: [0.3, 1, 0.5, 1, 0.3],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
