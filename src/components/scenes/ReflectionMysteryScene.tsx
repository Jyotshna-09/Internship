import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { audioSystem } from "@/lib/audio";
import { RotateCw, Sparkles, AlertCircle } from "lucide-react";

type Round = 1 | 2 | 3;

interface Point2D {
  x: number;
  y: number;
}

export function ReflectionMysteryScene({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState<Round>(1);
  
  // Mirror angles in degrees
  const [angle1, setAngle1] = useState(45);
  const [angle2, setAngle2] = useState(90);
  const [angle3, setAngle3] = useState(135);
  const [activeMirror, setActiveMirror] = useState<1 | 2 | 3>(1);
  const [lockTimer, setLockTimer] = useState(0);

  // Source of light (top-left)
  const source: Point2D = { x: 10, y: 15 };

  // Targets (Flowers)
  const flower1: Point2D = { x: 85, y: 40 };
  const flower2: Point2D = { x: 85, y: 55 };
  const flower3: Point2D = { x: 88, y: 18 };

  // Mirror centers (fixed nodes)
  const m1_1: Point2D = { x: 50, y: 40 }; // R1

  const m2_1: Point2D = { x: 35, y: 45 }; // R2
  const m2_2: Point2D = { x: 65, y: 20 };

  const m3_1: Point2D = { x: 30, y: 50 }; // R3
  const m3_2: Point2D = { x: 52, y: 15 };
  const m3_3: Point2D = { x: 72, y: 50 };

  const r3Obstacle: Point2D = { x: 52, y: 42 }; // Stone block blocking the center in Round 3

  // Helper: vector math
  const normalize = (p: Point2D): Point2D => {
    const len = Math.hypot(p.x, p.y);
    return len === 0 ? { x: 0, y: 0 } : { x: p.x / len, y: p.y / len };
  };

  const getReflected = (incident: Point2D, mirrorAngleDeg: number): Point2D => {
    // Normal vector of the mirror
    // Mirror line is at mirrorAngleDeg. Normal is perpendicular: angle + 90
    const rad = ((mirrorAngleDeg - 90) * Math.PI) / 180;
    const normal = { x: Math.cos(rad), y: Math.sin(rad) };
    
    // Dot product
    const dot = incident.x * normal.x + incident.y * normal.y;
    
    // R = I - 2 * (I . N) * N
    return {
      x: incident.x - 2 * dot * normal.x,
      y: incident.y - 2 * dot * normal.y
    };
  };

  // Ray tracing algorithm
  const traceResult = useMemo(() => {
    let rays: { start: Point2D; end: Point2D; success: boolean }[] = [];
    let targetHit = false;

    if (round === 1) {
      // Ray from source to Mirror 1
      const I1 = normalize({ x: m1_1.x - source.x, y: m1_1.y - source.y });
      rays.push({ start: source, end: m1_1, success: true });

      // Reflect at Mirror 1
      const R1 = getReflected(I1, angle1);
      
      // Vector to target
      const V_target = { x: flower1.x - m1_1.x, y: flower1.y - m1_1.y };
      const R1_norm = normalize(R1);
      const Vt_norm = normalize(V_target);
      const cos = R1_norm.x * Vt_norm.x + R1_norm.y * Vt_norm.y;

      if (cos > 0.992) { // Within 5 degrees
        rays.push({ start: m1_1, end: flower1, success: true });
        targetHit = true;
      } else {
        // Shoots into space
        const spaceEnd = { x: m1_1.x + R1.x * 60, y: m1_1.y + R1.y * 60 };
        rays.push({ start: m1_1, end: spaceEnd, success: false });
      }

    } else if (round === 2) {
      // Ray to Mirror 1
      const I1 = normalize({ x: m2_1.x - source.x, y: m2_1.y - source.y });
      rays.push({ start: source, end: m2_1, success: true });

      // Reflect Mirror 1
      const R1 = getReflected(I1, angle1);
      const R1_norm = normalize(R1);

      // Check hit on Mirror 2
      const V_m2 = { x: m2_2.x - m2_1.x, y: m2_2.y - m2_1.y };
      const Vm2_norm = normalize(V_m2);
      const cos1 = R1_norm.x * Vm2_norm.x + R1_norm.y * Vm2_norm.y;

      if (cos1 > 0.992) {
        rays.push({ start: m2_1, end: m2_2, success: true });

        // Reflect Mirror 2
        const I2 = Vm2_norm;
        const R2 = getReflected(I2, angle2);
        const R2_norm = normalize(R2);

        // Check hit on flower
        const V_target = { x: flower2.x - m2_2.x, y: flower2.y - m2_2.y };
        const Vt_norm = normalize(V_target);
        const cos2 = R2_norm.x * Vt_norm.x + R2_norm.y * Vt_norm.y;

        if (cos2 > 0.992) {
          rays.push({ start: m2_2, end: flower2, success: true });
          targetHit = true;
        } else {
          const spaceEnd = { x: m2_2.x + R2.x * 60, y: m2_2.y + R2.y * 60 };
          rays.push({ start: m2_2, end: spaceEnd, success: false });
        }
      } else {
        const spaceEnd = { x: m2_1.x + R1.x * 60, y: m2_1.y + R1.y * 60 };
        rays.push({ start: m2_1, end: spaceEnd, success: false });
      }

    } else if (round === 3) {
      // Ray to Mirror 1
      const I1 = normalize({ x: m3_1.x - source.x, y: m3_1.y - source.y });
      rays.push({ start: source, end: m3_1, success: true });

      // Reflect Mirror 1
      const R1 = getReflected(I1, angle1);
      const R1_norm = normalize(R1);

      // Check hit on Mirror 2
      const V_m2 = { x: m3_2.x - m3_1.x, y: m3_2.y - m3_1.y };
      const Vm2_norm = normalize(V_m2);
      const cos1 = R1_norm.x * Vm2_norm.x + R1_norm.y * Vm2_norm.y;

      if (cos1 > 0.992) {
        rays.push({ start: m3_1, end: m3_2, success: true });

        // Reflect Mirror 2
        const I2 = Vm2_norm;
        const R2 = getReflected(I2, angle2);
        const R2_norm = normalize(R2);

        // Check hit on Mirror 3
        const V_m3 = { x: m3_3.x - m3_2.x, y: m3_3.y - m3_2.y };
        const Vm3_norm = normalize(V_m3);
        const cos2 = R2_norm.x * Vm3_norm.x + R2_norm.y * Vm3_norm.y;

        if (cos2 > 0.992) {
          rays.push({ start: m3_2, end: m3_3, success: true });

          // Reflect Mirror 3
          const I3 = Vm3_norm;
          const R3 = getReflected(I3, angle3);
          const R3_norm = normalize(R3);

          // Check hit on flower
          const V_target = { x: flower3.x - m3_3.x, y: flower3.y - m3_3.y };
          const Vt_norm = normalize(V_target);
          const cos3 = R3_norm.x * Vt_norm.x + R3_norm.y * Vt_norm.y;

          if (cos3 > 0.992) {
            rays.push({ start: m3_3, end: flower3, success: true });
            targetHit = true;
          } else {
            const spaceEnd = { x: m3_3.x + R3.x * 60, y: m3_3.y + R3.y * 60 };
            rays.push({ start: m3_3, end: spaceEnd, success: false });
          }
        } else {
          const spaceEnd = { x: m3_2.x + R2.x * 60, y: m3_2.y + R2.y * 60 };
          rays.push({ start: m3_2, end: spaceEnd, success: false });
        }
      } else {
        const spaceEnd = { x: m3_1.x + R1.x * 60, y: m3_1.y + R1.y * 60 };
        rays.push({ start: m3_1, end: spaceEnd, success: false });
      }
    }

    return { rays, targetHit };
  }, [round, angle1, angle2, angle3]);

  // Lock target timer
  useEffect(() => {
    let t: any;
    if (traceResult.targetHit) {
      t = setInterval(() => {
        setLockTimer((p) => {
          if (p >= 100) {
            clearInterval(t);
            handleNextRound();
            return 100;
          }
          return p + 12; // 1s delay
        });
      }, 100);
    } else {
      setLockTimer(0);
    }
    return () => clearInterval(t);
  }, [traceResult.targetHit]);

  const handleNextRound = () => {
    audioSystem.playSuccess();
    setLockTimer(0);
    if (round === 1) {
      setRound(2);
      setActiveMirror(1);
    } else if (round === 2) {
      setRound(3);
      setActiveMirror(1);
    } else {
      audioSystem.playLevelComplete();
    }
  };

  const handleRotate = (dir: "ccw" | "cw") => {
    audioSystem.playClick();
    const step = dir === "cw" ? 5 : -5;
    if (activeMirror === 1) {
      setAngle1((a) => (a + step + 360) % 360);
    } else if (activeMirror === 2) {
      setAngle2((a) => (a + step + 360) % 360);
    } else {
      setAngle3((a) => (a + step + 360) % 360);
    }
  };

  const currentAngle = activeMirror === 1 ? angle1 : activeMirror === 2 ? angle2 : angle3;

  return (
    <div className="mx-auto w-full max-w-4xl select-none">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-indigo-950/70 to-purple-950/60 shadow-2xl">
        
        {/* Round Badge */}
        <div className="absolute left-6 top-6 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground z-10 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          <span>Mirrors:</span>
          <span className={`px-2 py-0.5 rounded-full bg-primary/25 text-primary-foreground font-bold`}>
            Round {round}/3
          </span>
        </div>

        {/* Vector SVG Arena */}
        <svg viewBox="0 0 100 70" className="absolute inset-0 h-full w-full">
          {/* Light rays drawing */}
          {traceResult.rays.map((ray, idx) => (
            <line
              key={idx}
              x1={ray.start.x}
              y1={ray.start.y}
              x2={ray.end.x}
              y2={ray.end.y}
              stroke={traceResult.targetHit ? "oklch(0.9 0.16 90)" : "oklch(0.85 0.16 90 / 0.55)"}
              strokeWidth="0.7"
              strokeDasharray={ray.success ? "none" : "2 2"}
              style={{
                filter: `drop-shadow(0 0 ${ray.success && traceResult.targetHit ? "6px" : "1.5px"} oklch(0.9 0.16 90))`
              }}
            />
          ))}

          {/* Draw light source */}
          <circle cx={source.x} cy={source.y} r="2.5" fill="oklch(0.9 0.14 90)" style={{ filter: "drop-shadow(0 0 8px gold)" }} />

          {/* Render Mirrors */}
          {round === 1 && (
            <MirrorNode x={m1_1.x} y={m1_1.y} angle={angle1} active={activeMirror === 1} onClick={() => setActiveMirror(1)} label="A" />
          )}

          {round === 2 && (
            <>
              <MirrorNode x={m2_1.x} y={m2_1.y} angle={angle1} active={activeMirror === 1} onClick={() => setActiveMirror(1)} label="A" />
              <MirrorNode x={m2_2.x} y={m2_2.y} angle={angle2} active={activeMirror === 2} onClick={() => setActiveMirror(2)} label="B" />
            </>
          )}

          {round === 3 && (
            <>
              <MirrorNode x={m3_1.x} y={m3_1.y} angle={angle1} active={activeMirror === 1} onClick={() => setActiveMirror(1)} label="A" />
              <MirrorNode x={m3_2.x} y={m3_2.y} angle={angle2} active={activeMirror === 2} onClick={() => setActiveMirror(2)} label="B" />
              <MirrorNode x={m3_3.x} y={m3_3.y} angle={angle3} active={activeMirror === 3} onClick={() => setActiveMirror(3)} label="C" />

              {/* Stone wall blocker */}
              <rect x={r3Obstacle.x - 3} y={r3Obstacle.y - 12} width="6" height="24" rx="1.5" fill="#2c2c35" stroke="#4a4a58" strokeWidth="0.3" />
              <text x={r3Obstacle.x} y={r3Obstacle.y + 2} textAnchor="middle" fill="#9ca3af" fontSize="4">🧱</text>
            </>
          )}
        </svg>

        {/* Target Flowers */}
        {round === 1 && (
          <div className="absolute" style={{ right: "12%", top: `${(flower1.y / 70) * 100}%`, transform: "translateY(-50%)" }}>
            <FlowerSVG lit={traceResult.targetHit} hue={350} />
          </div>
        )}
        {round === 2 && (
          <div className="absolute" style={{ right: "12%", top: `${(flower2.y / 70) * 100}%`, transform: "translateY(-50%)" }}>
            <FlowerSVG lit={traceResult.targetHit} hue={310} />
          </div>
        )}
        {round === 3 && (
          <div className="absolute" style={{ right: "9%", top: `${(flower3.y / 70) * 100}%`, transform: "translateY(-50%)" }}>
            <FlowerSVG lit={traceResult.targetHit} hue={280} />
          </div>
        )}

        {/* Lock loading state */}
        {traceResult.targetHit && lockTimer < 100 && (
          <div className="absolute left-1/2 bottom-24 -translate-x-1/2 bg-black/60 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-md z-10">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-yellow-300 font-bold">Locking Reflection</span>
            <div className="h-1.5 w-16 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300" style={{ width: `${lockTimer}%` }} />
            </div>
          </div>
        )}

        {/* Interactive Mirrors Control Center */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <div className="glass flex items-center gap-4 rounded-full px-5 py-2.5">
            {/* Mirror selectors */}
            <div className="flex gap-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1 self-center">Select Mirror:</span>
              <button
                onClick={() => { audioSystem.playClick(); setActiveMirror(1); }}
                className={`h-8 w-8 rounded-full text-xs font-bold border transition ${
                  activeMirror === 1 ? "bg-primary text-white border-primary" : "bg-card/40 border-border/30 text-muted-foreground"
                }`}
              >
                A
              </button>
              {round >= 2 && (
                <button
                  onClick={() => { audioSystem.playClick(); setActiveMirror(2); }}
                  className={`h-8 w-8 rounded-full text-xs font-bold border transition ${
                    activeMirror === 2 ? "bg-primary text-white border-primary" : "bg-card/40 border-border/30 text-muted-foreground"
                  }`}
                >
                  B
                </button>
              )}
              {round === 3 && (
                <button
                  onClick={() => { audioSystem.playClick(); setActiveMirror(3); }}
                  className={`h-8 w-8 rounded-full text-xs font-bold border transition ${
                    activeMirror === 3 ? "bg-primary text-white border-primary" : "bg-card/40 border-border/30 text-muted-foreground"
                  }`}
                >
                  C
                </button>
              )}
            </div>

            {/* Dials controllers */}
            <div className="flex items-center gap-2 border-l border-white/15 pl-4">
              <button
                onClick={() => handleRotate("ccw")}
                className="rounded-full bg-card/40 p-1.5 border border-white/10 hover:bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                title="Rotate CCW"
              >
                ↺
              </button>
              
              <div className="w-14 text-center font-display text-sm font-semibold">
                {currentAngle}°
              </div>

              <button
                onClick={() => handleRotate("cw")}
                className="rounded-full bg-card/40 p-1.5 border border-white/10 hover:bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                title="Rotate CW"
              >
                ↻
              </button>
            </div>
          </div>
        </div>

      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        Select a mirror (A, B, C) and rotate it. Bounce the light beam off mirrors to target the flower. **Angle in = angle out!**
      </p>

      {/* Completion continue */}
      {round === 3 && traceResult.targetHit && lockTimer >= 100 && (
        <div className="mt-4 flex justify-center">
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onComplete}
            className="btn-magic hover:scale-105"
          >
            Awaken sleeping rose — Continue →
          </motion.button>
        </div>
      )}
    </div>
  );
}

function MirrorNode({
  x, y, angle, active, onClick, label,
}: {
  x: number; y: number; angle: number; active: boolean; onClick: () => void; label: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`} onClick={onClick} className="cursor-pointer">
      {/* Outer focus halo if active */}
      {active && (
        <circle cx="0" cy="0" r="8" fill="none" stroke="oklch(0.85 0.16 90)" strokeWidth="0.4" strokeDasharray="1 1" className="animate-spin" style={{ transformOrigin: "0 0", animationDuration: "12s" }} />
      )}
      
      {/* Rotating Mirror Line */}
      <g transform={`rotate(${angle - 90})`}>
        {/* Mirror backing */}
        <rect x="-6" y="0.2" width="12" height="0.8" fill="#52526b" rx="0.2" />
        {/* Mirror shiny glass */}
        <rect x="-6" y="-0.8" width="12" height="1.0" fill="#a5f3fc" stroke="#22d3ee" strokeWidth="0.25" rx="0.2" />
      </g>
      
      {/* Center anchor pivot */}
      <circle cx="0" cy="0" r="1.3" fill={active ? "#a5f3fc" : "#4b5563"} />
      <text x="0" y="5" textAnchor="middle" fontSize="2.8" fill={active ? "#a5f3fc" : "#9ca3af"} fontWeight="bold">
        {label}
      </text>
    </g>
  );
}

function FlowerSVG({ lit, hue }: { lit: boolean; hue: number }) {
  return (
    <svg width="60" height="70" viewBox="0 0 80 100">
      <line x1="40" y1="100" x2="40" y2="55" stroke="#3a7a4a" strokeWidth="3" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a} cx="40" cy="30" rx="10" ry="16"
          fill={lit ? `hsl(${hue} 85% 65%)` : "#3f3f5c"}
          transform={`rotate(${a} 40 40)`} opacity="0.95"
          className="transition-colors duration-500"
        />
      ))}
      <circle cx="40" cy="40" r="6" fill={lit ? "#fff7ad" : "#5d5d7e"} className="transition-colors duration-500" />
    </svg>
  );
}
