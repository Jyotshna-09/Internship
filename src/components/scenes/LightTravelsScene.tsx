import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { audioSystem } from "@/lib/audio";
import { ChevronRight, ShieldAlert, Award } from "lucide-react";

type Round = 1 | 2 | 3;

export function LightTravelsScene({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState<Round>(1);
  const [angle, setAngle] = useState(25); // angle in degrees
  const [height, setHeight] = useState(45); // Y position of lantern: 15..55
  const [successTimer, setSuccessTimer] = useState(0); // 0..100 for lock progression
  
  // Round 2 state: tracking which flowers are lit
  const [r2Lit, setR2Lit] = useState<boolean[]>([false, false, false]);
  const [r2TargetIdx, setR2TargetIdx] = useState(0); // current target index (0, 1, 2)

  // Position definitions (out of 100 x 70 SVG coordinates)
  const lanternX = 15;
  const lanternY = height;

  // Flowers:
  // Round 1: 1 flower
  const r1Flower = { x: 82, y: 20 };
  
  // Round 2: 3 flowers
  const r2Flowers = [
    { x: 82, y: 15 },
    { x: 82, y: 35 },
    { x: 82, y: 55 },
  ];

  // Round 3: 1 flower, 1 obstacle
  const r3Flower = { x: 82, y: 18 };
  const obstacleX = 48;
  const obstacleYMin = 22;
  const obstacleYMax = 48; // blocks middle height

  // Check if beam hits a target
  const getAngleToPoint = (x: number, y: number) => {
    const dx = x - lanternX;
    const dy = lanternY - y; // Screen Y goes down, math Y goes up
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  // Ray Casting math
  let isBlocked = false;
  let beamEndX = 85;
  let beamEndY = 45;

  // Calculate current beam end point
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = -Math.sin(rad);

  if (round === 3) {
    // Check intersection with vertical obstacle at X = 48
    // X_lantern + t * dx = 48 -> t = (48 - X_lantern) / dx
    if (dx > 0) {
      const t = (obstacleX - lanternX) / dx;
      const intersectY = lanternY + t * dy;
      if (intersectY >= obstacleYMin && intersectY <= obstacleYMax) {
        isBlocked = true;
        beamEndX = obstacleX;
        beamEndY = intersectY;
      }
    }
  }

  // Calculate final endpoint if not blocked
  if (!isBlocked) {
    const t = (82 - lanternX) / dx;
    beamEndX = 82;
    beamEndY = lanternY + t * dy;
  }

  // Check if target is hit
  let targetAngle = 0;
  let within = false;

  if (round === 1) {
    targetAngle = getAngleToPoint(r1Flower.x, r1Flower.y);
    within = Math.abs(angle - targetAngle) < 3.5;
  } else if (round === 2) {
    const tf = r2Flowers[r2TargetIdx];
    targetAngle = getAngleToPoint(tf.x, tf.y);
    within = Math.abs(angle - targetAngle) < 3.5;
  } else {
    // Round 3
    targetAngle = getAngleToPoint(r3Flower.x, r3Flower.y);
    within = Math.abs(angle - targetAngle) < 3.5 && !isBlocked;
  }

  // Check lock progression timer
  useEffect(() => {
    let t: any;
    if (within) {
      t = setInterval(() => {
        setSuccessTimer((prev) => {
          if (prev >= 100) {
            clearInterval(t);
            handleRoundProgress();
            return 100;
          }
          return prev + 12; // about 1 second lock time
        });
      }, 100);
    } else {
      setSuccessTimer(0);
    }
    return () => clearInterval(t);
  }, [within, round, r2TargetIdx]);

  const handleRoundProgress = () => {
    audioSystem.playSuccess();
    setSuccessTimer(0);

    if (round === 1) {
      setRound(2);
      setR2TargetIdx(0);
      setR2Lit([false, false, false]);
    } else if (round === 2) {
      if (r2TargetIdx < 2) {
        const nextIdx = r2TargetIdx + 1;
        setR2Lit((prev) => {
          const next = [...prev];
          next[r2TargetIdx] = true;
          return next;
        });
        setR2TargetIdx(nextIdx);
      } else {
        setR2Lit([true, true, true]);
        setRound(3);
        setAngle(10); // reset angle
      }
    } else {
      // Completed all rounds
      audioSystem.playLevelComplete();
    }
  };

  const handleNextBtn = () => {
    audioSystem.playClick();
    onComplete();
  };

  return (
    <div className="mx-auto w-full max-w-4xl select-none">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-indigo-950/70 to-purple-950/60 shadow-2xl">
        
        {/* Round Indicators */}
        <div className="absolute left-6 top-6 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground z-10 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          <span>Difficulty:</span>
          <span className={`px-2 py-0.5 rounded-full ${round === 1 ? "bg-emerald-400/20 text-emerald-200" : round === 2 ? "bg-amber-400/20 text-amber-200" : "bg-rose-400/20 text-rose-200"}`}>
            Level {round}/3
          </span>
        </div>

        {/* 2D Vector SVG Canvas */}
        <svg viewBox="0 0 100 70" className="absolute inset-0 h-full w-full">
          {/* Animated Light Ray Beam */}
          <line
            x1={lanternX}
            y1={lanternY}
            x2={beamEndX}
            y2={beamEndY}
            stroke={within ? "oklch(0.9 0.16 90)" : "oklch(0.85 0.16 90 / 0.55)"}
            strokeWidth="0.8"
            strokeDasharray={within ? "none" : "3 1.5"}
            strokeLinecap="round"
            className="transition-all"
            style={{
              filter: `drop-shadow(0 0 ${within ? "6px" : "2px"} oklch(0.9 0.16 90))`,
            }}
          />

          {/* Running light particles down the beam */}
          {within && (
            <circle cx={beamEndX} cy={beamEndY} r="1.5" fill="#ffffff">
              <animate attributeName="r" values="1.5;3.2;1.5" dur="1s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Round 3: Draw Obstacle Block */}
          {round === 3 && (
            <g transform={`translate(${obstacleX} ${obstacleYMin})`}>
              {/* Opaque Stone Brick Pillar */}
              <rect
                x="-2.5"
                y="0"
                width="5"
                height={obstacleYMax - obstacleYMin}
                rx="1"
                fill="#2c2c35"
                stroke="#474757"
                strokeWidth="0.4"
              />
              {/* Caution warning indicator */}
              <text x="0" y="16" fill="#f87171" fontSize="3" fontWeight="bold" textAnchor="middle">
                ⚠️
              </text>
            </g>
          )}

          {/* Render Lantern Object */}
          <g transform={`translate(${lanternX} ${lanternY})`}>
            <circle
              cx="0"
              cy="0"
              r="2.8"
              fill="oklch(0.9 0.14 90)"
              style={{ filter: "drop-shadow(0 0 8px gold)" }}
            />
            {/* Draw aiming cone */}
            <path
              d="M 2 0 L 6 -3 L 6 3 Z"
              fill="rgba(255,209,102,0.4)"
              transform={`rotate(${-angle})`}
            />
            <rect x="-3" y="-3" width="1" height="6" fill="#3a2680" rx="0.5" />
          </g>
        </svg>

        {/* Flower Target 1 */}
        {round === 1 && (
          <div className="absolute right-12 top-0 bottom-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: within ? 1.15 : 1,
                filter: within ? "drop-shadow(0 0 25px gold)" : "drop-shadow(0 0 0 transparent)",
              }}
            >
              <FlowerSVG lit={within} hue={310} />
            </motion.div>
          </div>
        )}

        {/* Flower Targets Round 2 */}
        {round === 2 && (
          <>
            {r2Flowers.map((f, idx) => {
              const isCurrentTarget = idx === r2TargetIdx;
              const isAlreadyLit = r2Lit[idx] || (isCurrentTarget && within);
              return (
                <div
                  key={idx}
                  className="absolute"
                  style={{
                    right: "12%",
                    top: `${(f.y / 70) * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isCurrentTarget && within ? 1.18 : isCurrentTarget ? 1.05 : 0.9,
                      filter: isAlreadyLit ? "drop-shadow(0 0 20px gold)" : "none",
                    }}
                    className="relative"
                  >
                    {isCurrentTarget && (
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-glow-magic animate-bounce text-xs font-bold">
                        👉
                      </span>
                    )}
                    <FlowerSVG lit={isAlreadyLit} hue={280 + idx * 40} />
                  </motion.div>
                </div>
              );
            })}
          </>
        )}

        {/* Flower Target Round 3 */}
        {round === 3 && (
          <div
            className="absolute"
            style={{
              right: "12%",
              top: `${(r3Flower.y / 70) * 100}%`,
              transform: "translateY(-50%)",
            }}
          >
            <motion.div
              animate={{
                scale: within ? 1.15 : 1,
                filter: within ? "drop-shadow(0 0 25px gold)" : "none",
              }}
            >
              <FlowerSVG lit={within} hue={340} />
            </motion.div>
          </div>
        )}

        {/* Ray blocked hint banner */}
        {round === 3 && isBlocked && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-rose-500/25 border border-rose-500/40 text-rose-200 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm">
            <ShieldAlert className="h-3.5 w-3.5" /> Light ray blocked! Move lantern up/down to bypass obstacle.
          </div>
        )}

        {/* Beam Locked Charging Progress Indicator */}
        {within && successTimer < 100 && (
          <div className="absolute left-1/2 bottom-20 -translate-x-1/2 bg-black/50 border border-white/10 rounded-full px-4 py-1 flex items-center gap-2 backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-wider text-yellow-300 font-bold">Locking Beam</span>
            <div className="h-1.5 w-16 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300" style={{ width: `${successTimer}%` }} />
            </div>
          </div>
        )}

        {/* Controls Footer */}
        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4">
          <div className="glass flex flex-wrap items-center justify-center gap-5 rounded-full px-6 py-3 w-fit">
            
            {/* Angle Control Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Angle</span>
              <input
                type="range"
                min={-30}
                max={60}
                value={angle}
                onChange={(e) => {
                  setAngle(Number(e.target.value));
                  if (timeLeft % 3 === 0) audioSystem.playClick();
                }}
                className="w-40 accent-[oklch(0.85_0.16_90)]"
              />
              <span className="w-8 text-right text-xs font-semibold">{angle}°</span>
            </div>

            {/* Height Control Slider (Rounds 3 only) */}
            {round === 3 && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-5">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Height</span>
                <input
                  type="range"
                  min={15}
                  max={55}
                  value={height}
                  onChange={(e) => {
                    setHeight(Number(e.target.value));
                    if (timeLeft % 3 === 0) audioSystem.playClick();
                  }}
                  className="w-40 accent-[oklch(0.85_0.16_90)]"
                />
                <span className="w-8 text-right text-xs font-semibold">{Math.round(height)}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        {round === 3 
          ? "Raise or lower the lantern height and adjust the angle to point the light ray around the stone block." 
          : "Rotate the lantern's tilt to direct the straight-line light ray onto the target flowers."}
      </p>

      {/* Level Completion Continue */}
      {round === 3 && within && successTimer >= 100 && (
        <div className="mt-4 flex justify-center">
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleNextBtn}
            className="btn-magic hover:scale-105"
          >
            All Chapters Restored — Continue →
          </motion.button>
        </div>
      )}
    </div>
  );
}

function FlowerSVG({ lit, hue }: { lit: boolean; hue: number }) {
  return (
    <svg width="60" height="70" viewBox="0 0 80 100">
      <line x1="40" y1="100" x2="40" y2="55" stroke="#3a7a4a" strokeWidth="3" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="40"
          cy="30"
          rx="11"
          ry="18"
          fill={lit ? `hsl(${hue} 85% 68%)` : "#45386f"}
          transform={`rotate(${a} 40 40)`}
          opacity="0.95"
          className="transition-colors duration-500"
        />
      ))}
      <circle cx="40" cy="40" r="7" fill={lit ? "#fff7ad" : "#7261a8"} className="transition-colors duration-500" />
    </svg>
  );
}
