import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { audioSystem } from "@/lib/audio";
import { Sparkles, Sun, ShieldAlert, Award } from "lucide-react";

type ToolType = "light" | "mirror" | "stone";

export function GardenRestorationScene({ onComplete }: { onComplete: () => void }) {
  // Sandbox item placements
  const [lightPlaced, setLightPlaced] = useState(false);
  const [mirrorPlaced, setMirrorPlaced] = useState(false);
  const [stonePlaced, setStonePlaced] = useState(false);
  
  // Mirror angle
  const [mirrorAngle, setMirrorAngle] = useState(0); // 0..180
  
  // Current active tool selected from drawer
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);

  // Cinematic end sequence
  const [cinematicBloom, setCinematicBloom] = useState(false);
  
  // Is the puzzle currently solved?
  // Pedestal has light, mirror is placed and rotated within 40..50 deg, stone blocks the ray
  const mirrorAimed = mirrorPlaced && Math.abs(mirrorAngle - 45) < 6;
  const puzzleSolved = lightPlaced && mirrorAimed && stonePlaced;

  useEffect(() => {
    if (puzzleSolved) {
      // Trigger cinematic ending sequence
      const t = setTimeout(() => {
        setCinematicBloom(true);
        audioSystem.playSuccess();
        audioSystem.playLevelComplete();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [puzzleSolved]);

  const selectTool = (tool: ToolType) => {
    audioSystem.playClick();
    setSelectedTool(tool);
  };

  const handlePlaceOnTarget = (target: "pedestal" | "mount" | "shadow") => {
    if (!selectedTool) return;
    
    if (selectedTool === "light" && target === "pedestal") {
      audioSystem.playSuccess();
      setLightPlaced(true);
      setSelectedTool(null);
    } else if (selectedTool === "mirror" && target === "mount") {
      audioSystem.playSuccess();
      setMirrorPlaced(true);
      setSelectedTool(null);
    } else if (selectedTool === "stone" && target === "shadow") {
      audioSystem.playSuccess();
      setStonePlaced(true);
      setSelectedTool(null);
    } else {
      audioSystem.playFailure();
    }
  };

  const rotateMirror = (dir: "cw" | "ccw") => {
    audioSystem.playClick();
    const step = dir === "cw" ? 5 : -5;
    setMirrorAngle((a) => (a + step + 360) % 360);
  };

  // Ray coordinates
  // Pedestal at (20, 48) shoots horizontally right to Mirror at (55, 48)
  // Reflected ray goes from (55, 48) vertically down to flower patch (55, 65)
  // Blocker sits at (55, 54) to cast shadow on lock sensor at (55, 62)
  const ray1X = 20;
  const ray1Y = 48;
  const ray1EndX = 55;
  const ray1EndY = 48;

  const ray2StartX = 55;
  const ray2StartY = 48;
  let ray2EndX = 55;
  let ray2EndY = 62; // hits sensor

  if (stonePlaced) {
    ray2EndY = 53; // blocked by stone
  }

  return (
    <div className="mx-auto w-full max-w-5xl select-none">
      {/* Cinematic blooming garden ending */}
      <AnimatePresence>
        {cinematicBloom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#07071c] z-30 flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Swarm of floating blooming fireflies and flowers */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-yellow-300"
                  style={{
                    left: `${(i * 17) % 95 + 2}%`,
                    top: `${(i * 23) % 90 + 5}%`,
                    boxShadow: "0 0 12px 4px rgba(255, 200, 50, 0.6)",
                  }}
                  animate={{
                    x: [0, Math.sin(i) * 20, 0],
                    y: [0, -40, 0],
                    scale: [0.8, 1.4, 0.8],
                    opacity: [0.2, 0.9, 0.2]
                  }}
                  transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>

            {/* Glowing climax message */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="glass max-w-xl rounded-3xl p-10 flex flex-col items-center shadow-[0_0_80px_rgba(255,200,50,0.15)]"
            >
              <div className="h-16 w-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-glow-moon mb-6 text-3xl">
                🏆
              </div>
              <h1 className="font-display text-4xl text-glow-moon text-yellow-100">Garden Savior Ordained!</h1>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Congratulations, Detective! By placing the natural **light source**, **reflecting** the rays around the hedges, and blocking the ray to cast a **shadow key**, you have successfully unlocked the seal and restored the entire Moonlight Garden to its full magical bloom.
              </p>

              <button
                onClick={onComplete}
                className="btn-magic mt-8 px-10 py-3.5 text-base hover:scale-105 shadow-glow-magic"
              >
                Claim Your Certificate →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sandbox Game Layout */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Side: Tool Drawer */}
        <div className="glass rounded-3xl p-5 flex flex-col gap-4 md:col-span-1">
          <div>
            <h3 className="font-display text-lg font-bold">Tool Cabinet</h3>
            <p className="text-xs text-muted-foreground mt-1">Tap a tool, then tap its target slot in the garden.</p>
          </div>

          <div className="flex flex-col gap-3 mt-3">
            {/* Tool 1: Light Orb */}
            <button
              onClick={() => selectTool("light")}
              disabled={lightPlaced}
              className={`rounded-2xl border p-4 text-left transition flex items-center gap-3 w-full ${
                lightPlaced 
                  ? "border-emerald-500/20 bg-emerald-500/5 opacity-40 cursor-default" 
                  : selectedTool === "light"
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-card/20 hover:bg-card/40"
              }`}
            >
              <div className="h-10 w-10 bg-yellow-400/20 text-yellow-300 rounded-xl flex items-center justify-center text-xl">
                ☀️
              </div>
              <div>
                <h4 className="font-semibold text-sm">Light Orb</h4>
                <span className="text-[10px] text-muted-foreground">Light source</span>
              </div>
            </button>

            {/* Tool 2: Silver Mirror */}
            <button
              onClick={() => selectTool("mirror")}
              disabled={mirrorPlaced}
              className={`rounded-2xl border p-4 text-left transition flex items-center gap-3 w-full ${
                mirrorPlaced 
                  ? "border-emerald-500/20 bg-emerald-500/5 opacity-40 cursor-default" 
                  : selectedTool === "mirror"
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-card/20 hover:bg-card/40"
              }`}
            >
              <div className="h-10 w-10 bg-cyan-400/20 text-cyan-300 rounded-xl flex items-center justify-center text-xl">
                🪞
              </div>
              <div>
                <h4 className="font-semibold text-sm">Silver Mirror</h4>
                <span className="text-[10px] text-muted-foreground">Reflects light</span>
              </div>
            </button>

            {/* Tool 3: Opaque Stone */}
            <button
              onClick={() => selectTool("stone")}
              disabled={stonePlaced}
              className={`rounded-2xl border p-4 text-left transition flex items-center gap-3 w-full ${
                stonePlaced 
                  ? "border-emerald-500/20 bg-emerald-500/5 opacity-40 cursor-default" 
                  : selectedTool === "stone"
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-card/20 hover:bg-card/40"
              }`}
            >
              <div className="h-10 w-10 bg-slate-400/20 text-slate-300 rounded-xl flex items-center justify-center text-xl">
                🪨
              </div>
              <div>
                <h4 className="font-semibold text-sm">Boulder Block</h4>
                <span className="text-[10px] text-muted-foreground">Casts shadow</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Sandbox Area */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-indigo-950/80 to-purple-950/70 shadow-2xl">
            {/* Background elements */}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-emerald-950/40 to-transparent" />

            {/* Vector lines and triggers */}
            <svg viewBox="0 0 100 56.25" className="absolute inset-0 h-full w-full">
              {/* Ray 1: Pedestal to Mirror */}
              {lightPlaced && (
                <line
                  x1={ray1X}
                  y1={ray1Y}
                  x2={ray1EndX}
                  y2={ray1EndY}
                  stroke="oklch(0.9 0.16 90)"
                  strokeWidth="0.8"
                  style={{ filter: "drop-shadow(0 0 4px gold)" }}
                />
              )}

              {/* Ray 2: Mirror to Sensor */}
              {lightPlaced && mirrorAimed && (
                <line
                  x1={ray2StartX}
                  y1={ray2StartY}
                  x2={ray2EndX}
                  y2={ray2EndY}
                  stroke="oklch(0.9 0.16 90)"
                  strokeWidth="0.8"
                  style={{ filter: "drop-shadow(0 0 4px gold)" }}
                />
              )}

              {/* Hedges layout (Opaque obstacles) */}
              <rect x="35" y="10" width="10" height="24" rx="2" fill="#2d6a4f" stroke="#1b4332" strokeWidth="0.5" />
              <text x="40" y="24" textAnchor="middle" fill="#52b788" fontSize="6">🌿</text>

              {/* Pedestal Target Spot */}
              <g transform="translate(20 48)" className="cursor-pointer" onClick={() => handlePlaceOnTarget("pedestal")}>
                <ellipse cx="0" cy="4" rx="4" ry="1.5" fill="#4b5563" stroke="#9ca3af" strokeWidth="0.3" />
                <rect x="-1.5" y="0" width="3" height="4" fill="#374151" stroke="#6b7280" strokeWidth="0.3" />
                {!lightPlaced && (
                  <circle cx="0" cy="0" r="3" fill="rgba(255,209,102,0.15)" stroke="#ffd166" strokeWidth="0.4" strokeDasharray="1 1" />
                )}
                {lightPlaced && (
                  <circle cx="0" cy="0" r="3" fill="oklch(0.9 0.14 90)" style={{ filter: "drop-shadow(0 0 10px gold)" }} />
                )}
              </g>

              {/* Mirror Mount Target Spot */}
              <g transform="translate(55 48)" className="cursor-pointer" onClick={() => handlePlaceOnTarget("mount")}>
                <rect x="-1" y="0" width="2" height="4" fill="#374151" stroke="#6b7280" strokeWidth="0.3" />
                {!mirrorPlaced && (
                  <circle cx="0" cy="0" r="3" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="0.4" strokeDasharray="1 1" />
                )}
                {mirrorPlaced && (
                  <g transform={`rotate(${mirrorAngle - 90})`}>
                    <rect x="-4" y="-0.5" width="8" height="1" fill="#22d3ee" stroke="#e0f2fe" strokeWidth="0.2" />
                  </g>
                )}
              </g>

              {/* Shadow Lock sensor */}
              <g transform="translate(55 62)">
                <circle cx="0" cy="0" r="2.2" fill={puzzleSolved ? "#22c55e" : "#ef4444"} opacity="0.8" />
                {/* Dotted lock silhouette */}
                <circle cx="0" cy="0" r="3.2" fill="none" stroke={puzzleSolved ? "#22c55e" : "#ef4444"} strokeWidth="0.3" strokeDasharray="0.8 0.8" />
              </g>
            </svg>

            {/* Opaque Stone Blocker target */}
            {mirrorAimed && (
              <div
                onClick={() => handlePlaceOnTarget("shadow")}
                className="absolute cursor-pointer flex items-center justify-center"
                style={{
                  left: "55%",
                  top: "54%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {!stonePlaced ? (
                  <div className="h-10 w-10 rounded-full border border-dashed border-slate-300 bg-white/5 flex items-center justify-center text-xs text-slate-300 font-semibold animate-pulse">
                    Block
                  </div>
                ) : (
                  <div className="text-2xl shadow-[0_0_20px_black] bg-[#1e293b] rounded-full p-1.5 border border-slate-500">
                    🪨
                  </div>
                )}
              </div>
            )}

            {/* Lock State Labels */}
            <div className="absolute right-6 top-6 flex flex-col gap-2 text-xs">
              <LockIndicator label="1. Ignite Light Pedestal" done={lightPlaced} />
              <LockIndicator label="2. Reflect Beam at 45°" done={mirrorAimed} />
              <LockIndicator label="3. Shadow Lock Blocked" done={stonePlaced} />
            </div>
            
            {/* Mirror Dial Rotator Controls */}
            {mirrorPlaced && !puzzleSolved && (
              <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/60 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Rotate Mirror:</span>
                <button onClick={() => rotateMirror("ccw")} className="rounded-full bg-white/5 p-1 text-xs hover:bg-white/15">↺</button>
                <span className="w-10 text-center font-display font-semibold text-sm">{mirrorAngle}°</span>
                <button onClick={() => rotateMirror("cw")} className="rounded-full bg-white/5 p-1 text-xs hover:bg-white/15">↻</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LockIndicator({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${
      done 
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" 
        : "border-border/30 bg-card/40 text-muted-foreground"
    }`}>
      <span className="text-[9px]">{done ? "✓" : "🔒"}</span>
      <span className="text-[10px] tracking-wide">{label}</span>
    </div>
  );
}
